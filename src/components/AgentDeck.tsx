import React from 'react';
import { AgentModel } from '../utils/modelCatalog';
import { ChatSession } from '../utils/chatManager';
import { Layers, MessageSquare, Trash2, Sliders, Shield, RefreshCw, X, Key, Sparkles, History } from 'lucide-react';

interface AgentDeckProps {
  agents: AgentModel[];
  activeAgent: AgentModel | null;
  onSelectAgent: (agent: AgentModel) => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onOpenCatalog: () => void;
  onOpenConfig: () => void;
  onOpenApiKey: () => void;
  onOpenAddCustom?: () => void;
  onOpenPersonality?: () => void;
  onOpenHistory?: () => void;
  apiKey: string;
  onScrapeModels: () => void;
  onScrapeDocs?: () => void;
  onClearModels?: () => void;
  isScraping: boolean;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export const AgentDeck: React.FC<AgentDeckProps> = ({
  agents,
  activeAgent,
  onSelectAgent,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onOpenCatalog,
  onOpenConfig,
  onOpenApiKey,
  onOpenAddCustom,
  onOpenPersonality,
  onOpenHistory,
  apiKey,
  onScrapeModels,
  onScrapeDocs,
  onClearModels,
  isScraping,
  isOpenOnMobile = false,
  onCloseMobile
}) => {
  const quickAgents = agents.slice(0, 8);

  const handleSelectAgentAndClose = (agent: AgentModel) => {
    onSelectAgent(agent);
    if (onCloseMobile) onCloseMobile();
  };

  const handleSelectSessionAndClose = (id: string) => {
    onSelectSession(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="w-72 sm:w-80 md:w-72 bg-[#12151e]/95 backdrop-blur-md border-r border-white/5 flex flex-col h-full shrink-0 select-none">
      {/* Header with Mobile Close button */}
      <div className="p-3.5 border-b border-neutral-800 flex flex-col gap-2">
        <div className="flex items-center justify-between w-full">
          <span className="text-xs font-semibold text-neutral-300 tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Agents {agents.length > 0 && `(${agents.length})`}
          </span>
          <div className="flex items-center gap-1">
            {onOpenAddCustom && (
              <button
                type="button"
                onClick={() => {
                  onOpenAddCustom();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors p-1 rounded-md hover:bg-neutral-800 flex items-center gap-0.5"
                title="Add custom agent"
                aria-label="Add custom agent"
              >
                <span className="font-semibold text-sm">+</span>
                <span>Custom</span>
              </button>
            )}

            {agents.length > 0 && onClearModels && (
              <button
                type="button"
                onClick={onClearModels}
                className="text-xs text-neutral-500 hover:text-rose-400 transition-colors px-1.5 py-0.5"
                title="Clear all scraped models"
              >
                Clear
              </button>
            )}

            {onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden text-neutral-400 hover:text-white p-1 rounded-md min-w-[36px] min-h-[36px] flex items-center justify-center -mr-1"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Action bar for Scrape Docs & Scrape Gateway */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <button
            onClick={() => {
              if (onScrapeDocs) onScrapeDocs();
              else onScrapeModels();
            }}
            disabled={isScraping}
            className="w-full py-1.5 px-2 rounded-lg bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] font-medium text-neutral-200 hover:text-white flex items-center justify-center gap-1 transition-colors disabled:opacity-50 min-h-[32px]"
            title="Scrape all agents from https://agentrouter.org/docs/index.html"
          >
            <RefreshCw className={`w-3 h-3 text-indigo-400 ${isScraping ? 'animate-spin' : ''}`} />
            <span>Scrape Docs</span>
          </button>

          <button
            onClick={onScrapeModels}
            disabled={isScraping}
            className="w-full py-1.5 px-2 rounded-lg bg-neutral-800/90 hover:bg-neutral-800 border border-neutral-700/80 text-[11px] font-medium text-neutral-200 hover:text-white flex items-center justify-center gap-1 transition-colors disabled:opacity-50 min-h-[32px]"
            title="Scrape models from live API gateway"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Sync API</span>
          </button>
        </div>
      </div>

      {/* Scraped Model List or Empty State */}
      <div className="p-3 border-b border-neutral-800/80">
        {agents.length === 0 ? (
          <div className="py-5 px-2 text-center">
            <p className="text-xs text-neutral-400 mb-3">
              No models scraped yet.
            </p>
            <button
              onClick={() => {
                if (onScrapeDocs) onScrapeDocs();
                else onScrapeModels();
              }}
              disabled={isScraping}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
              <span>Scrape AgentRouter Docs</span>
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              {quickAgents.map(agent => {
                const isActive = activeAgent?.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => handleSelectAgentAndClose(agent)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors flex items-center justify-between group min-h-[44px] ${
                      isActive
                        ? 'bg-neutral-800 text-white font-medium border border-neutral-700/60 shadow-sm'
                        : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40'
                    }`}
                    aria-label={`Switch to agent ${agent.name}`}
                  >
                    <div className="truncate mr-2">
                      <div className="truncate text-[13px]">{agent.name}</div>
                      <div className="text-[11px] text-neutral-500 flex items-center gap-1 mt-0.5">
                        <span>{agent.provider}</span>
                        <span>·</span>
                        <span>{agent.category}</span>
                        {agent.isCustom && (
                          <span className="text-[9px] px-1 py-0.2 bg-indigo-900/60 text-indigo-300 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {agents.length > 8 && (
              <button
                onClick={() => {
                  onOpenCatalog();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="mt-2.5 w-full py-2 px-3 rounded-lg border border-dashed border-neutral-700/80 hover:border-indigo-500/60 text-xs text-neutral-300 hover:text-indigo-300 transition-colors flex items-center justify-center gap-1.5 bg-neutral-800/30 min-h-[40px]"
                aria-label="Browse full model catalog"
              >
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>All Scraped Models ({agents.length})</span>
              </button>
            )}
          </>
        )}
      </div>

      {/* Middle Section: Chat History Sessions */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-neutral-400 tracking-wide uppercase">
            Sessions
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-neutral-500 tabular-nums">
              {sessions.length}
            </span>
            {onOpenHistory && (
              <button
                type="button"
                onClick={() => {
                  onOpenHistory();
                  if (onCloseMobile) onCloseMobile();
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 p-1 rounded-md hover:bg-neutral-800 transition-colors flex items-center gap-1"
                title="Open full chat history and search"
                aria-label="Open chat history modal"
              >
                <History className="w-3.5 h-3.5" />
                <span className="text-[10px] hidden sm:inline">History</span>
              </button>
            )}
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-500">
            No active conversations.
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map(s => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-lg text-xs cursor-pointer transition-colors min-h-[42px] ${
                    isActive
                      ? 'bg-neutral-800/90 text-neutral-100 font-medium'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/30'
                  }`}
                  onClick={() => handleSelectSessionAndClose(s.id)}
                >
                  <div className="flex items-center gap-2 truncate mr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{s.title || 'Conversation'}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(s.id);
                    }}
                    className="text-neutral-500 hover:text-rose-400 p-1.5 rounded min-w-[32px] min-h-[32px] flex items-center justify-center"
                    title="Delete session"
                    aria-label={`Delete session ${s.title}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Section: Agent Fine-Tuning & Key Status */}
      <div className="p-3.5 border-t border-white/5 bg-[#12151e] space-y-2">
        {onOpenPersonality && (
          <button
            onClick={() => {
              onOpenPersonality();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full px-3 py-2 rounded-lg bg-indigo-950/30 hover:bg-indigo-950/60 text-indigo-300 hover:text-white transition-colors text-xs flex items-center justify-between border border-indigo-500/25 min-h-[40px] cursor-pointer"
            aria-label="Customize AI character persona"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Character Persona</span>
            </div>
            <span className="text-[11px] text-indigo-400 font-medium">Custom</span>
          </button>
        )}

        {activeAgent && (
          <button
            onClick={() => {
              onOpenConfig();
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full px-3 py-2.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-xs flex items-center justify-between border border-neutral-700/40 min-h-[44px]"
            aria-label="Configure active agent parameters"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Agent Parameters</span>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono">
              {activeAgent.temperature ?? 0.7}T
            </span>
          </button>
        )}

        <button
          onClick={() => {
            onOpenApiKey();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full px-3 py-2 rounded-lg text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40 transition-colors flex items-center justify-between min-h-[40px]"
          aria-label="Open API settings"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-neutral-500" />
            <span className="truncate">
              {apiKey ? 'API Key Connected' : 'Key Not Configured'}
            </span>
          </div>
          <span className="text-[11px] text-indigo-400 font-medium">Settings</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col h-full shrink-0">
        {content}
      </aside>

      {isOpenOnMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full shadow-2xl flex">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
