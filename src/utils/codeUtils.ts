/**
 * Utilities for analyzing code blocks and large message truncation
 */

export function isBigCodeSnippet(code: string, minLines = 8, minChars = 350): boolean {
  if (!code) return false;
  const lineCount = code.split('\n').length;
  return lineCount > minLines || code.length > minChars;
}

export function isBigTextMessage(text: string, minLines = 4, minChars = 240): boolean {
  if (!text) return false;
  const lineCount = text.split('\n').length;
  return lineCount > minLines || text.length > minChars;
}

export function getFileExtension(language: string): string {
  const lang = (language || '').toLowerCase().trim();
  const map: Record<string, string> = {
    typescript: 'ts',
    ts: 'ts',
    tsx: 'tsx',
    javascript: 'js',
    js: 'js',
    jsx: 'jsx',
    python: 'py',
    py: 'py',
    rust: 'rs',
    rs: 'rs',
    golang: 'go',
    go: 'go',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    bash: 'sh',
    shell: 'sh',
    sh: 'sh',
    markdown: 'md',
    md: 'md',
    yaml: 'yaml',
    yml: 'yaml'
  };
  return map[lang] || 'txt';
}

export function isLargeCodeFile(code: string, minLines = 18, minChars = 500): boolean {
  if (!code) return false;
  const lineCount = code.split('\n').length;
  return lineCount >= minLines || code.length >= minChars;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Intelligently infers a clean filename with the appropriate extension
 * from code comments, declarations, or language keywords.
 */
export function inferCodeFileName(code: string, language: string, index = 1): string {
  const ext = getFileExtension(language);
  if (!code) return `file_${index}.${ext}`;

  const lines = code.trim().split('\n');
  const firstFew = lines.slice(0, 5);

  // 1. Look for explicit filename in leading comments e.g. // filename: foo.ts or # foo.py or /* foo.tsx */
  for (const line of firstFew) {
    const trimmed = line.trim();
    const commentMatch = trimmed.match(/^(?:\/\/|#|\/\*|<!--)\s*(?:filename:?|file:?|filepath:?)?\s*([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+)/i);
    if (commentMatch && commentMatch[1]) {
      const candidate = commentMatch[1].split('/').pop();
      if (candidate && candidate.includes('.')) {
        return candidate;
      }
    }
  }

  // 2. Look for React / TS component exports: export default function Foo or const Foo: React.FC
  for (const line of lines) {
    const compMatch = line.match(/(?:export\s+default\s+function|export\s+const|function)\s+([A-Z][a-zA-Z0-9_]+)/);
    if (compMatch && compMatch[1]) {
      const name = compMatch[1];
      const actualExt = ext === 'js' ? 'jsx' : ext === 'ts' ? 'tsx' : ext;
      return `${name}.${actualExt}`;
    }
  }

  // 3. Look for Class or Interface definition
  for (const line of lines) {
    const classMatch = line.match(/(?:class|interface|type|struct)\s+([A-Za-z0-9_]+)/);
    if (classMatch && classMatch[1]) {
      const name = classMatch[1];
      return `${name}.${ext}`;
    }
  }

  // 4. Look for function / def declaration
  for (const line of lines) {
    const fnMatch = line.match(/(?:def|func|fn|function|const)\s+([a-z0-9_]+)\s*(?:=|\()/);
    if (fnMatch && fnMatch[1] && fnMatch[1].length > 2) {
      return `${fnMatch[1]}.${ext}`;
    }
  }

  // 5. Default by language archetype
  const archetypes: Record<string, string> = {
    typescript: `orchestrator_${index}.ts`,
    ts: `orchestrator_${index}.ts`,
    tsx: `Component_${index}.tsx`,
    javascript: `index_${index}.js`,
    js: `index_${index}.js`,
    jsx: `Component_${index}.jsx`,
    python: `pipeline_${index}.py`,
    py: `pipeline_${index}.py`,
    rust: `lib_${index}.rs`,
    rs: `lib_${index}.rs`,
    golang: `service_${index}.go`,
    go: `service_${index}.go`,
    sql: `query_${index}.sql`,
    bash: `script_${index}.sh`,
    sh: `script_${index}.sh`,
    json: `config_${index}.json`,
    html: `template_${index}.html`,
    css: `styles_${index}.css`,
    markdown: `documentation_${index}.md`
  };

  return archetypes[language.toLowerCase().trim()] || `snippet_${index}.${ext}`;
}

export function getLanguageBadgeColor(language: string): { bg: string; text: string; border: string } {
  const lang = (language || '').toLowerCase().trim();
  switch (lang) {
    case 'typescript':
    case 'ts':
    case 'tsx':
      return { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' };
    case 'javascript':
    case 'js':
    case 'jsx':
      return { bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    case 'python':
    case 'py':
      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
    case 'rust':
    case 'rs':
      return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
    case 'golang':
    case 'go':
      return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30' };
    case 'sql':
      return { bg: 'bg-pink-500/10', text: 'text-pink-400', border: 'border-pink-500/30' };
    case 'json':
    case 'yaml':
    case 'yml':
      return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    default:
      return { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30' };
  }
}
