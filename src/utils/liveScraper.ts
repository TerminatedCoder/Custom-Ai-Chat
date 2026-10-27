/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AgentModel } from './modelCatalog.js';
import { detectProvider, categorizeModel } from './modelParser.js';

/**
 * Scrapes live agents and models directly from AgentRouter documentation
 * Source: https://co.agentrouter.org/docs/docs (mirrors https://agentrouter.org/docs/index.html, claude-code.html, codex.html)
 */
export async function scrapeLiveAgentRouterDocs(): Promise<AgentModel[]> {
  try {
    const docsUrl = 'https://co.agentrouter.org/docs/docs';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(docsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`Docs scraping returned HTTP ${res.status}`);
      return [];
    }

    const html = await res.text();
    const articleRegex = /<article\s+class="agent"\s+id="([^"]+)">([\s\S]*?)<\/article>/g;
    let match: RegExpExecArray | null;

    const scrapedAgents: AgentModel[] = [];
    const modelReferenceMap = new Map<string, { modelId: string; providers: string[]; referencedBy: string[] }>();

    while ((match = articleRegex.exec(html)) !== null) {
      const sectionId = match[1];
      const body = match[2];
      const nameMatch = body.match(/<span class="nm">([^<]+)<\/span>/);
      const ctMatch = body.match(/<span class="ct">([^<]+)<\/span>/);
      const descMatch = body.match(/<p>([\s\S]*?)<\/p>/);
      const cleanText = body.replace(/<[^>]+>/g, ' ').replace(/&quot;/g, '"');

      // Extract model identifiers mentioned in code blocks or parameters
      const candidates = [
        ...cleanText.matchAll(/(claude-opus-[\d.-]+|gpt-[\d.]+|kimi-[\d.a-z]+|glm-[\d.]+|step[\w.-]+)/gi)
      ]
        .map(m => m[1].toLowerCase().replace(/-+$/, ''))
        .filter(m => !m.includes('key') && m !== 'stepcode');

      const uniqueModels = [...new Set(candidates)];
      const rawAgentName = nameMatch ? nameMatch[1].trim() : sectionId;
      const compatibility = ctMatch ? ctMatch[1].trim() : 'AgentRouter';
      const desc = descMatch
        ? descMatch[1].replace(/<[^>]+>/g, '').trim()
        : `AgentRouter documented agent (${sectionId})`;

      const isAnthropic =
        compatibility.toLowerCase().includes('anthropic') ||
        sectionId.includes('claude');

      const defaultModel =
        uniqueModels[0] || (isAnthropic ? 'claude-opus-4-8' : 'gpt-5.5');

      const provider = isAnthropic ? 'Anthropic' : detectProvider(defaultModel);

      // 1. Add the documented Agent Persona
      scrapedAgents.push({
        id: sectionId,
        name: `${rawAgentName}`,
        actualModelId: defaultModel,
        provider,
        category: 'Coding',
        protocol: isAnthropic ? 'anthropic' : 'openai',
        contextWindow: isAnthropic || defaultModel.includes('opus') ? 1000000 : 128000,
        description: `${desc} [Compatibility: ${compatibility}]`,
        badge: `${compatibility.split('·')[0].trim()} · Docs Scraped`,
        docsSection: sectionId,
        systemPrompt: `You are ${rawAgentName}, an AI coding agent routed via AgentRouter (${isAnthropic ? 'Anthropic Protocol' : 'OpenAI Compatible Protocol'}). Follow user specifications with precision, modularity, and production-grade code.`,
        suggestedPrompts: [
          `How do I configure ${rawAgentName} with AgentRouter?`,
          'Write a production-ready async workflow with comprehensive error handling.',
          'Review this codebase architecture and suggest optimizations.'
        ],
        isCustom: false
      });

      // Record models referenced across agents
      for (const m of uniqueModels) {
        if (!modelReferenceMap.has(m)) {
          modelReferenceMap.set(m, {
            modelId: m,
            providers: [provider],
            referencedBy: [rawAgentName]
          });
        } else {
          const entry = modelReferenceMap.get(m)!;
          if (!entry.referencedBy.includes(rawAgentName)) {
            entry.referencedBy.push(rawAgentName);
          }
        }
      }
    }

    // 2. Add individual comparative models extracted from docs
    for (const [modelId, info] of modelReferenceMap.entries()) {
      const isAnthropic = modelId.includes('claude') || modelId.includes('opus');
      const provider = detectProvider(modelId);
      const category = categorizeModel(modelId, info.referencedBy.join(', '));
      const modelDisplayName = modelId
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
        .toUpperCase();

      scrapedAgents.push({
        id: modelId,
        name: `${modelDisplayName} (Comparative Model)`,
        actualModelId: modelId,
        provider,
        category,
        protocol: isAnthropic ? 'anthropic' : 'openai',
        contextWindow: isAnthropic || modelId.includes('5.5') ? 1000000 : 128000,
        description: `Direct comparative model (${modelId}) routed via AgentRouter. Referenced in docs by: ${info.referencedBy.join(', ')}.`,
        badge: `${provider} · Docs Scraped`,
        systemPrompt: `You are an AI assistant powered by ${modelId} routed via AgentRouter. Deliver thorough, accurate, and high-performance answers.`,
        suggestedPrompts: [
          `What are the advantages of ${modelId} compared to standard models?`,
          'Generate high-performance algorithms for data processing.',
          'Draft a clear technical specification for a scalable system.'
        ],
        isCustom: false
      });
    }

    return scrapedAgents;
  } catch (err) {
    console.error('Error during live docs scraping:', err);
    return [];
  }
}

