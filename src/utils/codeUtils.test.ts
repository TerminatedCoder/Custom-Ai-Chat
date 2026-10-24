import test from 'node:test';
import assert from 'node:assert/strict';
import { isBigCodeSnippet, isBigTextMessage, getFileExtension } from './codeUtils';

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
