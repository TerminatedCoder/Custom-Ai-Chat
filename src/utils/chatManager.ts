import { AgentModel } from './modelCatalog';

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  isImage?: boolean;
}

export interface MessageBranch {
  content: string;
  timestamp: number;
  subsequentMessages: ChatMessage[];
  attachments?: AttachedFile[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  thought?: string;
  timestamp: number;
  modelId?: string;
  provider?: string;
  tokenCount?: number;
  // Conversation Branching:
  branches?: MessageBranch[];
  currentBranchIndex?: number;
  // File Attachments:
  attachments?: AttachedFile[];
}

export interface CustomPersonality {
  id: string;
  name: string;
  tagline: string;
  instructions: string;
  icon: string;
  badge: string;
}

export const PERSONALITY_PRESETS: CustomPersonality[] = [
  {
    id: 'architect',
    name: 'Senior Architect',
    tagline: 'Modular, highly scalable, zero-bloat systems',
    icon: 'Layers',
    badge: 'Architecture',
    instructions: 'You are a Principal Software Architect. Prioritize robust, decoupled modular architecture, high concurrency, strict type safety, failure domain isolation, and production readiness. Never provide lazy pseudocode; deliver idiomatic, structured solutions.'
  },
  {
    id: 'socratic',
    name: 'Concise Socratic Mentor',
    tagline: 'Terse, high-signal, guiding questions',
    icon: 'HelpCircle',
    badge: 'Socratic',
    instructions: 'You are a Socratic mentor and minimalist engineer. Be extremely concise. Avoid all filler pleasantries. Answer the core inquiry directly in 1-3 sentences or clean code, and finish with a thought-provoking engineering question.'
  },
  {
    id: 'security',
    name: 'Security & Vulnerability Auditor',
    tagline: 'Zero-trust, OWASP, memory safety & CVE defense',
    icon: 'Shield',
    badge: 'Security',
    instructions: 'You are a veteran Application Security Engineer. Rigorously inspect code and architectures for injection, privilege escalation, memory bugs, race conditions, and insecure defaults. Always point out attack vectors and provide hardened remediation.'
  },
  {
    id: 'pair',
    name: 'Friendly Pair Programmer',
    tagline: 'Supportive, step-by-step collaborative coding',
    icon: 'Users',
    badge: 'Collaborative',
    instructions: 'You are an empathetic, world-class pair programming partner. Explain complex steps clearly with small, verifiable milestones, inline explanations, and test cases. Celebrate clean solutions and suggest proactive ergonomic improvements.'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon (Code Only)',
    tagline: 'Raw code blocks & CLI commands only. No fluff',
    icon: 'Zap',
    badge: 'Code Only',
    instructions: 'You are a silent code generator. Output ONLY syntactically complete code blocks and terminal commands. Do NOT output conversational chatter, introductions, or closing remarks unless explicitly asked.'
  },
  {
    id: 'documenter',
    name: 'Technical Documenter',
    tagline: 'Markdown specifications, tables & API guides',
    icon: 'BookOpen',
    badge: 'Documentation',
    instructions: 'You are a Staff Technical Writer. Structure answers using crisp markdown headers, clear bullet points, parameter tables, API schemas, and runnable copy-paste usage snippets.'
  }
];

export interface ChatSession {
  id: string;
  title: string;
  agentId: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  customPersonalityId?: string;
  customInstructions?: string;
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

