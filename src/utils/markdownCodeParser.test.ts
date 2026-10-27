import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeIndentation,
  cleanCodeBody,
  parseMarkdownSections,
  detectRawCode
} from './markdownCodeParser';

test('normalizeIndentation replaces tabs with 4 spaces and normalizes CRLF', () => {
  const input = '\tdef foo():\r\n\t\treturn 42';
  const expected = '    def foo():\n        return 42';
  assert.equal(normalizeIndentation(input), expected);
});

test('cleanCodeBody preserves leading line indentation', () => {
  const code = '    def nested_func():\n        return True\n';
  const cleaned = cleanCodeBody(code);
  assert.equal(cleaned.startsWith('    def nested_func()'), true);
  assert.equal(cleaned.includes('\n        return True'), true);
});

test('parseMarkdownSections parses closed code blocks with indentation', () => {
  const content = 'Here is the Python solution:\n```python\ndef fib(n):\n    if n <= 1:\n        return n\n    return fib(n-1) + fib(n-2)\n```\nEnjoy!';
  const sections = parseMarkdownSections(content);

  assert.equal(sections.length, 3);
  assert.equal(sections[0].type, 'text');
  assert.equal(sections[1].type, 'code');
  if (sections[1].type === 'code') {
    assert.equal(sections[1].language, 'python');
    assert.equal(sections[1].code.includes('    if n <= 1:'), true);
    assert.equal(sections[1].code.includes('        return n'), true);
  }
  assert.equal(sections[2].type, 'text');
});

test('parseMarkdownSections parses unclosed streaming code blocks', () => {
  const streamingContent = 'Here is the code in progress:\n```python\ndef calculate_total(items):\n    total = 0\n    for item in items:\n        total += item.price';
  const sections = parseMarkdownSections(streamingContent);

  assert.equal(sections.length, 2);
  assert.equal(sections[0].type, 'text');
  assert.equal(sections[1].type, 'code');
  if (sections[1].type === 'code') {
    assert.equal(sections[1].language, 'python');
    assert.equal(sections[1].code.includes('    total = 0'), true);
    assert.equal(sections[1].code.includes('        total += item.price'), true);
  }
});

test('parseMarkdownSections parses 4-space indented markdown code blocks', () => {
  const indentedMarkdown = 'Run this script:\n\n    def run():\n        print("hello world")\n        return True\n\nAll done.';
  const sections = parseMarkdownSections(indentedMarkdown);

  const codeSec = sections.find(s => s.type === 'code');
  assert.ok(codeSec, 'Should find code section in 4-space markdown block');
  if (codeSec && codeSec.type === 'code') {
    assert.equal(codeSec.language, 'python');
    assert.equal(codeSec.code.includes('print("hello world")'), true);
  }
});

test('detectRawCode detects raw python scripts without backticks', () => {
  const rawPy = 'import os\nimport sys\n\ndef main():\n    for arg in sys.argv:\n        print(arg)\n\nif __name__ == "__main__":\n    main()';
  const result = detectRawCode(rawPy);

  assert.equal(result.isCode, true);
  assert.equal(result.language, 'python');
  assert.equal(result.cleanedCode.includes('    for arg in sys.argv:'), true);
});
