export interface AgentModel {
  id: string;
  name: string;
  provider: 'Anthropic' | 'OpenAI' | 'DeepSeek' | 'Google' | 'Meta' | 'Mistral' | 'Qwen' | 'Other';
  category: 'Reasoning' | 'Coding' | 'General' | 'Fast' | 'Vision';
  contextWindow: number;
  description: string;
  badge?: string;
  systemPrompt: string;
  suggestedPrompts: string[];
  maxTokens?: number;
  temperature?: number;
  isCustom?: boolean;
}
