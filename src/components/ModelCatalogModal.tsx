import React, { useState, useMemo } from 'react';
import { AgentModel } from '../utils/modelCatalog';
import { filterModels } from '../utils/modelParser';
import { X, Search, RefreshCw, Bot, ArrowRight, Sparkles, Cpu, Plus } from 'lucide-react';

interface ModelCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: AgentModel[];
  activeAgentId: string;
  onSelectAgent: (model: AgentModel) => void;
  onScrapeModels: () => void;
  onScrapeDocs?: () => void;
  onClearModels?: () => void;
  onAddDirectModel?: (modelId: string) => void;
  onOpenAddCustom?: () => void;
  isScraping: boolean;
  scrapeStatusMessage?: string;
}

export const ModelCatalogModal: React.FC<ModelCatalogModalProps> = ({
  isOpen,
  onClose,
  models,
  activeAgentId,
  onSelectAgent,
  onScrapeModels,
  onScrapeDocs,
  onClearModels,
  onAddDirectModel,
  onOpenAddCustom,
  isScraping,
  scrapeStatusMessage
}) => {
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [newModelInput, setNewModelInput] = useState('');

  const providers = ['All', 'Anthropic', 'OpenAI', 'DeepSeek', 'Google', 'Meta', 'Mistral', 'Qwen'];
  const categories = ['All', 'Reasoning', 'Coding', 'General', 'Fast', 'Vision'];

  const filteredModels = useMemo(() => {
    return filterModels(models, {
      search,
      provider: selectedProvider,
      category: selectedCategory
    });
  }, [models, search, selectedProvider, selectedCategory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-neutral-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white font-display truncate">
                Agent Directory
              </h2>
              <span className="text-[11px] sm:text-xs text-neutral-400 font-mono">
                ({models.length})
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-1 line-clamp-1 sm:line-clamp-none">
              Select any synchronized model or add a specific model ID to chat directly.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {onOpenAddCustom && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAddCustom();
                }}
                className="px-2.5 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-950/40 text-indigo-300 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors min-h-[36px]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Custom</span>
                <span className="sm:hidden">Custom</span>
              </button>
            )}

            {onScrapeDocs && (
              <button
                onClick={onScrapeDocs}
                disabled={isScraping}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-600 bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[36px]"
                title="Scrape from https://agentrouter.org/docs/index.html"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isScraping ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Scrape Docs</span>
                <span className="sm:hidden">Docs</span>
              </button>
            )}

            <button
              onClick={onScrapeModels}
              disabled={isScraping}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg border border-neutral-700 hover:border-neutral-600 bg-neutral-800 text-neutral-200 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 min-h-[36px]"
              aria-label="Refresh models from gateway"
              title="Sync with live gateway"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScraping ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isScraping ? 'Scraping...' : 'Sync Gateway'}</span>
              <span className="sm:hidden">{isScraping ? 'Syncing...' : 'Sync'}</span>
            </button>

            {models.length > 0 && onClearModels && (
              <button
                type="button"
                onClick={onClearModels}
                className="px-2 py-1.5 rounded-lg border border-neutral-700 hover:border-rose-900/60 bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-300 text-xs font-medium transition-colors min-h-[36px]"
                title="Clear all models"
              >
                Clear
              </button>
            )}

            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white p-2 rounded-lg transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {scrapeStatusMessage && (
          <div className="px-4 sm:px-6 py-2 bg-indigo-950/30 border-b border-indigo-900/30 text-xs text-indigo-300 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="truncate">{scrapeStatusMessage}</span>
          </div>
        )}

        {/* Direct Model ID Add Bar */}
        {onAddDirectModel && (
          <div className="px-4 sm:px-6 py-2.5 bg-neutral-900/90 border-b border-neutral-800 flex items-center gap-2">
            <input
              type="text"
              value={newModelInput}
              onChange={e => setNewModelInput(e.target.value)}
              placeholder="Add model ID directly (e.g. agentrouter/claude-opus-4-8)..."
              className="flex-1 bg-neutral-800 text-neutral-100 text-xs rounded-xl px-3 py-2 border border-neutral-700 font-mono focus:outline-hidden focus:border-indigo-500"
              onKeyDown={e => {
                if (e.key === 'Enter' && newModelInput.trim()) {
                  onAddDirectModel(newModelInput.trim());
                  setNewModelInput('');
                  onClose();
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newModelInput.trim()) {
                  onAddDirectModel(newModelInput.trim());
                  setNewModelInput('');
                  onClose();
                }
              }}
              disabled={!newModelInput.trim()}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[34px] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Model</span>
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="px-4 sm:px-6 py-3 border-b border-neutral-800/80 bg-neutral-900/50 space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full bg-neutral-800/90 text-neutral-100 placeholder-neutral-500 text-base sm:text-xs rounded-xl pl-9 pr-4 py-2 border border-neutral-700/60 focus:outline-hidden focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            {/* Provider Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
              <span className="text-neutral-500 mr-1 text-[11px] uppercase tracking-wider font-semibold shrink-0">
                Provider:
              </span>
              {providers.map(prov => (
                <button
                  key={prov}
                  onClick={() => setSelectedProvider(prov)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs min-h-[30px] ${
                    selectedProvider === prov
                      ? 'bg-neutral-800 text-white font-medium border border-neutral-700'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <span className="text-neutral-500 mr-1 text-[11px] uppercase tracking-wider font-semibold shrink-0">
                Role:
              </span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs min-h-[30px] ${
                    selectedCategory === cat
                      ? 'bg-indigo-600/30 text-indigo-300 font-medium border border-indigo-500/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Models Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {filteredModels.length === 0 ? (
            <div className="col-span-full py-16 text-center text-neutral-500 text-sm">
              No matching AI models found.
            </div>
          ) : (
            filteredModels.map(model => {
              const isSelected = model.id === activeAgentId;
              return (
                <div
                  key={model.id}
                  className={`rounded-xl p-3.5 sm:p-4 transition-all flex flex-col justify-between border ${
                    isSelected
                      ? 'bg-neutral-800/80 border-indigo-500/60 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-neutral-800/40 border-neutral-700/50 hover:border-neutral-600 hover:bg-neutral-800/60'
                  }`}
                >
                  <div>
                    {/* Top line: Name & Context */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-6 h-6 rounded-md bg-neutral-700/60 flex items-center justify-center text-neutral-300 shrink-0">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                        <h3 className="font-semibold text-sm text-neutral-100 truncate">
                          {model.name}
                        </h3>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-400 bg-neutral-900/60 px-2 py-0.5 rounded border border-neutral-800 shrink-0 tabular-nums">
                        {(model.contextWindow / 1000).toFixed(0)}k ctx
                      </span>
                    </div>

                    {/* Metadata line without pills */}
                    <div className="text-xs text-neutral-400 mb-2 flex items-center gap-1.5">
                      <span className="text-indigo-400 font-medium">{model.provider}</span>
                      <span>·</span>
                      <span>{model.category}</span>
                      {model.badge && (
                        <>
                          <span>·</span>
                          <span className="text-amber-400/90 truncate">{model.badge}</span>
                        </>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-neutral-300/90 line-clamp-2 leading-relaxed mb-3">
                      {model.description}
                    </p>

                    {/* Model ID snippet */}
                    <div className="font-mono text-[11px] text-neutral-500 bg-neutral-900/40 px-2 py-1 rounded truncate mb-3 select-all">
                      {model.id}
                    </div>
                  </div>

                  {/* Action CTA */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-700/40">
                    <span className="text-[11px] text-neutral-500">
                      {isSelected ? 'Active' : 'Ready'}
                    </span>
                    <button
                      onClick={() => {
                        onSelectAgent(model);
                        onClose();
                      }}
                      className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors min-h-[36px] ${
                        isSelected
                          ? 'bg-neutral-700 text-neutral-300 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                      aria-label={`Enlist and chat with ${model.name}`}
                    >
                      <span>{isSelected ? 'Active Agent' : 'Chat with Agent'}</span>
                      {!isSelected && <ArrowRight className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
