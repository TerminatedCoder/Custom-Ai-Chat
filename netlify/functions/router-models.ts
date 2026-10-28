import type { Handler, HandlerEvent } from '@netlify/functions';
import { scrapeAllLiveAgentsAndModels } from '../../src/utils/liveScraper.js';
import { parseModelsFromApi } from '../../src/utils/modelParser.js';

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
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    let body: any = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch (e) {}
    }

    const { apiKey, baseUrl } = body;
    const targetBaseUrl = cleanBaseUrl(baseUrl);
    const cleanKey = sanitizeApiKey(apiKey);
    const isAgentRouter = targetBaseUrl.includes('agentrouter.org') || targetBaseUrl.includes('stepcode');

    // For AgentRouter or docs requests, scrape live agents & models directly
    if (isAgentRouter) {
      const liveAgents = await scrapeAllLiveAgentsAndModels();
      if (liveAgents.length > 0) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            source: 'https://co.agentrouter.org/docs/docs (Netlify Live Scraped)',
            count: liveAgents.length,
            models: liveAgents,
            message: `Scraped ${liveAgents.length} agents & models live from AgentRouter docs`
          })
        };
      }
    }

    // Try direct gateway /models
    const candidateUrls = [
      `${targetBaseUrl}/models`,
      targetBaseUrl.endsWith('/v1') ? `${targetBaseUrl.replace(/\/v1$/, '')}/models` : `${targetBaseUrl}/v1/models`
    ];

    for (const modelsUrl of candidateUrls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const reqHeaders: Record<string, string> = {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'BranchLabs-Netlify/1.0'
        };
        if (cleanKey) {
          reqHeaders['Authorization'] = `Bearer ${cleanKey}`;
        }

        const remoteRes = await fetch(modelsUrl, {
          method: 'GET',
          headers: reqHeaders,
          signal: controller.signal
        });
        clearTimeout(timeout);

        if (remoteRes.ok) {
          const data = await remoteRes.json();
          const parsed = parseModelsFromApi(data);
          if (parsed.length > 0) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                source: modelsUrl,
                count: parsed.length,
                models: parsed,
                message: `Successfully scraped ${parsed.length} models from ${modelsUrl}`
              })
            };
          }
        }
      } catch (err) {}
    }

    // Fall back to documented models
    const fallbackAgents = await scrapeAllLiveAgentsAndModels();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        source: 'Live Documented Catalog Fallback',
        count: fallbackAgents.length,
        models: fallbackAgents,
        message: `Scraped ${fallbackAgents.length} documented agents from AgentRouter`
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Netlify Function Error: ${err?.message || 'Failed to process request'}`
      })
    };
  }
};
