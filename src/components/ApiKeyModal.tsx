import React, { useState } from 'react';
import { X, Key, Eye, EyeOff, ShieldCheck, Check, Globe } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  baseUrl: string;
  onSave: (key: string, url: string) => void;
  isScraping?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  baseUrl,
  onSave,
  isScraping
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputUrl, setInputUrl] = useState(baseUrl || 'https://co.agentrouter.org/v1');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(inputKey.trim(), inputUrl.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleQuickPreset = (url: string) => {
    setInputUrl(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-md max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-neutral-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">
                Gateway & API Key Setup
              </h3>
              <p className="text-xs text-neutral-400">
                Provide custom key to scrape models and chat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1"
            aria-label="Close API Key dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs overflow-y-auto">
          {/* Base URL */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <span>Router Gateway Base URL</span>
              </label>
              <a
                href="https://agentrouter.org/docs/index.html"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
              >
                Docs ↗
              </a>
            </div>
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="https://co.agentrouter.org/v1"
              className="w-full bg-neutral-800/90 text-neutral-100 placeholder-neutral-500 text-base sm:text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700/60 focus:outline-hidden focus:border-indigo-500 font-mono"
            />
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-neutral-500">Presets:</span>
              <button
                type="button"
                onClick={() => handleQuickPreset('https://co.agentrouter.org/v1')}
                className="px-2.5 py-1 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/50 min-h-[30px]"
              >
                agentrouter.org (co)
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset('https://openrouter.ai/api/v1')}
                className="px-2.5 py-1 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/50 min-h-[30px]"
              >
                openrouter.ai
              </button>
            </div>
          </div>

          {/* API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">
                Custom API Key
              </label>
              {inputKey && (
                <button
                  type="button"
                  onClick={() => setInputKey('')}
                  className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors py-1"
                >
                  Clear Key
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-neutral-800/90 text-neutral-100 placeholder-neutral-500 text-base sm:text-xs rounded-xl pl-3.5 pr-10 py-2.5 border border-neutral-700/60 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Privacy Note */}
          <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your API key is saved locally in your browser and used securely to scrape models and route completions to the gateway.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isScraping}
            className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-sm min-h-[40px] cursor-pointer"
          >
            {saved ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Saved & Scraping</span>
              </>
            ) : (
              <span>Save & Scrape Models</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