  if (lower.includes('python') || lower.includes('py ') || lower.endsWith('.py')) {
    if (lower.includes('short') || lower.includes('simple') || lower.includes('quick')) {
      return `### Python Quick Implementation (${agent.provider})

Here is the concise Python function requested:

\`\`\`python
def calculate_moving_average(data_points: list[float], window_size: int = 3) -> list[float]:
    """Calculate simple moving average with window validation."""
    if window_size <= 0 or not data_points:
        return []
    
    averages = []
    for i in range(len(data_points) - window_size + 1):
        window = data_points[i : i + window_size]
        avg = sum(window) / window_size
        averages.append(round(avg, 2))
    
    return averages
\`\`\`

You can customize the window size or integrate it directly into your pipeline.`;
    }

    return `### Python Server Log Processor (${agent.provider})

Here is the complete Python script with classes, nested helper functions, if/else branching, and PEP 8 indentation:

\`\`\`python
# log_processor.py
import os
import sys
import time
from typing import Dict, List, Optional, Any


class LogStreamProcessor:
    """
    High-throughput server log stream analyzer.
    Processes raw structured logs and computes real-time telemetry metrics.
    """

    def __init__(self, service_name: str, latency_threshold_ms: float = 250.0):
        self.service_name = service_name
        self.latency_threshold_ms = latency_threshold_ms
        self.processed_records: List[Dict[str, Any]] = []
        self.error_count = 0

    def analyze_batch(self, raw_lines: List[str]) -> Dict[str, Any]:
        """Process a batch of log records with nested validation."""
        metrics = {
            "total": 0,
            "info": 0,
            "warn": 0,
            "error": 0,
            "slow_queries": 0,
        }

        def parse_single_line(line: str) -> Optional[Dict[str, Any]]:
            clean_line = line.strip()
            if not clean_line or clean_line.startswith("#"):
                return None

            tokens = clean_line.split(" | ")
            if len(tokens) < 3:
                return None

            timestamp, level, message = tokens[0], tokens[1].upper(), tokens[2]
            duration_ms = 0.0

            if len(tokens) >= 4 and "ms" in tokens[3]:
                try:
                    duration_ms = float(tokens[3].replace("ms", "").strip())
                except ValueError:
                    duration_ms = 0.0

            return {
                "timestamp": timestamp,
                "level": level,
                "message": message,
                "duration_ms": duration_ms,
                "is_slow": duration_ms > self.latency_threshold_ms,
            }

        for line in raw_lines:
            entry = parse_single_line(line)
            if entry is not None:
                metrics["total"] += 1
                lvl = entry["level"].lower()

                if lvl in metrics:
                    metrics[lvl] += 1
                else:
                    metrics["info"] += 1

                if entry["is_slow"]:
                    metrics["slow_queries"] += 1

                if lvl == "error":
                    self.error_count += 1

                self.processed_records.append(entry)

        return metrics

    def export_summary(self) -> str:
        """Generate human-readable execution summary."""
        return (
            f"Service [{self.service_name}] processed {len(self.processed_records)} entries "
            f"with {self.error_count} total errors encountered."
        )


def main():
    processor = LogStreamProcessor(service_name="api-gateway", latency_threshold_ms=150.0)
    sample_logs = [
        "2026-10-25 12:00:01 | INFO | Gateway initialized | 12ms",
        "2026-10-25 12:00:02 | WARN | High CPU memory load | 89ms",
        "2026-10-25 12:00:03 | ERROR | Database connection timeout | 320ms",
        "2026-10-25 12:00:04 | INFO | Request served successfully | 45ms",
    ]

    report = processor.analyze_batch(sample_logs)
    print("Batch Metrics:", report)
    print("Summary:", processor.export_summary())


if __name__ == "__main__":
    main()
\`\`\`

This script demonstrates strictly formatted 4-space and 8-space Python indentation, nested closures (\`parse_single_line\`), type annotations, and condition branching.`;
  }

  if (lower.includes('attached') || lower.includes('file')) {
    return `### Attached File Analysis (${agent.provider})

I have inspected your attached file(s) and structured the analysis below:

1. **File Syntax & Integrity**: Validated structure and parameters.
2. **Key Logic Identified**: Identified primary functions and schema definitions.
3. **Recommended Refactoring**:
   - Extract nested callbacks into pure functions for unit testability.
   - Guard against nullable references.

\`\`\`python
# analysis_snippet.py
def validate_file_payload(file_data: dict) -> bool:
    required_keys = ["id", "name", "size"]
    for key in required_keys:
        if key not in file_data:
            return False
    return True
\`\`\`

Would you like me to rewrite or extend any specific section?`;
  }

  if (lower.includes('code') || lower.includes('react') || lower.includes('typescript') || lower.includes('function') || lower.includes('hook')) {
    return `### Optimized Implementation (${agent.provider})\n\nHere is a clean, production-grade pattern adhering to modern TypeScript standards:\n\n\`\`\`typescript\nimport { useState, useCallback, useRef, useEffect } from 'react';\n\nexport function useResilientStream<T>(fetchFn: () => Promise<ReadableStream<T>>) {\n  const [data, setData] = useState<T[]>([]);\n  const [isStreaming, setIsStreaming] = useState(false);\n  const abortControllerRef = useRef<AbortController | null>(null);\n\n  const startStream = useCallback(async () => {\n    abortControllerRef.current?.abort();\n    abortControllerRef.current = new AbortController();\n    setIsStreaming(true);\n\n    try {\n      const stream = await fetchFn();\n      const reader = stream.getReader();\n      while (true) {\n        const { done, value } = await reader.read();\n        if (done) break;\n        if (value) setData(prev => [...prev, value]);\n      }\n    } finally {\n      setIsStreaming(false);\n    }\n  }, [fetchFn]);\n\n  useEffect(() => () => abortControllerRef.current?.abort(), []);\n  return { data, isStreaming, startStream };\n}\n\`\`\`\n\nThis pattern prevents memory leaks, ensures idempotent triggers, and provides immediate loading state resolution.`;
  }

