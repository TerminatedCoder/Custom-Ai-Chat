import React, { useState } from 'react';
import { AgentModel } from '../utils/modelCatalog';
import { X, Sliders, Check, RotateCcw } from 'lucide-react';

interface AgentConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: AgentModel;
  onUpdateAgent: (updated: AgentModel) => void;
}

export const AgentConfigModal: React.FC<AgentConfigModalProps> = ({
  isOpen,
  onClose,
  agent,
  onUpdateAgent
}) => {
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [temperature, setTemperature] = useState(agent.temperature ?? 0.7);
  const [maxTokens, setMaxTokens] = useState(agent.maxTokens ?? 2048);
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onUpdateAgent({
      ...agent,
      systemPrompt,
      temperature,
      maxTokens
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handlePreset = (type: 'architect' | 'thinker' | 'concise' | 'creative') => {
    if (type === 'architect') {
      setSystemPrompt('You are a Principal Software Architect. Provide robust, scalable systems designs, clear trade-off analyses, and production-grade TypeScript implementations with zero fluff.');
      setTemperature(0.3);
    } else if (type === 'thinker') {
      setSystemPrompt('You are a Deep Analytical Thinker. Explore problems from foundational first-principles, examine edge-cases, and present rigorous, logically verified solutions.');
      setTemperature(0.5);
    } else if (type === 'concise') {
      setSystemPrompt('You are a Laser-Focused AI Engineer. Be extremely concise, direct, and provide immediate executable solutions without preamble.');
      setTemperature(0.2);
    } else if (type === 'creative') {
      setSystemPrompt('You are a Strategic AI Innovator. Offer creative, unconventional solutions, imaginative technical synthesis, and high-impact design ideas.');
      setTemperature(0.9);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-neutral-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-white text-base font-display truncate">
              Configure {agent.name.split(' ')[0]}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1"
            aria-label="Close configuration"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
              Persona Presets
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handlePreset('architect')}
                className="px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white text-left transition-colors min-h-[40px]"
              >
                📐 Architect
              </button>
              <button
                type="button"
                onClick={() => handlePreset('thinker')}
                className="px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white text-left transition-colors min-h-[40px]"
              >
                🧠 Thinker
              </button>
              <button
                type="button"
                onClick={() => handlePreset('concise')}
                className="px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white text-left transition-colors min-h-[40px]"
              >
                ⚡ Concise
              </button>
              <button
                type="button"
                onClick={() => handlePreset('creative')}
                className="px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800/60 hover:bg-neutral-800 text-xs text-neutral-300 hover:text-white text-left transition-colors min-h-[40px]"
              >
                ✨ Creative
              </button>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              System Instructions & Persona
            </label>
            <textarea
              rows={4}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="Define custom behavior, tone, domain constraints..."
              className="w-full bg-neutral-800/90 text-neutral-100 placeholder-neutral-500 text-base sm:text-xs rounded-xl p-3 border border-neutral-700/60 focus:outline-hidden focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* Temperature */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-neutral-400 uppercase tracking-wider">
                Temperature
              </span>
              <span className="font-mono text-indigo-400 tabular-nums font-medium">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer h-2"
            />
            <div className="flex justify-between text-[11px] text-neutral-500 mt-1">
              <span>0.0 Precise</span>
              <span>1.5 Creative</span>
            </div>
          </div>

          {/* Max Tokens */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-neutral-400 uppercase tracking-wider">
                Max Output Tokens
              </span>
              <span className="font-mono text-indigo-400 tabular-nums font-medium">
                {maxTokens}
              </span>
            </div>
            <input
              type="range"
              min="256"
              max="8192"
              step="256"
              value={maxTokens}
              onChange={e => setMaxTokens(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-500 cursor-pointer h-2"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => {
              setSystemPrompt(agent.systemPrompt);
              setTemperature(0.7);
              setMaxTokens(2048);
            }}
            className="text-xs text-neutral-400 hover:text-neutral-200 flex items-center gap-1.5 min-h-[40px] px-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
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
              className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm min-h-[40px]"
            >
              {saved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved</span>
                </>
              ) : (
                <span>Apply Parameters</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
