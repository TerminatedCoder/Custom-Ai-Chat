import { AgentModel } from './modelCatalog';

/**
 * Detect provider from model ID or owner string
 */
export function detectProvider(modelId: string, ownedBy?: string): AgentModel['provider'] {
  const lower = (modelId + ' ' + (ownedBy || '')).toLowerCase();

  if (lower.includes('anthropic') || lower.includes('claude')) return 'Anthropic';
  if (lower.includes('deepseek')) return 'DeepSeek';
  if (
    lower.includes('openai') ||
    lower.includes('/gpt') ||
    lower.startsWith('gpt') ||
    lower.includes('gpt-') ||
    lower.includes('/o1') ||
    lower.startsWith('o1') ||
    lower.includes('/o3') ||
    lower.startsWith('o3') ||
    lower.includes('chatgpt')
  ) return 'OpenAI';
  if (lower.includes('google') || lower.includes('gemini')) return 'Google';
  if (lower.includes('meta') || lower.includes('llama')) return 'Meta';
  if (lower.includes('mistral') || lower.includes('codestral') || lower.includes('mixtral')) return 'Mistral';
  if (lower.includes('qwen')) return 'Qwen';
  if (lower.includes('glm') || lower.includes('zhipu') || lower.includes('chatglm')) return 'Other';
  if (lower.includes('minimax') || lower.includes('moonshot') || lower.includes('kimi')) return 'Other';
  return 'Other';
}

/**
 * Determine primary category for a model
 */
export function categorizeModel(modelId: string, description?: string): AgentModel['category'] {
  const lower = (modelId + ' ' + (description || '')).toLowerCase();

  if (lower.includes('r1') || lower.includes('reason') || lower.includes('o1') || lower.includes('o3') || lower.includes('thinking')) {
    return 'Reasoning';
  }
  if (lower.includes('code') || lower.includes('coder') || lower.includes('dev') || lower.includes('sql')) {
    return 'Coding';
  }
  if (lower.includes('flash') || lower.includes('mini') || lower.includes('turbo') || lower.includes('haiku') || lower.includes('fast')) {
    return 'Fast';
  }
  if (lower.includes('vision') || lower.includes('multimodal') || lower.includes('omni') || lower.includes('4o')) {
    return 'Vision';
  }
  return 'General';
}

/**
 * Formats a clean human-friendly agent name from model ID
 */
export function formatAgentName(modelId: string): string {
  // Clean raw id e.g. "anthropic/claude-3-7-sonnet" -> "Claude 3.7 Sonnet"
  const clean = modelId
    .replace(/^[^/]+\//, '') // Remove provider prefix
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return clean;
}

/**
 * Creates an AgentModel from a manual model ID input
 */
export function createManualAgentModel(rawId: string): AgentModel {
  const modelId = rawId.trim();
  const provider = detectProvider(modelId);
  const category = categorizeModel(modelId);

  return {
    id: modelId,
    name: formatAgentName(modelId),
    provider,
    category,
    contextWindow: 128000,
    description: `Added model ${modelId} routed via API gateway.`,
    badge: `${provider} Direct`,
    systemPrompt: `You are an AI assistant powered by ${modelId}. Provide clear, accurate, and insightful responses.`,
    suggestedPrompts: [
      `What are the key capabilities and strengths of ${modelId}?`,
      'Help me analyze a complex problem step-by-step.',
      'Write clean, idiomatic code for this task.'
    ]
  };
}

/**
 * Parses ONLY the models strictly returned from the API response
 * No demo models or hardcoded fallback models are injected.
 */
export function parseModelsFromApi(rawResponse: any): AgentModel[] {
  if (!rawResponse || typeof rawResponse !== 'object') {
    return [];
  }

  // Handle standard OpenAI format: { object: 'list', data: [...] }, { models: [...] }, or AgentRouter data envelope
  let rawList: any[] = [];
  if (Array.isArray(rawResponse)) {
    rawList = rawResponse;
  } else if (Array.isArray(rawResponse.data)) {
    rawList = rawResponse.data;
  } else if (Array.isArray(rawResponse.models)) {
    rawList = rawResponse.models;
  } else if (rawResponse.data && Array.isArray(rawResponse.data.models)) {
    rawList = rawResponse.data.models;
  } else if (rawResponse.data && Array.isArray(rawResponse.data.data)) {
    rawList = rawResponse.data.data;
  } else if (rawResponse.data && typeof rawResponse.data === 'object') {
    rawList = Object.values(rawResponse.data);
  }

  if (rawList.length === 0) {
    return [];
  }

  const scrapedModels: AgentModel[] = [];
  const seenIds = new Set<string>();

  for (const item of rawList) {
    if (!item) continue;
    const modelId = typeof item === 'string' ? item : (item.id || item.model_name || item.name || item.modelId);
    if (!modelId || typeof modelId !== 'string' || seenIds.has(modelId)) continue;
    seenIds.add(modelId);

    const provider = detectProvider(modelId, item.owned_by || item.provider || item.organization);
    const category = categorizeModel(modelId, item.description);
    const contextWindow =
      item.context_length ||
      item.contextLength ||
      item.context_window ||
      item.context_window_size ||
      item.max_tokens ||
      item.context_length_tokens ||
      128000;

    const agent: AgentModel = {
      id: modelId,
      name: formatAgentName(modelId),
      provider,
      category,
      contextWindow: Number(contextWindow) || 128000,
      description: item.description || `Scraped ${provider} model (${modelId}) routed via API gateway.`,
      badge: `${provider} Scraped`,
      systemPrompt: `You are an AI assistant powered by ${modelId}. Provide clear, accurate, and insightful responses.`,
      suggestedPrompts: [
        `What are the key capabilities and strengths of ${modelId}?`,
        'Help me analyze a complex problem step-by-step.',
        'Write clean, idiomatic code for this task.'
      ]
    };

    scrapedModels.push(agent);
  }

  return scrapedModels;
}

/**
 * Filter and search models
 */
export function filterModels(
  models: AgentModel[],
  filters: {
    search?: string;
    provider?: string;
    category?: string;
  }
): AgentModel[] {
  return models.filter(m => {
    if (filters.provider && filters.provider !== 'All' && m.provider !== filters.provider) {
      return false;
    }
    if (filters.category && filters.category !== 'All' && m.category !== filters.category) {
      return false;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      const match =
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.provider.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

/**
 * Fast estimation of token count for prompt and messages (~4 chars per token)
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}
