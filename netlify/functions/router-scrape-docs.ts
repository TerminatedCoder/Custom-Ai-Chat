import type { Handler } from '@netlify/functions';
import { scrapeAllLiveAgentsAndModels } from '../../src/utils/liveScraper.js';

export const handler: Handler = async () => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  try {
    const liveAgents = await scrapeAllLiveAgentsAndModels();
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        source: 'https://co.agentrouter.org/docs/docs (Netlify Live Scraped)',
        count: liveAgents.length,
        models: liveAgents,
        message: `Scraped ${liveAgents.length} agents & models live from AgentRouter documentation.`
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: `Scraping error: ${err?.message || 'Failed to reach documentation'}`
      })
    };
  }
};