  return `Hello! I am **${agent.name}** (${agent.badge || agent.provider}), routed through the **AgentRouter** gateway.\n\nI am configured with:\n- **Model ID**: \`${agent.id}\`\n- **Context Window**: ${agent.contextWindow.toLocaleString()} tokens\n- **Specialization**: ${agent.category} optimization\n\n> *${agent.description}*\n\nYour message: "${prompt}"\n\nHow would you like to proceed? We can write architecture specs, optimize algorithmic logic, inspect telemetry, or configure customized system parameters.`;
}

/**
 * Creates a new branch at a specified message by archiving current subsequent path
 */
export function branchUserMessage(
  messages: ChatMessage[],
  targetMessageId: string,
  newContent: string
): { updatedMessages: ChatMessage[]; targetIndex: number } {
  const targetIndex = messages.findIndex(m => m.id === targetMessageId);
  if (targetIndex === -1) {
    return { updatedMessages: messages, targetIndex: -1 };
  }

  const targetMsg = messages[targetIndex];
  const subsequent = messages.slice(targetIndex + 1);

  // Initialize branches array if not present
  const currentBranches: MessageBranch[] = targetMsg.branches
    ? [...targetMsg.branches]
    : [
        {
          content: targetMsg.content,
          timestamp: targetMsg.timestamp,
          subsequentMessages: subsequent
        }
      ];

  // If branches already existed, save current state to active branch
  const activeIdx = targetMsg.currentBranchIndex ?? 0;
  if (currentBranches[activeIdx]) {
    currentBranches[activeIdx] = {
      content: targetMsg.content,
      timestamp: targetMsg.timestamp,
      subsequentMessages: subsequent
    };
  }

  // Create new branch entry
  const newBranch: MessageBranch = {
    content: newContent,
    timestamp: Date.now(),
    subsequentMessages: []
  };

  currentBranches.push(newBranch);
  const newActiveIndex = currentBranches.length - 1;

  const updatedTargetMsg: ChatMessage = {
    ...targetMsg,
    content: newContent,
    timestamp: Date.now(),
    branches: currentBranches,
    currentBranchIndex: newActiveIndex
  };

  // Truncate messages up to the edited message
  const updatedMessages = [...messages.slice(0, targetIndex), updatedTargetMsg];

  return { updatedMessages, targetIndex };
}

/**
 * Switches a message to a different branch, restoring that branch's conversation path
 */
export function switchMessageBranch(
  messages: ChatMessage[],
  targetMessageId: string,
  targetBranchIndex: number
): ChatMessage[] {
  const targetIndex = messages.findIndex(m => m.id === targetMessageId);
  if (targetIndex === -1) return messages;

  const targetMsg = messages[targetIndex];
  if (!targetMsg.branches || targetBranchIndex < 0 || targetBranchIndex >= targetMsg.branches.length) {
    return messages;
  }

  const currentBranches = [...targetMsg.branches];
  const currentActiveIdx = targetMsg.currentBranchIndex ?? 0;

  // Save current active state before switching
  const currentSubsequent = messages.slice(targetIndex + 1);
  if (currentBranches[currentActiveIdx]) {
    currentBranches[currentActiveIdx] = {
      content: targetMsg.content,
      timestamp: targetMsg.timestamp,
      subsequentMessages: currentSubsequent
    };
  }

  // Load target branch
  const targetBranch = currentBranches[targetBranchIndex];

  const updatedTargetMsg: ChatMessage = {
    ...targetMsg,
    content: targetBranch.content,
    timestamp: targetBranch.timestamp,
    branches: currentBranches,
    currentBranchIndex: targetBranchIndex
  };

  return [
    ...messages.slice(0, targetIndex),
    updatedTargetMsg,
    ...targetBranch.subsequentMessages
  ];
}

