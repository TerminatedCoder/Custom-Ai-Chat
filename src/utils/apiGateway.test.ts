/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanBaseUrl, sanitizeApiKey, isHtmlResponse } from './apiGateway.js';

test('cleanBaseUrl normalizes agentrouter variations to official gateway', () => {
  assert.equal(cleanBaseUrl('https://agentrouter.org'), 'https://co.agentrouter.org/v1');
  assert.equal(cleanBaseUrl('http://co.agentrouter.org/v1/models'), 'https://co.agentrouter.org/v1');
  assert.equal(cleanBaseUrl('https://api.openai.com/v1/'), 'https://api.openai.com/v1');
  assert.equal(cleanBaseUrl('localhost:11434'), 'https://localhost:11434');
});

test('sanitizeApiKey strips Bearer prefix and surrounding quotes', () => {
  assert.equal(sanitizeApiKey('Bearer sk-12345'), 'sk-12345');
  assert.equal(sanitizeApiKey('"sk-abcde"'), 'sk-abcde');
  assert.equal(sanitizeApiKey("'sk-xyz'"), 'sk-xyz');
  assert.equal(sanitizeApiKey('  sk-test  '), 'sk-test');
});

test('isHtmlResponse detects HTML error and SPA fallback documents', () => {
  assert.equal(isHtmlResponse('<!DOCTYPE html><html><body>Error</body></html>'), true);
  assert.equal(isHtmlResponse('  <!doctype html>  '), true);
  assert.equal(isHtmlResponse('<html><head><title>404</title></head></html>'), true);
  assert.equal(isHtmlResponse('{"success": true, "models": []}'), false);
  assert.equal(isHtmlResponse('data: {"choices":[]}\n\n'), false);
});
