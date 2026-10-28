import type { Handler, HandlerEvent } from '@netlify/functions';
import { generateDemoResponse } from '../../src/utils/chatManager.js';
import { AgentModel } from '../../src/utils/modelCatalog.js';

function cleanBaseUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://co.agentrouter.org/v1';
  }
  let cleaned = url.trim().replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/(models|chat\/completions|completions|docs\/index\.html|docs|portal\/models)$/i, '');
  if (cleaned.toLowerCase().includes('agentrouter.org') || cleaned.toLowerCase().includes('agent-router.org')) {
    return 'https://co.agentrouter.org/v1';
  }
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

function sanitizeApiKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  return key
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]|['"`]$/g, '')
    .trim();
}

export const handler: Handler = async (event: HandlerEvent) => {
  const headers = {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  let body: any = {};
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {}
  }

  const { apiKey, baseUrl, model, messages, systemPrompt, temperature, maxTokens } = body;
  const targetBaseUrl = cleanBaseUrl(baseUrl);
  const cleanKey = sanitizeApiKey(apiKey);

  const lastUserMsg = Array.isArray(messages)
    ? [...messages].reverse().find((m: any) => m.role === 'user')?.content || ''
    : '';

  const demoAgent: AgentModel = {
    id: typeof model === 'string' ? model : 'claude-opus-4-8',
    name: typeof model === 'string' && model ? model.replace(/[-_]/g, ' ') : 'Claude Opus',
    provider: 'Anthropic',
    category: 'Coding',
    contextWindow: 128000,
    description: 'BranchLabs Coding Agent',
    systemPrompt: '',
    suggestedPrompts: []
  };

  // If no API key, return simulated agent completion
  if (!cleanKey) {
    const responseText = generateDemoResponse(demoAgent, lastUserMsg);
    const jsonChunk = JSON.stringify({
      choices: [{ delta: { content: responseText } }]
    });
    return {
      statusCode: 200,
      headers,
      body: `data: ${jsonChunk}\n\ndata: [DONE]\n\n`
    };
  }

  // If API key is present, proxy to gateway
  try {
    const formattedMessages: Array<{ role: string; content: string }> = [];
    if (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim()) {
      formattedMessages.push({ role: 'system', content: systemPrompt.trim() });
    }
    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (m.role === 'user' || m.role === 'assistant') {
          formattedMessages.push({ role: m.role, content: m.content });
        }
      }
    }

    const payload = {
      model: typeof model === 'string' ? model : 'claude-opus-4-8',
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: typeof maxTokens === 'number' ? maxTokens : 2048,
      stream: false
    };

    const remoteRes = await fetch(`${targetBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (remoteRes.ok) {
      const data = await remoteRes.json();
      const text = data.choices?.[0]?.message?.content || data.response || data.text || '';
      const chunk = JSON.stringify({
        choices: [{ delta: { content: text } }]
      });
      return {
        statusCode: 200,
        headers,
        body: `data: ${chunk}\n\ndata: [DONE]\n\n`
      };
    }

    const errText = await remoteRes.text().catch(() => '');
    const chunk = JSON.stringify({
      choices: [{ delta: { content: `\n\n**Gateway Error (${remoteRes.status})**: ${errText.slice(0, 240)}` } }]
    });
    return {
      statusCode: 200,
      headers,
      body: `data: ${chunk}\n\ndata: [DONE]\n\n`
    };
  } catch (err: any) {
    const fallback = generateDemoResponse(demoAgent, lastUserMsg);
    const chunk = JSON.stringify({
      choices: [{ delta: { content: fallback } }]
    });
    return {
      statusCode: 200,
      headers,
      body: `data: ${chunk}\n\ndata: [DONE]\n\n`
    };
  }
};
