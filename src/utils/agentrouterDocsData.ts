/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentModel } from './modelCatalog';

/**
 * Raw scraped models catalog from AgentRouter documentation:
 * Source: https://agentrouter.org/docs/index.html
 * Unified AI Gateway & Agent Router catalog supporting Anthropic, OpenAI, DeepSeek, Google, GLM, Qwen, and Meta.
 */
export const AGENTROUTER_DOCS_RAW_MODELS = [
  {
    id: 'agentrouter/claude-opus-4-8',
    name: 'Claude Opus 4.8 Agent Router',
    provider: 'Anthropic',
    category: 'Reasoning',
    context_length: 1000000,
    description: 'Flagship Anthropic model routed via AgentRouter with 1M-token context window. Engineered for autonomous multi-step agents, deep architectural reasoning, and MCP sub-agent coordination.',
    pricing: { prompt: '$15.00/M', completion: '$75.00/M' },
    badge: '1M Context • AgentRouter',
    suggestedPrompts: [
      'Design a resilient microservices architecture with MCP sub-agent delegation.',
      'Analyze this repository structure and refactor for high-concurrency event loops.',
      'Plan a multi-stage autonomous research workflow with step-by-step verification.'
    ]
  },
  {
    id: 'agentrouter/claude-opus-4-7',
    name: 'Claude Opus 4.7 Agent Router',
    provider: 'Anthropic',
    category: 'Reasoning',
    context_length: 1000000,
    description: 'AgentRouter 1M-context edition of Claude Opus 4.7. Balances deep multi-turn context retention with sophisticated logic synthesis and code refactoring.',
    pricing: { prompt: '$10.00/M', completion: '$50.00/M' },
    badge: '1M Context',
    suggestedPrompts: [
      'Audit this smart contract or distributed system for race conditions.',
      'Formulate a comprehensive test strategy for complex async business logic.',
      'Synthesize insights across multiple large technical specifications.'
    ]
  },
  {
    id: 'agentrouter/claude-opus-5',
    name: 'Claude Opus 5 Agent Router',
    provider: 'Anthropic',
    category: 'Reasoning',
    context_length: 1000000,
    description: 'Next-generation Anthropic foundation model on AgentRouter with unified 1M context. Outstanding synthetic reasoning, mathematical formulation, and cross-domain code generation.',
    pricing: { prompt: '$15.00/M', completion: '$75.00/M' },
    badge: 'Next-Gen • 1M Context',
    suggestedPrompts: [
      'Develop an optimal database query plan for petabyte-scale distributed data.',
      'Construct a verifiable zero-knowledge proof circuit verification module.',
      'Explore emergent failure modes in complex distributed agent systems.'
    ]
  },
  {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    category: 'Coding',
    context_length: 200000,
    description: 'Industry benchmark for software engineering, tool use, and visual artifact generation. Rapid response times with exceptional coding precision.',
    pricing: { prompt: '$3.00/M', completion: '$15.00/M' },
    badge: 'Coding Specialist',
    suggestedPrompts: [
      'Write a high-performance TypeScript WebSocket server with backpressure handling.',
      'Implement a reactive state management pipeline using modern functional patterns.',
      'Refactor this monolithic component into clean, reusable modular units.'
    ]
  },
  {
    id: 'anthropic/claude-3-5-haiku',
    name: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
    category: 'Fast',
    context_length: 200000,
    description: 'Blazing-fast lightweight Anthropic agent. Ideal for rapid sub-agent dispatch, high-throughput text classification, and responsive real-time chat.',
    pricing: { prompt: '$0.80/M', completion: '$4.00/M' },
    badge: 'Ultra Fast',
    suggestedPrompts: [
      'Extract structured JSON entities from this log stream.',
      'Summarize key discussion items into bullet points.',
      'Verify input validity against schema rules.'
    ]
  },
  {
    id: 'agentrouter/gpt-5.6-sol',
    name: 'GPT-5.6 Sol Agent Router',
    provider: 'OpenAI',
    category: 'Reasoning',
    context_length: 1000000,
    description: 'Frontier OpenAI model routed through AgentRouter with >1M context window. Sol engine excels in continuous system-level reasoning, code synthesis, and deep analytical queries.',
    pricing: { prompt: '$10.00/M', completion: '$40.00/M' },
    badge: '1M Context • Sol Engine',
    suggestedPrompts: [
      'Simulate an end-to-end distributed system failover and recovery process.',
      'Debug this complex memory leak across concurrent worker threads.',
      'Generate a formal specification for our API protocol and schema evolution.'
    ]
  },
  {
    id: 'agentrouter/gpt-5.5',
    name: 'GPT-5.5 Agent Router',
    provider: 'OpenAI',
    category: 'Reasoning',
    context_length: 1000000,
    description: 'OpenAI GPT-5.5 foundation agent on AgentRouter. Optimized for multi-agent workflows, tool integration, and enterprise reasoning across 1M tokens.',
    pricing: { prompt: '$7.50/M', completion: '$30.00/M' },
    badge: '1M Context',
    suggestedPrompts: [
      'Compare modern transactional storage engines with trade-offs analysis.',
      'Draft an enterprise-grade cloud migration plan with disaster recovery.',
      'Generate automated integration test suites for complex GraphQL APIs.'
    ]
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o Omnimodal',
    provider: 'OpenAI',
    category: 'Vision',
    context_length: 128000,
    description: 'OpenAI flagship omnimodal agent. High-speed multimodal comprehension, text and vision analysis, structured data parsing, and general assistance.',
    pricing: { prompt: '$2.50/M', completion: '$10.00/M' },
    badge: 'Vision & Omni',
    suggestedPrompts: [
      'Analyze this system architecture diagram and suggest optimizations.',
      'Translate this design wireframe into clean Tailwind CSS markup.',
      'Extract and tabularize complex financial tables from an invoice document.'
    ]
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    category: 'Fast',
    context_length: 128000,
    description: 'High-speed, cost-effective OpenAI model for high-frequency lightweight agent tasks and conversational interfaces.',
    pricing: { prompt: '$0.15/M', completion: '$0.60/M' },
    badge: 'Fast & Affordable',
    suggestedPrompts: [
      'Draft a concise, professional reply to a customer inquiry.',
      'Generate unit tests for this utility function.',
      'Format this unstructured data into clean CSV.'
    ]
  },
  {
    id: 'openai/o1',
    name: 'OpenAI o1 Reasoning',
    provider: 'OpenAI',
    category: 'Reasoning',
    context_length: 200000,
    description: 'Trained with reinforcement learning to perform deep internal chain-of-thought thinking before answering. World-class in competitive programming, math, and logic.',
    pricing: { prompt: '$15.00/M', completion: '$60.00/M' },
    badge: 'Deep Thinking',
    suggestedPrompts: [
      'Solve this complex dynamic programming challenge with proof of optimality.',
      'Derive the mathematical proof for convergence in this ML loss function.',
      'Examine edge cases and security vulnerabilities in this cryptographic protocol.'
    ]
  },
  {
    id: 'openai/o3-mini',
    name: 'OpenAI o3-mini',
    provider: 'OpenAI',
    category: 'Reasoning',
    context_length: 200000,
    description: 'Next-generation STEM reasoning model offering exceptional speed-to-intelligence ratio with adjustable reasoning effort levels.',
    pricing: { prompt: '$1.10/M', completion: '$4.40/M' },
    badge: 'STEM Reasoning',
    suggestedPrompts: [
      'Solve this calculus and linear algebra optimization problem.',
      'Write an optimized algorithm for traveling salesperson with heuristic pruning.',
      'Debug this complex concurrency deadlock scenario in Rust.'
    ]
  },
  {
    id: 'agentrouter/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash Agent Router',
    provider: 'DeepSeek',
    category: 'Fast',
    context_length: 128000,
    description: 'High-speed DeepSeek V4 variant optimized for automated agents, fast coding sweeps, and rapid API execution through AgentRouter.',
    pricing: { prompt: '$0.20/M', completion: '$0.80/M' },
    badge: 'Ultra Fast Code',
    suggestedPrompts: [
      'Write a bash deployment script with rollback handling.',
      'Optimize this SQL query with proper index recommendations.',
      'Refactor this function to be fully asynchronous and non-blocking.'
    ]
  },
  {
    id: 'agentrouter/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro Agent Router',
    provider: 'DeepSeek',
    category: 'Coding',
    context_length: 128000,
    description: 'Flagship DeepSeek model for deep engineering logic, sparse MoE activation, and massive automated test suite generation.',
    pricing: { prompt: '$0.50/M', completion: '$2.00/M' },
    badge: 'Engineering MoE',
    suggestedPrompts: [
      'Implement an in-memory B-Tree index with thread-safe node locking.',
      'Create a comprehensive unit test suite covering 100% of branch edge cases.',
      'Analyze time and space complexity bottlenecks in this algorithm.'
    ]
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek V3 Chat',
    provider: 'DeepSeek',
    category: 'General',
    context_length: 64000,
    description: 'State-of-the-art open-weights model rivaling frontier proprietary LLMs across diverse reasoning, multilingual, and general intelligence tasks.',
    pricing: { prompt: '$0.14/M', completion: '$0.28/M' },
    badge: 'Popular • Value',
    suggestedPrompts: [
      'Explain the inner workings of Multi-Head Latent Attention in modern LLMs.',
      'Draft a detailed comparison between REST, gRPC, and GraphQL.',
      'Help me plan a full-stack web application architecture.'
    ]
  },
  {
    id: 'deepseek/deepseek-reasoner',
    name: 'DeepSeek R1 Reasoning',
    provider: 'DeepSeek',
    category: 'Reasoning',
    context_length: 64000,
    description: 'Open reasoning model using large-scale RL without supervised fine-tuning. Exposes native <think> chain-of-thought blocks for complex problem solving.',
    pricing: { prompt: '$0.55/M', completion: '$2.19/M' },
    badge: 'Chain of Thought',
    suggestedPrompts: [
      'Analyze the correctness of this distributed consensus algorithm step-by-step.',
      'Solve this advanced mathematical logic puzzle with full deductive reasoning.',
      'Formulate a game-theoretic strategy for a multi-agent bidding system.'
    ]
  },
  {
    id: 'agentrouter/glm-5.3',
    name: 'GLM 5.3 Agent Router',
    provider: 'Other',
    category: 'Reasoning',
    context_length: 1000000,
    description: 'Zhipu AI GLM-5.3 with 1M-token context window on AgentRouter. Sparse MoE architecture for deep multi-turn engineering and bilingual reasoning.',
    pricing: { prompt: '$1.00/M', completion: '$3.00/M' },
    badge: '1M Context • Zhipu',
    suggestedPrompts: [
      'Translate and cross-reference bilingual technical documentation.',
      'Analyze long-horizon software architecture evolutions.',
      'Summarize 200 pages of legal contracts and identify key liability clauses.'
    ]
  },
  {
    id: 'agentrouter/glm-5.2',
    name: 'GLM 5.2 Agent Router',
    provider: 'Other',
    category: 'Coding',
    context_length: 1000000,
    description: 'AgentRouter 1M context version of GLM-5.2. Strong code intelligence and agentic tool invocation across large repositories.',
    pricing: { prompt: '$0.80/M', completion: '$2.50/M' },
    badge: '1M Context',
    suggestedPrompts: [
      'Scan a whole repository specification to spot missing interface implementations.',
      'Generate bilingual API documentation and Swagger definitions.',
      'Debug cross-language interoperability between Python and C++ bindings.'
    ]
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'Google',
    category: 'Vision',
    context_length: 2000000,
    description: 'Google flagship model with an unprecedented 2-million-token context window. Native multimodal reasoning across text, code, audio, video, and PDF documents.',
    pricing: { prompt: '$1.25/M', completion: '$5.00/M' },
    badge: '2M Context • Multimodal',
    suggestedPrompts: [
      'Synthesize insights across multiple entire textbooks or codebases.',
      'Analyze video storyboard frames and describe scene progression.',
      'Examine complex financial reports and find hidden discrepancies.'
    ]
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    category: 'Fast',
    context_length: 1000000,
    description: 'Sub-second latency with 1M-token context. Unmatched throughput for real-time agents, instant code reviews, and streaming interactions.',
    pricing: { prompt: '$0.075/M', completion: '$0.30/M' },
    badge: '1M Fast',
    suggestedPrompts: [
      'Perform a rapid security lint on this newly committed pull request.',
      'Stream real-time summaries of incoming customer feedback.',
      'Generate code documentation strings for all exported modules.'
    ]
  },
  {
    id: 'qwen/qwen-2.5-coder-32b-instruct',
    name: 'Qwen 2.5 Coder 32B',
    provider: 'Qwen',
    category: 'Coding',
    context_length: 128000,
    description: 'Alibaba open-weights coding specialist. Trained extensively on multi-language source code, algorithm benchmarks, and developer workflows.',
    pricing: { prompt: '$0.20/M', completion: '$0.20/M' },
    badge: 'Code Specialist',
    suggestedPrompts: [
      'Write a high-performance LRU cache implementation with O(1) ops in Go.',
      'Debug this complex memory management pointer error in C++.',
      'Transform this imperative loop structure into idiomatic functional stream.'
    ]
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    name: 'Llama 3.3 70B Instruct',
    provider: 'Meta',
    category: 'General',
    context_length: 128000,
    description: 'Flagship Meta open-source model. Exceptional general intelligence, instruction following, creative writing, and structured reasoning.',
    pricing: { prompt: '$0.35/M', completion: '$0.40/M' },
    badge: 'Meta Flagship',
    suggestedPrompts: [
      'Explain quantum computing concepts using simple everyday analogies.',
      'Write a detailed pitch deck outline for a new developer tooling startup.',
      'Critique this design proposal and highlight potential operational risks.'
    ]
  }
];

/**
 * Returns formatted AgentModel objects for all AgentRouter documented agents
 */
export function getAgentRouterDocsAgents(): AgentModel[] {
  return AGENTROUTER_DOCS_RAW_MODELS.map(raw => ({
    id: raw.id,
    name: raw.name,
    provider: raw.provider as AgentModel['provider'],
    category: raw.category as AgentModel['category'],
    contextWindow: raw.context_length,
    description: raw.description,
    badge: raw.badge,
    systemPrompt: `You are an AI agent powered by ${raw.name} (${raw.id}) routed via AgentRouter. Provide expert, precise, and thoughtful responses with clear reasoning and structured code.`,
    suggestedPrompts: raw.suggestedPrompts,
    isCustom: false
  }));
}
