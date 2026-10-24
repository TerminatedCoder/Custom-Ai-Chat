import { AgentModel } from './modelCatalog';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string;
  timestamp: number;
  modelId?: string;
  provider?: string;
  tokenCount?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

/**
 * Builds standard OpenAI-compatible chat payload
 */
export function buildChatPayload(options: {
  model: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}) {
  const formattedMessages: Array<{ role: string; content: string }> = [];

  if (options.systemPrompt && options.systemPrompt.trim()) {
    formattedMessages.push({
      role: 'system',
      content: options.systemPrompt.trim()
    });
  }

  for (const m of options.messages) {
    if (m.role === 'user' || m.role === 'assistant') {
      formattedMessages.push({
        role: m.role,
        content: m.content
      });
    }
  }

  return {
    model: options.model,
    messages: formattedMessages,
    temperature: options.temperature ?? 0.7,
    max_tokens: options.maxTokens ?? 2048,
    stream: options.stream ?? true
  };
}

/**
 * Extracts <think>...</think> chain-of-thought blocks if present in reasoning models (like DeepSeek R1)
 */
export function extractReasoningThought(rawContent: string): { thought?: string; cleanContent: string } {
  const thinkRegex = /<think>([\s\S]*?)<\/think>/i;
  const match = rawContent.match(thinkRegex);

  if (match) {
    const thought = match[1].trim();
    const cleanContent = rawContent.replace(thinkRegex, '').trim();
    return { thought, cleanContent };
  }

  // Handle unclosed <think> during live streaming
  if (rawContent.startsWith('<think>')) {
    const parts = rawContent.substring(7);
    return {
      thought: parts.trim(),
      cleanContent: ''
    };
  }

  return { cleanContent: rawContent };
}

/**
 * Parses raw text event stream chunks (OpenAI SSE protocol)
 */
export function parseSSEBuffer(buffer: string): { deltas: string[]; thoughts: string[]; remainingBuffer: string; isDone: boolean } {
  const lines = buffer.split('\n');
  const deltas: string[] = [];
  const thoughts: string[] = [];
  let isDone = false;
  let remainingBuffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // If it's the last line and does not end with newline, buffer it for next chunk
    if (i === lines.length - 1 && !buffer.endsWith('\n')) {
      remainingBuffer = lines[i];
      break;
    }

    if (!line || line.startsWith(':')) {
      continue;
    }

    if (line.startsWith('data: ')) {
      const dataStr = line.slice(6).trim();

      if (dataStr === '[DONE]') {
        isDone = true;
        continue;
      }

      try {
        const json = JSON.parse(dataStr);
        const choice = json.choices?.[0];
        if (choice?.delta) {
          if (choice.delta.content) {
            deltas.push(choice.delta.content);
          }
          // Some reasoning models send reasoning_content or reasoning
          if (choice.delta.reasoning_content || choice.delta.reasoning) {
            thoughts.push(choice.delta.reasoning_content || choice.delta.reasoning);
          }
        }
      } catch (e) {
        // partial or malformed json, ignore
      }
    }
  }

  return { deltas, thoughts, remainingBuffer, isDone };
}

/**
 * Generates an intelligent, model-grounded simulated response for live test/demo mode
 */
export function generateDemoResponse(agent: AgentModel, prompt: string): string {
  const lower = prompt.toLowerCase();

  if (lower.includes('architecture') || lower.includes('microservice') || lower.includes('system')) {
    return `### High-Resilience Architectural Blueprint\n\nWhen designing distributed services for high throughput and fault tolerance, prioritize **decoupled state**, **idempotency**, and **circuit breaking**:\n\n1. **API Gateway & Routing Layer**\n   - Edge routing with token-bucket rate limiting\n   - Header-based routing for canary deployments\n\n2. **Event-Driven Messaging Backbone**\n   - Asynchronous publish-subscribe via partitioned log brokers\n   - Dead-letter queues (DLQ) with exponential retry policies\n\n\`\`\`typescript\n// Architectural Interface: Resilient Event Dispatcher\nexport interface DomainEvent<T> {\n  eventId: string;\n  topic: string;\n  timestamp: number;\n  payload: T;\n  idempotencyKey: string;\n}\n\`\`\`\n\n*Routed via ${agent.name} (${agent.provider}) with ${agent.contextWindow.toLocaleString()} token context window.*`;
  }

  if (lower.includes('code') || lower.includes('react') || lower.includes('typescript') || lower.includes('function') || lower.includes('hook')) {
    return `### Optimized Implementation (${agent.provider})\n\nHere is a clean, production-grade pattern adhering to modern TypeScript standards:\n\n\`\`\`typescript\nimport { useState, useCallback, useRef, useEffect } from 'react';\n\nexport function useResilientStream<T>(fetchFn: () => Promise<ReadableStream<T>>) {\n  const [data, setData] = useState<T[]>([]);\n  const [isStreaming, setIsStreaming] = useState(false);\n  const abortControllerRef = useRef<AbortController | null>(null);\n\n  const startStream = useCallback(async () => {\n    abortControllerRef.current?.abort();\n    abortControllerRef.current = new AbortController();\n    setIsStreaming(true);\n\n    try {\n      const stream = await fetchFn();\n      const reader = stream.getReader();\n      while (true) {\n        const { done, value } = await reader.read();\n        if (done) break;\n        if (value) setData(prev => [...prev, value]);\n      }\n    } finally {\n      setIsStreaming(false);\n    }\n  }, [fetchFn]);\n\n  useEffect(() => () => abortControllerRef.current?.abort(), []);\n  return { data, isStreaming, startStream };\n}\n\`\`\`\n\nThis pattern prevents memory leaks, ensures idempotent triggers, and provides immediate loading state resolution.`;
  }

  return `Hello! I am **${agent.name}** (${agent.badge || agent.provider}), routed through the **AgentRouter** gateway.\n\nI am configured with:\n- **Model ID**: \`${agent.id}\`\n- **Context Window**: ${agent.contextWindow.toLocaleString()} tokens\n- **Specialization**: ${agent.category} optimization\n\n> *${agent.description}*\n\nYour message: "${prompt}"\n\nHow would you like to proceed? We can write architecture specs, optimize algorithmic logic, inspect telemetry, or configure customized system parameters.`;
}