/**
 * Dynamically scrapes live model catalog directly from the live AgentRouter web portal in real-time
 * Source: https://co.agentrouter.org/portal/models
 */
export async function scrapeLiveAgentRouterPortal(): Promise<AgentModel[]> {
  try {
    const portalUrl = 'https://co.agentrouter.org/portal/models';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(portalUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const html = await res.text();
    const chunkMatch = html.match(/\/portal\/_next\/static\/chunks\/app\/portal\/models\/page-[a-f0-9]+\.js/);
    if (!chunkMatch) return [];

    const jsRes = await fetch(`https://co.agentrouter.org${chunkMatch[0]}`);
    if (!jsRes.ok) return [];

    const jsText = await jsRes.text();

    const modelRegex =
      /\{id:"([^"]+)",name:"([^"]+)",provider:"([^"]+)",description:\{zh:"([^"]*)",en:"([^"]*)"\}[^}]*pricing:\{input:"([^"]*)",output:"([^"]*)"\}\}/g;
    const scraped: AgentModel[] = [];
    let match: RegExpExecArray | null;

    while ((match = modelRegex.exec(jsText)) !== null) {
      const id = match[1];
      const name = match[2];
      const providerStr = match[3];
      const desc = match[5] || match[4] || `AgentRouter portal model ${id}`;
      const provider = detectProvider(providerStr || id);
      const category = categorizeModel(id, desc);
      const isAnthropic = id.includes('opus') || id.includes('claude');

      scraped.push({
        id,
        name,
        actualModelId: id,
        provider,
        category,
        protocol: isAnthropic ? 'anthropic' : 'openai',
        contextWindow: id.includes('opus') || id.includes('5.5') || id.includes('5.2') ? 1000000 : 128000,
        description: desc,
        badge: `${provider} · Portal Scraped`,
        systemPrompt: `You are an AI assistant powered by ${name} (${id}) routed via AgentRouter. Provide clear, accurate, and insightful responses.`,
        suggestedPrompts: [
          `What are the key capabilities and strengths of ${name}?`,
          'Help me analyze a complex engineering problem step-by-step.',
          'Write clean, idiomatic code for this task.'
        ],
        isCustom: false
      });
    }

    return scraped;
  } catch (err) {
    console.error('Error during live portal scraping:', err);
    return [];
  }
}

/**
 * Combines both documentation agents (Claude Code, Codex, Cline, etc.) and live portal models
 * into a single comprehensive live catalog with deduplication
 */
export async function scrapeAllLiveAgentsAndModels(): Promise<AgentModel[]> {
  const [docsAgents, portalModels] = await Promise.all([
    scrapeLiveAgentRouterDocs().catch(() => [] as AgentModel[]),
    scrapeLiveAgentRouterPortal().catch(() => [] as AgentModel[])
  ]);

  const combinedMap = new Map<string, AgentModel>();

  // Add documentation agents first
  for (const agent of docsAgents) {
    combinedMap.set(agent.id, agent);
  }

  // Add portal models, merging if necessary
  for (const model of portalModels) {
    if (!combinedMap.has(model.id)) {
      combinedMap.set(model.id, model);
    } else {
      // If already present, enhance description or badge
      const existing = combinedMap.get(model.id)!;
      combinedMap.set(model.id, {
        ...existing,
        badge: `${existing.badge} / Portal Verified`
      });
    }
  }

  return Array.from(combinedMap.values());
}
