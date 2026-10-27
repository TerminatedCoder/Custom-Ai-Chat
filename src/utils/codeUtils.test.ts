import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isBigCodeSnippet,
  isBigTextMessage,
  getFileExtension,
  isLargeCodeFile,
  inferCodeFileName,
  formatBytes
} from './codeUtils';

test('isBigCodeSnippet detects large code blocks', () => {
  const shortCode = 'const x = 1;\nconsole.log(x);';
  assert.equal(isBigCodeSnippet(shortCode), false);

  const longCodeLines = Array.from({ length: 15 }, (_, i) => `line ${i}`).join('\n');
  assert.equal(isBigCodeSnippet(longCodeLines), true);

  const longCodeChars = 'a'.repeat(400);
  assert.equal(isBigCodeSnippet(longCodeChars), true);
});

test('isBigTextMessage detects large user messages', () => {
  const shortMsg = 'Can you help me?';
  assert.equal(isBigTextMessage(shortMsg), false);

  const longMsg = 'This is line 1\nline 2\nline 3\nline 4\nline 5\nline 6';
  assert.equal(isBigTextMessage(longMsg), true);

  const longCharMsg = 'lorem ipsum '.repeat(30);
  assert.equal(isBigTextMessage(longCharMsg), true);
});

test('getFileExtension maps language names to extensions', () => {
  assert.equal(getFileExtension('typescript'), 'ts');
  assert.equal(getFileExtension('python'), 'py');
  assert.equal(getFileExtension('rust'), 'rs');
  assert.equal(getFileExtension('unknownLang'), 'txt');
});

test('isLargeCodeFile detects full code files requiring slide window', () => {
  const smallCode = 'const a = 1;\nconst b = 2;\nreturn a + b;';
  assert.equal(isLargeCodeFile(smallCode), false);

  const largeCodeLines = Array.from({ length: 25 }, (_, i) => `// Line ${i}`).join('\n');
  assert.equal(isLargeCodeFile(largeCodeLines), true);
});

test('inferCodeFileName extracts filename from comments, class or defaults', () => {
  // Explicit comment
  const codeWithComment = '// filename: retryHandler.ts\nexport function retry() {}';
  assert.equal(inferCodeFileName(codeWithComment, 'typescript'), 'retryHandler.ts');

  // React component
  const reactCode = 'export default function UserProfile() {\n  return <div>Profile</div>;\n}';
  assert.equal(inferCodeFileName(reactCode, 'typescript'), 'UserProfile.tsx');

  // Class declaration
  const classCode = 'class DatabaseConnector {\n  connect() {}\n}';
  assert.equal(inferCodeFileName(classCode, 'python'), 'DatabaseConnector.py');

  // Fallback archetype
  const genericCode = 'for i in range(10):\n    print(i)';
  assert.equal(inferCodeFileName(genericCode, 'python', 2), 'pipeline_2.py');
});

test('formatBytes formats file sizes correctly', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(2048), '2.0 KB');
  assert.equal(formatBytes(1024 * 1024 * 2.5), '2.5 MB');
});
