/**
 * Robust Markdown & Code Block Parser with 100% Python Indentation Preservation
 */

export interface CodeSection {
  type: 'code';
  code: string;
  language: string;
  isUnclosed?: boolean;
}

export interface TextSection {
  type: 'text';
  text: string;
}

export type MarkdownSection = CodeSection | TextSection;

/**
 * Normalizes line endings and converts tabs to 4 spaces to guarantee
 * consistent indentation across all environments.
 */
export function normalizeIndentation(text: string): string {
  if (!text) return '';
  // Convert CRLF to LF
  let normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Expand tabs to 4 spaces
  normalized = normalized.replace(/\t/g, '    ');
  return normalized;
}

/**
 * Cleans code block body without stripping leading indentation from code lines.
 */
export function cleanCodeBody(rawCode: string): string {
  const normalized = normalizeIndentation(rawCode);
  // Remove only leading and trailing single newline if present from fence boundary
  let code = normalized;
  if (code.startsWith('\n')) {
    code = code.slice(1);
  }
  if (code.endsWith('\n')) {
    code = code.slice(0, -1);
  }
  return code;
}

/**
 * Detects whether a plain text block is actually raw code (e.g. without markdown backticks)
 */
export function detectRawCode(text: string): { isCode: boolean; language: string; cleanedCode: string } {
  const normalized = normalizeIndentation(text);
  const lines = normalized.split('\n');
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);

  if (nonEmptyLines.length < 2) {
    return { isCode: false, language: '', cleanedCode: text };
  }

  // 1. Check if it's a 4-space indented markdown code block
  const allIndented = nonEmptyLines.length >= 2 && nonEmptyLines.every(l => /^ {4}/.test(l));
  if (allIndented) {
    const unindented = lines.map(l => (l.startsWith('    ') ? l.slice(4) : l)).join('\n');
    const isPy = /\b(def|class|import|elif|return|print)\b/.test(unindented);
    return {
      isCode: true,
      language: isPy ? 'python' : 'text',
      cleanedCode: cleanCodeBody(unindented)
    };
  }

  // 2. Check for strong Python indicators
  let pythonHits = 0;
  for (const line of nonEmptyLines) {
    if (/^\s*(?:def\s+[a-zA-Z0-9_]+\s*\(|class\s+[a-zA-Z0-9_]+|import\s+[a-zA-Z0-9_]+|from\s+[a-zA-Z0-9_.]+\s+import|if\s+.*:|elif\s+.*:|while\s+.*:|for\s+.*in\s+.*:|with\s+.*as\s+.*:|except(?:\s+.*)?:|@\w+|print\(|async\s+def\s+)/.test(line)) {
      pythonHits++;
    }
  }

  if (pythonHits >= 2 || (pythonHits >= 1 && nonEmptyLines.length <= 8 && nonEmptyLines.some(l => /^ {4}/.test(l)))) {
    return {
      isCode: true,
      language: 'python',
      cleanedCode: cleanCodeBody(normalized)
    };
  }

  // 3. Check for strong TypeScript/JavaScript indicators
  let jsHits = 0;
  for (const line of nonEmptyLines) {
    if (/^\s*(?:import\s+.*from\s+['"]|export\s+(?:default\s+)?(?:function|class|const|interface|type)|const\s+[a-zA-Z0-9_]+\s*=\s*(?:\(async|\(|function|\{)|function\s+[a-zA-Z0-9_]+\s*\(|interface\s+[A-Z]|type\s+[A-Z]\w*\s*=)/.test(line)) {
      jsHits++;
    }
  }

  if (jsHits >= 2) {
    return {
      isCode: true,
      language: 'typescript',
      cleanedCode: cleanCodeBody(normalized)
    };
  }

  return { isCode: false, language: '', cleanedCode: text };
}

/**
 * Splits markdown content into alternating text and code sections.
 * Robustly captures both closed (```lang\n...```) and streaming unclosed (```lang\n...) blocks.
 */
export function parseMarkdownSections(content: string): MarkdownSection[] {
  if (!content) return [];

  const normalized = normalizeIndentation(content);
  const sections: MarkdownSection[] = [];

  // Match ```lang\n...``` or ~~~lang\n...~~~ OR unclosed ```lang\n... at end of stream
  const fenceRegex = /(?:^|\n)(```|~~~)([a-zA-Z0-9_\-\.\+#]*)[^\n]*\n([\s\S]*?)(?:\n\1(?:\n|$)|$)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(normalized)) !== null) {
    const fullMatch = match[0];
    const matchStart = match.index + (fullMatch.startsWith('\n') ? 1 : 0);
    const matchEnd = match.index + fullMatch.length;

    // Capture preceding text
    if (matchStart > lastIndex) {
      const textChunk = normalized.slice(lastIndex, matchStart);
      if (textChunk.trim()) {
        const rawCheck = detectRawCode(textChunk);
        if (rawCheck.isCode) {
          sections.push({
            type: 'code',
            code: rawCheck.cleanedCode,
            language: rawCheck.language
          });
        } else {
          sections.push({ type: 'text', text: textChunk });
        }
      }
    }

    const fence = match[1];
    let language = (match[2] || '').trim().toLowerCase();
    const rawCode = match[3] || '';
    const isUnclosed = !fullMatch.includes(`\n${fence}`);

    // If language was omitted, attempt auto-detection from code content
    if (!language) {
      if (/\b(def|class|import|elif|self|print|None|True|False)\b/.test(rawCode) || /:\s*$/.test(rawCode.split('\n')[0] || '')) {
        language = 'python';
      } else if (/\b(const|let|var|function|interface|export|import)\b/.test(rawCode)) {
        language = 'typescript';
      }
    }

    sections.push({
      type: 'code',
      code: cleanCodeBody(rawCode),
      language,
      isUnclosed
    });

    lastIndex = matchEnd;
  }

  // Capture trailing text
  if (lastIndex < normalized.length) {
    const remainingText = normalized.slice(lastIndex);
    if (remainingText.trim()) {
      const rawCheck = detectRawCode(remainingText);
      if (rawCheck.isCode) {
        sections.push({
          type: 'code',
          code: rawCheck.cleanedCode,
          language: rawCheck.language
        });
      } else {
        sections.push({ type: 'text', text: remainingText });
      }
    }
  }

  // If no fences matched at all, check if the entire content is raw code
  if (sections.length === 0 && normalized.trim()) {
    const rawCheck = detectRawCode(normalized);
    if (rawCheck.isCode) {
      sections.push({
        type: 'code',
        code: rawCheck.cleanedCode,
        language: rawCheck.language
      });
    } else {
      sections.push({ type: 'text', text: normalized });
    }
  }

  return sections;
}
