import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChatPayload,
  extractReasoningThought,
  parseSSEBuffer,
  generateDemoResponse,
  branchUserMessage,
  switchMessageBranch
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

test('branchUserMessage and switchMessageBranch fork and restore conversation paths', () => {
  const initialMessages = [
    { id: 'msg-1', role: 'user' as const, content: 'First prompt', timestamp: 1000 },
    { id: 'msg-2', role: 'assistant' as const, content: 'First answer', timestamp: 1001 },
    { id: 'msg-3', role: 'user' as const, content: 'Second prompt', timestamp: 1002 },
    { id: 'msg-4', role: 'assistant' as const, content: 'Second answer', timestamp: 1003 }
  ];

  // Fork at msg-3 with new content
  const { updatedMessages } = branchUserMessage(
    initialMessages,
    'msg-3',
    'Second prompt edited alternative'
  );

  assert.equal(updatedMessages.length, 3);
  assert.equal(updatedMessages[2].content, 'Second prompt edited alternative');
  assert.equal(updatedMessages[2].branches?.length, 2);
  assert.equal(updatedMessages[2].currentBranchIndex, 1);
  // Original branch 0 should contain msg-4 in subsequentMessages
  assert.equal(updatedMessages[2].branches?.[0].content, 'Second prompt');
  assert.equal(updatedMessages[2].branches?.[0].subsequentMessages.length, 1);
  assert.equal(updatedMessages[2].branches?.[0].subsequentMessages[0].id, 'msg-4');

  // Switch back to branch 0
  const switchedBack = switchMessageBranch(
    updatedMessages,
    'msg-3',
    0
  );

  assert.equal(switchedBack.length, 4);
  assert.equal(switchedBack[2].content, 'Second prompt');
  assert.equal(switchedBack[2].currentBranchIndex, 0);
  assert.equal(switchedBack[3].content, 'Second answer');

  // Switch back to branch 1
  const switchedToBranch1 = switchMessageBranch(
    switchedBack,
    'msg-3',
    1
  );

  assert.equal(switchedToBranch1.length, 3);
  assert.equal(switchedToBranch1[2].content, 'Second prompt edited alternative');
  assert.equal(switchedToBranch1[2].currentBranchIndex, 1);
});

test('ChatMessage supports file attachments and metadata', () => {
  const msg: import('./chatManager').ChatMessage = {
    id: 'msg-files',
    role: 'user',
    content: 'Inspect the attached file',
    timestamp: Date.now(),
    attachments: [
      {
        id: 'file-1',
        name: 'orchestrator.ts',
        size: 1024,
        type: 'text/typescript',
        content: 'export class Orchestrator {}',
        isImage: false
      }
    ]
  };

  assert.equal(msg.attachments?.length, 1);
  assert.equal(msg.attachments?.[0].name, 'orchestrator.ts');
  assert.equal(msg.attachments?.[0].size, 1024);
  assert.equal(msg.attachments?.[0].isImage, false);
});
