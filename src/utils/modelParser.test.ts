import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectProvider,
  categorizeModel,
  formatAgentName,
  parseModelsFromApi,
  filterModels,
  estimateTokenCount,
  createManualAgentModel
} from './modelParser';

test('detectProvider recognizes major AI model families', () => {
  assert.equal(detectProvider('claude-3-7-sonnet-20250219'), 'Anthropic');
  assert.equal(detectProvider('anthropic/claude-3-5-sonnet'), 'Anthropic');
  assert.equal(detectProvider('deepseek-reasoner'), 'DeepSeek');
  assert.equal(detectProvider('deepseek/deepseek-chat'), 'DeepSeek');
  assert.equal(detectProvider('gpt-4o'), 'OpenAI');
  assert.equal(detectProvider('o3-mini'), 'OpenAI');
  assert.equal(detectProvider('google/gemini-2.0-flash'), 'Google');
  assert.equal(detectProvider('meta-llama/llama-3.3-70b-instruct'), 'Meta');
  assert.equal(detectProvider('mistralai/mistral-large-2411'), 'Mistral');
  assert.equal(detectProvider('qwen/qwen-2.5-coder-32b-instruct'), 'Qwen');
  assert.equal(detectProvider('unknown-custom-router-model'), 'Other');
});

test('categorizeModel identifies model category correctly', () => {
  assert.equal(categorizeModel('deepseek-r1'), 'Reasoning');
  assert.equal(categorizeModel('o1-preview'), 'Reasoning');
  assert.equal(categorizeModel('qwen-coder-32b'), 'Coding');
  assert.equal(categorizeModel('gemini-2.0-flash'), 'Fast');
  assert.equal(categorizeModel('claude-3-5-haiku'), 'Fast');
  assert.equal(categorizeModel('gpt-4o'), 'Vision');
  assert.equal(categorizeModel('llama-3.3-70b'), 'General');
});

test('parseModelsFromApi parses ONLY scraped models without demo injection', () => {
  const apiPayload = {
    object: 'list',
    data: [
      { id: 'deepseek-reasoner', owned_by: 'deepseek', description: 'Deep reasoning model' },
      { id: 'custom-org/finetuned-llama', description: 'Specialized code generator' }
    ]
  };

  const parsed = parseModelsFromApi(apiPayload);
  // Strictly contains ONLY the 2 models from the API
  assert.equal(parsed.length, 2);
  assert.equal(parsed[0].id, 'deepseek-reasoner');
  assert.equal(parsed[0].provider, 'DeepSeek');
  assert.equal(parsed[1].id, 'custom-org/finetuned-llama');
  assert.equal(parsed[1].category, 'Coding');

  // Empty response returns empty array
  assert.deepEqual(parseModelsFromApi(null), []);
  assert.deepEqual(parseModelsFromApi({ data: [] }), []);
});

test('filterModels searches and filters by provider and category', () => {
  const sampleModels = [
    {
      id: 'claude-3-7-sonnet',
      name: 'Claude 3.7 Sonnet',
      provider: 'Anthropic' as const,
      category: 'Reasoning' as const,
      contextWindow: 200000,
      description: 'Hybrid reasoning',
      systemPrompt: '',
      suggestedPrompts: []
    },
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'OpenAI' as const,
      category: 'General' as const,
      contextWindow: 128000,
      description: 'General omni model',
      systemPrompt: '',
      suggestedPrompts: []
    }
  ];

  const filteredProvider = filterModels(sampleModels, { provider: 'Anthropic' });
  assert.equal(filteredProvider.length, 1);
  assert.equal(filteredProvider[0].id, 'claude-3-7-sonnet');

  const filteredSearch = filterModels(sampleModels, { search: 'omni' });
  assert.equal(filteredSearch.length, 1);
  assert.equal(filteredSearch[0].id, 'gpt-4o');
});

test('estimateTokenCount approximates token lengths', () => {
  assert.equal(estimateTokenCount(''), 0);
  assert.equal(estimateTokenCount('Hello world!'), 3);
});

test('createManualAgentModel creates valid agent representation', () => {
  const agent = createManualAgentModel('agentrouter/claude-opus-4-8');
  assert.equal(agent.id, 'agentrouter/claude-opus-4-8');
  assert.equal(agent.provider, 'Anthropic');
  assert.equal(agent.badge, 'Anthropic Direct');
  assert.ok(agent.name.includes('Claude Opus'));
});

test('parseModelsFromApi supports camelCase contextLength and custom envelopes', () => {
  const payload = {
    models: [
      { id: 'agentrouter/gpt-5.5', contextLength: 1047576, description: 'AgentRouter frontier model' }
    ]
  };
  const parsed = parseModelsFromApi(payload);
  assert.equal(parsed.length, 1);
  assert.equal(parsed[0].id, 'agentrouter/gpt-5.5');
  assert.equal(parsed[0].provider, 'OpenAI');
  assert.equal(parsed[0].contextWindow, 1047576);
});

test('getAgentRouterDocsAgents loads all documented agents with complete specs', async () => {
  const { getAgentRouterDocsAgents } = await import('./agentrouterDocsData.js');
  const agents = getAgentRouterDocsAgents();
  assert.ok(agents.length >= 20, 'Should load all documented AgentRouter agents');
  const opus = agents.find(a => a.id === 'agentrouter/claude-opus-4-8');
  assert.ok(opus, 'Should include Claude Opus 4.8');
  assert.equal(opus.contextWindow, 1000000);
  assert.equal(opus.provider, 'Anthropic');

  const gpt5 = agents.find(a => a.id === 'agentrouter/gpt-5.6-sol');
  assert.ok(gpt5, 'Should include GPT-5.6 Sol');
  assert.equal(gpt5.provider, 'OpenAI');

  const deepseek = agents.find(a => a.id === 'agentrouter/deepseek-v4-flash');
  assert.ok(deepseek, 'Should include DeepSeek V4 Flash');
  assert.equal(deepseek.provider, 'DeepSeek');
});

