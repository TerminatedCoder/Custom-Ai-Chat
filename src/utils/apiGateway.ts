/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentModel } from './modelCatalog';
import { parseModelsFromApi } from './modelParser';
import { scrapeAllLiveAgentsAndModels } from './liveScraper';
import { ChatMessage, parseSSEBuffer, generateDemoResponse } from './chatManager';

/**
 * Normalizes baseUrl and ensures correct protocol and path
 */
export function cleanBaseUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://co.agentrouter.org/v1';
  }
  let cleaned = url.trim().replace(/\/+$/, '');

  // Strip trailing endpoint paths if accidentally entered
  cleaned = cleaned.replace(/\/(models|chat\/completions|completions|docs\/index\.html|docs|portal\/models)$/i, '');

  // Map any agentrouter variations to the official API gateway
  if (cleaned.toLowerCase().includes('agentrouter.org') || cleaned.toLowerCase().includes('agent-router.org')) {
    return 'https://co.agentrouter.org/v1';
  }

  // Ensure protocol
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

/**
 * Sanitizes user-supplied API key
 */
export function sanitizeApiKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  return key
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]|['"`]$/g, '')
    .trim();
}

/**
 * Detects if a response returned HTML (e.g. Netlify 404 / SPA index.html fallback)
 * instead of expected JSON / SSE data
 */
export function isHtmlResponse(text: string, contentType?: string | null): boolean {
  if (contentType && (contentType.includes('text/html') || contentType.includes('application/xhtml+xml'))) {
    return true;
  }
  const sample = text.trim().slice(0, 80).toLowerCase();
  return sample.startsWith('<!doctype') || sample.startsWith('<html') || sample.startsWith('<head') || sample.startsWith('<!xml');
}

/**
 * Safely parses JSON from response text without throwing "Unexpected token '<'"
 */
export async function safeReadJson(res: Response): Promise<{ isHtml: boolean; data: any; rawText: string }> {
  const contentType = res.headers.get('content-type') || '';
  const rawText = await res.text();

  if (isHtmlResponse(rawText, contentType)) {
    return { isHtml: true, data: null, rawText };
  }

  try {
    const data = JSON.parse(rawText);
    return { isHtml: false, data, rawText };
  } catch (err) {
    return { isHtml: isHtmlResponse(rawText), data: null, rawText };
  }
}

/**
 * Scrapes or discovers models from live documentation or API gateway.
 * Resilient against Netlify / static hosting: if /api/router/models returns HTML,
 * falls back to direct client-side querying and live docs scraping!
 */
export async function fetchLiveModels(
  apiKey: string,
  baseUrl: string
): Promise<{ success: boolean; models: AgentModel[]; message: string; error?: string }> {
  const targetBaseUrl = cleanBaseUrl(baseUrl);
  const cleanKey = sanitizeApiKey(apiKey);

  // Attempt 1: Call backend proxy (Express dev server, production Node container, or Netlify function)
  try {
    const res = await fetch('/api/router/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: cleanKey,
        baseUrl: targetBaseUrl
      })
    });

    const { isHtml, data, rawText } = await safeReadJson(res);

    if (!isHtml && data && data.success && Array.isArray(data.models) && data.models.length > 0) {
      return {
        success: true,
        models: data.models,
        message: data.message || `Successfully scraped ${data.models.length} models!`
      };
    }

    if (!isHtml && data && !data.success && data.error) {
      // The API gateway explicitly returned an error (e.g. 401 invalid key)
      return {
        success: false,
        models: [],
        message: '',
        error: data.error
      };
    }

    // If it's HTML, we are on a static host like Netlify where /api/router/* is not routed to Node.
    // Proceed to client-side fallback below!
    if (isHtml) {
      console.info('Static hosting detected (received HTML from /api/router/models). Falling back to direct gateway & client-side scraping...');
    }
  } catch (networkErr: any) {
    console.warn('Backend proxy unreachable, falling back to direct client gateway:', networkErr?.message);
  }

  // Attempt 2: Direct Client-Side Gateway Query (for CORS-enabled endpoints like OpenAI, OpenRouter, AgentRouter, Ollama)
  try {
    const reqHeaders: Record<string, string> = {
      'Accept': 'application/json, text/plain, */*'
    };
    if (cleanKey) {
      reqHeaders['Authorization'] = `Bearer ${cleanKey}`;
    }

    const directRes = await fetch(`${targetBaseUrl}/models`, {
      method: 'GET',
      headers: reqHeaders
    });

    const { isHtml, data } = await safeReadJson(directRes);

    if (!isHtml && data) {
      const parsed = parseModelsFromApi(data);
      if (parsed.length > 0) {
        return {
          success: true,
          models: parsed,
          message: `Directly discovered ${parsed.length} models from ${targetBaseUrl}`
        };
      }
    }
  } catch (directErr) {
    // Direct CORS check failed (common when gateway forbids direct browser origin)
    console.info('Direct gateway query failed, scraping live docs catalog...');
  }

  // Attempt 3: Client-side scrape documentation catalog
  try {
    const liveDocModels = await scrapeAllLiveAgentsAndModels();
    if (liveDocModels.length > 0) {
      return {
        success: true,
        models: liveDocModels,
        message: `Scraped ${liveDocModels.length} agents & models from AgentRouter documentation!`
      };
    }
  } catch (docErr: any) {
    console.error('Client-side docs scrape error:', docErr);
  }

  return {
    success: false,
    models: [],
    message: '',
    error: `Unable to scrape models from ${targetBaseUrl}. Please check your API key and base URL.`
  };
}

