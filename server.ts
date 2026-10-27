import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseModelsFromApi } from './src/utils/modelParser.js';
import { scrapeAllLiveAgentsAndModels, scrapeLiveAgentRouterPortal } from './src/utils/liveScraper.js';
import { generateDemoResponse } from './src/utils/chatManager.js';
import { AgentModel } from './src/utils/modelCatalog.js';

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
  cleaned = cleaned.replace(/\/(models|chat\/completions|completions|docs\/index\.html|docs|portal\/models)$/i, '');

  // Map any agentrouter variations to the official API gateway: https://co.agentrouter.org/v1
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
 * Scrapes agents and models dynamically from AgentRouter live documentation & portal
 * (Mirrors https://agentrouter.org/docs/index.html, claude-code.html, codex.html)
 */
app.all('/api/router/scrape-docs', async (_req: Request, res: Response) => {
  try {
    const liveAgents = await scrapeAllLiveAgentsAndModels();
    if (liveAgents.length > 0) {
      return res.json({
        success: true,
        source: 'https://co.agentrouter.org/docs/docs & portal (Live Scraped)',
        count: liveAgents.length,
        models: liveAgents,
        message: `Scraped ${liveAgents.length} agents & models live from AgentRouter documentation & portal.`
      });
    }
    return res.status(502).json({
      success: false,
      error: 'Unable to scrape live models from AgentRouter documentation.'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: `Scraping error: ${err?.message || 'Failed to reach documentation'}`
    });
  }
});

/**
 * POST /api/router/models
 * Strictly scrapes live models from the target API gateway or live documentation/portal
 */
app.post('/api/router/models', async (req: Request, res: Response) => {
  const { apiKey, baseUrl } = req.body;
  const rawUrl = typeof baseUrl === 'string' ? baseUrl.trim() : '';
  const isExplicitDocs = rawUrl.toLowerCase().includes('docs') || rawUrl.toLowerCase().includes('portal');
  const targetBaseUrl = cleanBaseUrl(baseUrl);
  const cleanKey = sanitizeApiKey(apiKey);
  const isAgentRouter = targetBaseUrl.includes('agentrouter.org') || targetBaseUrl.includes('stepcode');

  // When targeting AgentRouter, ALWAYS scrape live from official documentation & portal
  // (AgentRouter models are documented in claude-code.html, codex.html and /portal/models;
  // /v1/models returns 401 and must not be used as a validation gate)
  if (isAgentRouter || isExplicitDocs) {
    try {
      const liveAgents = await scrapeAllLiveAgentsAndModels();
      if (liveAgents.length > 0) {
        return res.json({
          success: true,
          source: 'https://co.agentrouter.org/docs/docs & portal (Live Scraped)',
          count: liveAgents.length,
          models: liveAgents,
          message: `Scraped ${liveAgents.length} agents & models live from AgentRouter docs (Claude Code, Codex, Cline, Roo Code, etc.)`
        });
      }
    } catch (e: any) {
      console.warn('Live scraper fallback warning:', e?.message);
    }
  }

  // If user pointed to another custom provider (e.g. self-hosted / OpenRouter / Ollama)
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
      }

      const remoteRes = await fetch(modelsUrl, {
        method: 'GET',
        headers: reqHeaders,
        signal: controller.signal
      });

      clearTimeout(timeout);

      const contentType = remoteRes.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const data = await remoteRes.json();

        // Check if gateway returned an explicit error object
        if (data && (data.code === 401 || data.code === 403 || data.error)) {
          const errorMsg = data.msg || data.error?.message || data.message || 'Authorization failed. Please check your API key.';
          return res.status(data.code || remoteRes.status || 401).json({
            success: false,
            error: `${errorMsg} (Gateway returned status ${data.code || remoteRes.status || 401})`
          });
        }

        const parsedModels = parseModelsFromApi(data);

        if (parsedModels.length > 0) {
          return res.json({
            success: true,
            source: modelsUrl,
            count: parsedModels.length,
            models: parsedModels,
            message: `Successfully scraped ${parsedModels.length} models from ${modelsUrl}.`
          });
        }

        lastError = `Endpoint ${modelsUrl} returned 0 models.`;
      } else if (remoteRes.status === 401) {
        return res.status(401).json({
          success: false,
          error: 'Invalid API Key. The gateway rejected authorization (401 Unauthorized). Please verify your API key.'
        });
      } else {
        const bodyText = await remoteRes.text().catch(() => '');
        lastError = `Gateway returned HTTP ${remoteRes.status}: ${bodyText.slice(0, 160)}`;
        lastStatus = remoteRes.status || 400;
      }
    } catch (err: any) {
      lastError = `Network connection error to ${modelsUrl}: ${err?.message || 'Connection timed out'}`;
      lastStatus = 504;
    }
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
    const lastUserMsg = Array.isArray(messages)
      ? [...messages].reverse().find(m => m.role === 'user')?.content || ''
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
    const responseText = generateDemoResponse(demoAgent, lastUserMsg);

    const chunks: string[] = [];
    const chunkSize = 20;
    for (let i = 0; i < responseText.length; i += chunkSize) {
      chunks.push(responseText.slice(i, i + chunkSize));
    }
    for (const piece of chunks) {
      const chunk = JSON.stringify({
        choices: [{ delta: { content: piece } }]
      });
      res.write(`data: ${chunk}\n\n`);
      await new Promise(r => setTimeout(r, 10));
    }
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

    // Resolve model ID: handle agent IDs, compound IDs, or direct models
    let resolvedModel = typeof model === 'string' ? model.trim() : '';
    if (resolvedModel.includes(':')) {
      resolvedModel = resolvedModel.split(':')[1].trim();
    }
    const agentModelMap: Record<string, string> = {
      'agent-claude-code': 'claude-opus-4-8',
      'agent-claude-code-vscode': 'claude-opus-4-7',
      'agent-codex': 'gpt-5.5',
      'agent-cline': 'claude-opus-4-8',
      'agent-roo-code': 'claude-opus-4-6',
      'agent-kilo-code': 'claude-opus-4-8',
      'agent-opencode': 'step3p5-code-alpha',
      'agent-qwen-code': 'step3p5-code-alpha',
      'agent-crush': 'step3p5-code-alpha',
      'agent-droid': 'step3p5-code-alpha',
      'agent-openclaw': 'step3p5-code-alpha',
      'agent-hermes': 'step3p5-code-alpha',
      'agent-pi': 'step3p5-code-alpha',
      'agent-claude-code-app': 'claude-opus-4-7',
      'agent-trae': 'claude-opus-4-8',
      'agent-craft': 'claude-opus-4-8'
    };
    if (agentModelMap[resolvedModel]) {
      resolvedModel = agentModelMap[resolvedModel];
    }

    const payload = {
      model: resolvedModel,
      messages: formattedMessages,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: typeof maxTokens === 'number' ? maxTokens : 2048,
      stream: true
    };

    const completionsUrl = `${targetBaseUrl}/chat/completions`;

    const reqHeaders: Record<string, string> = {
      'Authorization': `Bearer ${cleanKey}`,
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream, application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'HTTP-Referer': 'https://agentrouter.org',
      'X-Title': 'AgentRouter Client'
    };

    if (resolvedModel.includes('claude') || resolvedModel.includes('opus')) {
      reqHeaders['x-api-key'] = cleanKey;
      reqHeaders['anthropic-version'] = '2023-06-01';
    }

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
