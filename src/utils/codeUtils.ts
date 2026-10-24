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