/**
 * Scrapes all live documentation agents and models.
 * Resilient against Netlify / static hosts.
 */
export async function fetchLiveDocs(): Promise<{ success: boolean; models: AgentModel[]; message: string; error?: string }> {
  // Attempt 1: Call proxy endpoint
  try {
    const res = await fetch('/api/router/scrape-docs');
    const { isHtml, data } = await safeReadJson(res);

    if (!isHtml && data && data.success && Array.isArray(data.models) && data.models.length > 0) {
      return {
        success: true,
        models: data.models,
        message: data.message || `Scraped ${data.models.length} live models from AgentRouter docs!`
      };
    }
  } catch (err) {
    // Proxy failed, fall back to client-side
  }

  // Attempt 2: Client-side scraper
  try {
    const liveAgents = await scrapeAllLiveAgentsAndModels();
    if (liveAgents.length > 0) {
      return {
        success: true,
        models: liveAgents,
        message: `Scraped ${liveAgents.length} agents & models live from AgentRouter documentation!`
      };
    }
  } catch (err: any) {
    return {
      success: false,
      models: [],
      message: '',
      error: `Scraping error: ${err?.message || 'Failed to reach documentation'}`
    };
  }

  return {
    success: false,
    models: [],
    message: '',
    error: 'Failed to scrape live models from AgentRouter documentation.'
  };
}

/**
 * Chat streaming parameters
 */
export interface StreamChatParams {
  apiKey: string;
  baseUrl: string;
  agent: AgentModel;
  messages: ChatMessage[];
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onDelta: (delta: string) => void;
  onThought?: (thought: string) => void;
}

/**
 * Streams chat completions from the proxy or directly from the gateway if hosted statically on Netlify
 */
export async function streamChatCompletions(params: StreamChatParams): Promise<void> {
  const { apiKey, baseUrl, agent, messages, systemPrompt, temperature, maxTokens, signal, onDelta, onThought } = params;
  const targetBaseUrl = cleanBaseUrl(baseUrl);
  const cleanKey = sanitizeApiKey(apiKey);

  // Attempt 1: Call /api/router/chat proxy
  let proxyFailedWithHtml = false;

  try {
    const response = await fetch('/api/router/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: cleanKey,
        baseUrl: targetBaseUrl,
        model: agent.actualModelId || agent.id,
        protocol: agent.protocol,
        messages,
        systemPrompt,
        temperature: temperature ?? 0.7,
        maxTokens: maxTokens ?? 2048
      }),
      signal
    });

    const contentType = response.headers.get('content-type') || '';

    // If server returned HTML (Netlify 404 / SPA redirect)
    if (contentType.includes('text/html') || response.status === 404) {
      proxyFailedWithHtml = true;
    } else if (response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        streamBuffer += textChunk;

        // Check if stream received HTML error page
        if (isHtmlResponse(streamBuffer, contentType)) {
          proxyFailedWithHtml = true;
          break;
        }

        const { deltas, thoughts, remainingBuffer, isDone } = parseSSEBuffer(streamBuffer);
        streamBuffer = remainingBuffer;

        if (deltas.length > 0) {
          onDelta(deltas.join(''));
        }
        if (thoughts.length > 0 && onThought) {
          onThought(thoughts.join(''));
        }
        if (isDone) break;
      }

      if (!proxyFailedWithHtml) {
        return;
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') return;
    proxyFailedWithHtml = true;
  }

  // Fallback for Netlify / Static hosting:
  // If user provided an API key, try direct gateway completions; otherwise simulate intelligent response
  if (proxyFailedWithHtml) {
    if (cleanKey) {
      try {
        const directPayload = {
          model: agent.actualModelId || agent.id,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            ...messages.map(m => ({ role: m.role, content: m.content }))
          ],
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 2048,
          stream: true
        };

        const directRes = await fetch(`${targetBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanKey}`,
            'Accept': 'text/event-stream, application/json'
          },
          body: JSON.stringify(directPayload),
          signal
        });

        if (directRes.ok && directRes.body) {
          const reader = directRes.body.getReader();
          const decoder = new TextDecoder();
          let streamBuffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const textChunk = decoder.decode(value, { stream: true });
            streamBuffer += textChunk;

            const { deltas, thoughts, remainingBuffer, isDone } = parseSSEBuffer(streamBuffer);
            streamBuffer = remainingBuffer;

            if (deltas.length > 0) onDelta(deltas.join(''));
            if (thoughts.length > 0 && onThought) onThought(thoughts.join(''));
            if (isDone) break;
          }
          return;
        }
      } catch (directErr: any) {
        if (directErr.name === 'AbortError') return;
        console.warn('Direct gateway streaming failed, falling back to client demo stream:', directErr);
      }
    }

    // Client-side demo fallback
    const lastUserPrompt = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    const demoText = generateDemoResponse(agent, lastUserPrompt);
    const chunkSize = 20;
    for (let i = 0; i < demoText.length; i += chunkSize) {
      if (signal?.aborted) break;
      onDelta(demoText.slice(i, i + chunkSize));
      await new Promise(r => setTimeout(r, 12));
    }
  }
}
