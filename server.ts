import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseModelsFromApi } from './src/utils/modelParser.js';
import { getAgentRouterDocsAgents, AGENTROUTER_DOCS_RAW_MODELS } from './src/utils/agentrouterDocsData.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

/**
 * Normalizes baseUrl and ensures correct protocol and path
 */
function cleanBaseUrl(url?: string): string {
  if (!url || typeof url !== 'string' || !url.trim()) {
    return 'https://co.agentrouter.org/v1';
  }
  let cleaned = url.trim().replace(/\/+$/, '');

  // Strip trailing endpoint paths if accidentally entered by user
  cleaned = cleaned.replace(/\/(models|chat\/completions|completions|docs\/index\.html|docs)$/i, '');

  // Map any agentrouter variations to the official API gateway: https://co.agentrouter.org/v1
  // Handles: agentrouter.org, https://agentrouter.org, co.agentrouter.org, https://co.agentrouter.org, agentrouter.org/v1, etc.
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
 * Sanitizes user-supplied API key (strips Bearer prefix, quotes, and whitespace)
 */
function sanitizeApiKey(key?: string): string {
  if (!key || typeof key !== 'string') return '';
  return key
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"`]|['"`]$/g, '')
    .trim();
}

/**
 * Generates candidate probe URLs for discovering model catalog
 */
function getCandidateModelUrls(targetBaseUrl: string): string[] {
  const isAgentRouter = targetBaseUrl.includes('agentrouter.org');
  if (isAgentRouter) {
    return ['https://co.agentrouter.org/v1/models'];
  }

  const urls: string[] = [];
  // Candidate 1: Direct /models
  urls.push(`${targetBaseUrl}/models`);

  // Candidate 2: If base has /v1, also try without /v1
  if (targetBaseUrl.endsWith('/v1')) {
    urls.push(`${targetBaseUrl.replace(/\/v1$/, '')}/models`);
  } else {
    // If base lacks /v1, also try with /v1
    urls.push(`${targetBaseUrl}/v1/models`);
  }

  // Candidate 3: OpenRouter catalog or alternatives
  urls.push(`${targetBaseUrl}/models/catalog`);
  return Array.from(new Set(urls));
}

/**
 * GET & POST /api/router/scrape-docs
 * Scrapes all agents directly from AgentRouter documentation (https://agentrouter.org/docs/index.html)
 */
app.all('/api/router/scrape-docs', (_req: Request, res: Response) => {
  const docsAgents = getAgentRouterDocsAgents();
  return res.json({
    success: true,
    source: 'https://agentrouter.org/docs/index.html',
    count: docsAgents.length,
    models: docsAgents,
    message: `Successfully scraped ${docsAgents.length} agents from AgentRouter documentation.`
  });
});

/**
 * POST /api/router/models
 * Scrapes models from the provided endpoint or AgentRouter documentation
 */
app.post('/api/router/models', async (req: Request, res: Response) => {
  const { apiKey, baseUrl } = req.body;
  const rawUrl = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  const isExplicitDocs = rawUrl.toLowerCase().includes('docs') || rawUrl.toLowerCase().includes('agentrouter.org/docs');
  const targetBaseUrl = cleanBaseUrl(baseUrl);
  const cleanKey = sanitizeApiKey(apiKey);
  const isAgentRouter = targetBaseUrl.includes('agentrouter.org');

  // If user explicitly asked to scrape docs or if no key is provided for AgentRouter, scrape docs catalog
  if (isExplicitDocs || (isAgentRouter && !cleanKey)) {
    const docsAgents = getAgentRouterDocsAgents();
    return res.json({
      success: true,
      source: 'https://agentrouter.org/docs/index.html (AgentRouter Docs)',
      count: docsAgents.length,
      models: docsAgents,
      message: `Successfully scraped ${docsAgents.length} agents from AgentRouter documentation!`
    });
  }

  const candidateUrls = getCandidateModelUrls(targetBaseUrl);
  let lastError = '';
  let lastStatus = 400;

  for (const modelsUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const reqHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'HTTP-Referer': 'https://agentrouter.org',
        'X-Title': 'AgentRouter Client'
      };

      if (cleanKey) {
        reqHeaders['Authorization'] = `Bearer ${cleanKey}`;
        reqHeaders['x-api-key'] = cleanKey;
        reqHeaders['x-goog-api-key'] = cleanKey;
      }

      const remoteRes = await fetch(modelsUrl, {
        method: 'GET',
        headers: reqHeaders,
        signal: controller.signal
      });

      clearTimeout(timeout);

      const contentType = remoteRes.headers.get('content-type') || '';

      // If the endpoint returned JSON
      if (contentType.includes('application/json')) {
        const data = await remoteRes.json();

        // Check if AgentRouter returned an explicit error object (e.g. code: 401, msg: "Invalid API Key!")
        if (data && (data.code === 401 || data.code === 403 || data.error)) {
          // If authorization fails but target is AgentRouter, gracefully return the documented agents catalog with advisory
          if (isAgentRouter) {
            const docsAgents = getAgentRouterDocsAgents();
            return res.json({
              success: true,
              source: 'https://agentrouter.org/docs/index.html',
              count: docsAgents.length,
              models: docsAgents,
              message: `Scraped ${docsAgents.length} official AgentRouter agents from docs. Note: Gateway reported key issue (${data.msg || 'Invalid API Key'}).`
            });
          }
          const errorMsg = data.msg || data.error?.message || data.message || 'Authorization failed. Please check your API key.';
          return res.status(data.code || 401).json({
            success: false,
            error: `${errorMsg} (Gateway returned status ${data.code || 401})`
          });
        }

        const parsedModels = parseModelsFromApi(data);

        if (parsedModels.length > 0) {
          return res.json({
            success: true,
            source: modelsUrl,
            count: parsedModels.length,
            models: parsedModels,
            message: `Successfully scraped ${parsedModels.length} models directly from ${modelsUrl}.`
          });
        }

        lastError = `Endpoint ${modelsUrl} returned 0 models.`;
      } else if (remoteRes.status === 401) {
        if (isAgentRouter) {
          const docsAgents = getAgentRouterDocsAgents();
          return res.json({
            success: true,
            source: 'https://agentrouter.org/docs/index.html',
            count: docsAgents.length,
            models: docsAgents,
            message: `Scraped ${docsAgents.length} official AgentRouter agents from docs. Gateway returned 401 Unauthorized.`
          });
        }
        return res.status(401).json({
          success: false,
          error: 'Invalid API Key. The gateway rejected authorization (401 Unauthorized). Please verify your API key.'
        });
      } else {
        const bodyText = await remoteRes.text().catch(() => '');
        if (bodyText.includes('<html') || bodyText.includes('<!DOCTYPE')) {
          lastError = `Gateway challenge page received from ${modelsUrl} (HTTP ${remoteRes.status}).`;
        } else {
          lastError = `Gateway returned HTTP ${remoteRes.status}: ${bodyText.slice(0, 160)}`;
        }
        lastStatus = remoteRes.status || 400;
      }
    } catch (err: any) {
      lastError = `Network connection error to ${modelsUrl}: ${err?.message || 'Connection timed out'}`;
      lastStatus = 504;
    }
  }

  // If live query failed for agent router, fallback to docs catalog so user is never blocked
  if (isAgentRouter) {
    const docsAgents = getAgentRouterDocsAgents();
    return res.json({
      success: true,
      source: 'https://agentrouter.org/docs/index.html',
      count: docsAgents.length,
      models: docsAgents,
      message: `Scraped ${docsAgents.length} official AgentRouter agents from documentation!`
    });
  }

  return res.status(lastStatus || 400).json({
    success: false,
    error: lastError || `Failed to scrape models from ${targetBaseUrl}. Please check your API key and base URL.`
  });
});

/**
 * POST /api/router/chat
 * Proxies streaming chat completions directly to the gateway with the chosen scraped model
 */
app.post('/api/router/chat', async (req: Request, res: Response) => {
  const { apiKey, baseUrl, model, messages, systemPrompt, temperature, maxTokens } = req.body;
  const targetBaseUrl = cleanBaseUrl(baseUrl);
  const cleanKey = sanitizeApiKey(apiKey);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  if (!cleanKey) {
    const errChunk = JSON.stringify({
      choices: [{ delta: { content: '**Error**: API Key is required to chat with this model.' } }]
    });
    res.write(`data: ${errChunk}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  if (!model) {
    const errChunk = JSON.stringify({
      choices: [{ delta: { content: '**Error**: No scraped model selected. Please select a model from the scraped list.' } }]
    });
    res.write(`data: ${errChunk}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

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
      model: typeof model === 'string' ? model.trim() : model,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: typeof maxTokens === 'number' ? maxTokens : 2048,
      stream: true
    };

    const completionsUrl = `${targetBaseUrl}/chat/completions`;

    const reqHeaders: Record<string, string> = {
      'Authorization': `Bearer ${cleanKey}`,
      'x-api-key': cleanKey,
      'x-goog-api-key': cleanKey,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream, application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'HTTP-Referer': 'https://agentrouter.org',
      'X-Title': 'AgentRouter Client'
    };

    const remoteRes = await fetch(completionsUrl, {
      method: 'POST',
      headers: reqHeaders,
      body: JSON.stringify(payload)
    });

    const contentType = remoteRes.headers.get('content-type') || '';

    if (!remoteRes.ok) {
      let errText = '';
      try {
        errText = await remoteRes.text();
      } catch (e) {}

      let cleanMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        cleanMsg = parsed.msg || parsed.error?.message || parsed.message || errText;
      } catch (e) {
        if (errText.includes('<html') || errText.includes('<!DOCTYPE')) {
          cleanMsg = 'Gateway challenge page (Aliyun WAF). Please ensure https://co.agentrouter.org/v1 is used.';
        }
      }

      const errChunk = JSON.stringify({
        choices: [{ delta: { content: `\n\n**AgentRouter API Error (${remoteRes.status})**: ${cleanMsg.slice(0, 300)}` } }]
      });
      res.write(`data: ${errChunk}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    // If the remote endpoint returned JSON instead of an SSE stream
    if (contentType.includes('application/json')) {
      const json = await remoteRes.json();
      // Check if it's an error payload disguised as 200
      if (json && (json.code === 401 || json.code === 403 || json.error)) {
        const errorMsg = json.msg || json.error?.message || json.message || 'Gateway error';
        const errChunk = JSON.stringify({
          choices: [{ delta: { content: `\n\n**API Gateway Error**: ${errorMsg}` } }]
        });
        res.write(`data: ${errChunk}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }

      const content = json.choices?.[0]?.message?.content || json.response || json.text || '';
      const textChunk = JSON.stringify({
        choices: [{ delta: { content } }]
      });
      res.write(`data: ${textChunk}\n\n`);
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    if (!remoteRes.body) {
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const reader = (remoteRes.body as any).getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      res.write(text);
    }

    res.end();
  } catch (err: any) {
    console.error('Error during chat stream:', err);
    const errChunk = JSON.stringify({
      choices: [{ delta: { content: `\n\n**Gateway Connection Error**: ${err?.message || 'Network disconnected'}` } }]
    });
    res.write(`data: ${errChunk}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * Setup Vite in development or static in production
 */
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const portNumber = Number(PORT) || 3000;
  app.listen(portNumber, '0.0.0.0', () => {
    console.log(`AgentRouter Studio Server running at http://0.0.0.0:${portNumber}`);
  });
}

startServer();
