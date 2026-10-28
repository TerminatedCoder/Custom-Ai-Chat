import React from 'react';
import { Key, Globe, Plus, ShieldCheck, Layers, Menu, Sparkles, History } from 'lucide-react';
import { AgentModel } from '../utils/modelCatalog';

interface HeaderProps {
  activeAgent: AgentModel | null;
  apiKey: string;
  onOpenApiKeyModal: () => void;
  onOpenCatalogModal: () => void;
  onNewChat: () => void;
  onToggleMobileDrawer: () => void;
  onScrapeDocs?: () => void;
  onOpenAddCustom?: () => void;
  onOpenPersonality?: () => void;
  onOpenHistory?: () => void;
  historyCount?: number;
  scrapedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeAgent,
  apiKey,
  onOpenApiKeyModal,
  onOpenCatalogModal,
  onNewChat,
  onToggleMobileDrawer,
  onScrapeDocs,
  onOpenAddCustom,
  onOpenPersonality,
  onOpenHistory,
  historyCount = 0,
  scrapedCount
}) => {
  return (
    <header className="flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3 bg-[#12151d]/85 backdrop-blur-md border-b border-white/5 shrink-0 z-30">
      {/* Zone 1: Brand Wordmark & Mobile Drawer Trigger */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileDrawer}
          className="md:hidden p-2 -ml-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <a
          href="/"
          className="text-base md:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm font-display font-semibold text-xs md:text-sm">
            BL
          </div>
          <span>BranchLabs</span>
        </a>
      </div>

      {/* Zone 2: Navigation & Context Links (Desktop) */}
      <nav className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-medium text-neutral-400">
        <button
          onClick={onOpenCatalogModal}
          className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <Layers className="w-4 h-4 text-indigo-400" />
          <span>Scraped Agents ({scrapedCount})</span>
        </button>

        {onScrapeDocs && (
          <button
            onClick={onScrapeDocs}
            className="text-xs px-2 py-1 rounded bg-indigo-950/40 text-indigo-300 hover:text-white border border-indigo-900/50 hover:border-indigo-700 transition-colors flex items-center gap-1"
            title="Scrape directly from https://agentrouter.org/docs/index.html"
          >
            <span>Scrape Docs</span>
          </button>
        )}

        {onOpenAddCustom && (
          <button
            onClick={onOpenAddCustom}
            className="text-xs px-2 py-1 rounded bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700 transition-colors flex items-center gap-1"
            title="Add a custom agent or model ID"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>Add Custom</span>
          </button>
        )}

        {onOpenPersonality && (
          <button
            onClick={onOpenPersonality}
            className="text-xs px-2.5 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 hover:text-white border border-indigo-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Configure AI character persona and custom instructions"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Persona</span>
          </button>
        )}

        <span className="text-neutral-600">·</span>

        <div className="flex items-center gap-2 whitespace-nowrap shrink-0 text-neutral-300">
          <span className="text-neutral-500">Active:</span>
          {activeAgent ? (
            <>
              <span className="text-white font-medium">{activeAgent.name}</span>
              <span className="text-xs text-neutral-500 font-mono">({activeAgent.provider})</span>
            </>
          ) : (
            <span className="text-amber-400 font-medium">None</span>
          )}
        </div>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {onOpenHistory && (
          <button
            onClick={onOpenHistory}
            className="px-2.5 md:px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800/80 hover:bg-neutral-700/80 rounded-lg border border-neutral-700/80 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px] cursor-pointer"
            aria-label="Open chat history"
            title="View chat history and previous conversations"
          >
            <History className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">History</span>
            {typeof historyCount === 'number' && historyCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono">
                {historyCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onOpenApiKeyModal}
          className={`px-2.5 md:px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 min-h-[38px] ${
            apiKey
              ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/40'
              : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700 text-white'
          }`}
          aria-label="Manage API Key"
        >
          {apiKey ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Key Connected</span>
              <span className="sm:hidden text-[11px]">Key</span>
            </>
          ) : (
            <>
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Connect API Key</span>
              <span className="sm:hidden text-[11px]">Key</span>
            </>
          )}
        </button>

        <button
          onClick={onNewChat}
          disabled={!activeAgent}
          className="px-3 md:px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-sm min-h-[38px]"
          aria-label="Start new chat session"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">New Chat</span>
          <span className="sm:hidden text-[11px]">New</span>
        </button>
      </div>
    </header>
  );
};
