import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatPayload,
  extractReasoningThought,
  parseSSEBuffer,
  generateDemoResponse
} from './chatManager';
import { AgentModel } from './modelCatalog';

test('buildChatPayload formats messages and injects system prompt', () => {
  const payload = buildChatPayload({
    model: 'claude-3-7-sonnet',
    messages: [
      { id: '1', role: 'user', content: 'Hello agent', timestamp: 1000 }
    ],
    systemPrompt: 'You are an expert engineer.',
    temperature: 0.5,
    maxTokens: 4096,
    stream: true
  });

  assert.equal(payload.model, 'claude-3-7-sonnet');
  assert.equal(payload.temperature, 0.5);
  assert.equal(payload.max_tokens, 4096);
  assert.equal(payload.stream, true);
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.messages[0].role, 'system');
  assert.equal(payload.messages[0].content, 'You are an expert engineer.');
  assert.equal(payload.messages[1].role, 'user');
  assert.equal(payload.messages[1].content, 'Hello agent');
});

test('extractReasoningThought parses <think> tags', () => {
  const rawWithThink = '<think>Analyzing the user algorithm complexity...</think>The algorithm runs in O(n log n) time.';
  const { thought, cleanContent } = extractReasoningThought(rawWithThink);

  assert.equal(thought, 'Analyzing the user algorithm complexity...');
  assert.equal(cleanContent, 'The algorithm runs in O(n log n) time.');

  const rawNormal = 'Plain answer without thinking tags.';
  const normalResult = extractReasoningThought(rawNormal);
  assert.equal(normalResult.thought, undefined);
  assert.equal(normalResult.cleanContent, 'Plain answer without thinking tags.');
});

test('parseSSEBuffer extracts delta tokens and [DONE] signal', () => {
  const sseChunk = [
    'data: {"choices":[{"delta":{"content":"Hello"}}]}',
    '',
    'data: {"choices":[{"delta":{"content":" world!"}}]}',
    '',
    'data: [DONE]',
    ''
  ].join('\n');

  const result = parseSSEBuffer(sseChunk);
  assert.equal(result.isDone, true);
  assert.deepEqual(result.deltas, ['Hello', ' world!']);
  assert.equal(result.remainingBuffer, '');
});

test('generateDemoResponse creates context-rich agent response', () => {
  const agent: AgentModel = {
    id: 'test-agent',
    name: 'Claude 3.7 Sonnet',
    provider: 'Anthropic',
    category: 'Reasoning',
    contextWindow: 200000,
    description: 'Test agent description',
    systemPrompt: 'You are an assistant',
    suggestedPrompts: []
  };
  const response = generateDemoResponse(agent, 'Design a microservice architecture');
  assert.ok(response.includes('Architectural Blueprint'));
  assert.ok(response.includes(agent.name));
});
