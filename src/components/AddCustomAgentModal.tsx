/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AgentModel } from '../utils/modelCatalog';
import { detectProvider, categorizeModel } from '../utils/modelParser';
import { X, Plus, Sparkles, Sliders, Check } from 'lucide-react';

interface AddCustomAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAgent: (newAgent: AgentModel) => void;
}

export const AddCustomAgentModal: React.FC<AddCustomAgentModalProps> = ({
  isOpen,
  onClose,
  onAddAgent
}) => {
  const [modelId, setModelId] = useState('');
  const [name, setName] = useState('');
  const [provider, setProvider] = useState<AgentModel['provider']>('Anthropic');
  const [category, setCategory] = useState<AgentModel['category']>('Reasoning');
  const [contextWindow, setContextWindow] = useState(1000000);
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleModelIdChange = (val: string) => {
    setModelId(val);
    // Auto-detect provider & category if empty
    if (!name.trim()) {
      const clean = val
        .replace(/^[^/]+\//, '')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
      setName(clean);
    }
    const detectedProv = detectProvider(val);
    setProvider(detectedProv);
    const detectedCat = categorizeModel(val);
    setCategory(detectedCat);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelId.trim()) return;

    const finalName = name.trim() || modelId.trim();
    const finalSystemPrompt =
      systemPrompt.trim() ||
      `You are an expert AI agent powered by ${finalName} (${modelId.trim()}) routed via AgentRouter. Provide structured, accurate, and insightful reasoning with clean code.`;

    const newAgent: AgentModel = {
      id: modelId.trim(),
      name: finalName,
      provider,
      category,
      contextWindow: Number(contextWindow) || 128000,
      description: description.trim() || `Custom configured agent using ${modelId.trim()}.`,
      badge: 'Custom Agent',
      systemPrompt: finalSystemPrompt,
      temperature,
      maxTokens,
      isCustom: true,
      suggestedPrompts: [
        `What are your primary specialties as ${finalName}?`,
        'Help me analyze a complex engineering problem.',
        'Write production-ready, clean code for my task.'
      ]
    };

    onAddAgent(newAgent);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
      // Reset form
      setModelId('');
      setName('');
      setDescription('');
      setSystemPrompt('');
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs">
      <div className="bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-neutral-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">
                Add Custom Agent
              </h3>
              <p className="text-[11px] text-neutral-400">
                Register any model ID or custom agent persona
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1"
            aria-label="Close add agent dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Model ID */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Model ID (Required)
            </label>
            <input
              type="text"
              required
              value={modelId}
              onChange={e => handleModelIdChange(e.target.value)}
              placeholder="e.g. agentrouter/claude-opus-4-8 or anthropic/claude-3-7-sonnet"
              className="w-full bg-neutral-800 text-neutral-100 placeholder-neutral-500 text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700 font-mono focus:outline-hidden focus:border-indigo-500"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Supports any OpenAI, Anthropic, DeepSeek, or AgentRouter compatible model identifier.
            </p>
          </div>

          {/* Agent Display Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Agent Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Senior Security Auditor or Claude Opus Agent"
              className="w-full bg-neutral-800 text-neutral-100 placeholder-neutral-500 text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700 focus:outline-hidden focus:border-indigo-500"
            />
          </div>

          {/* Provider & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Provider Family
              </label>
              <select
                value={provider}
                onChange={e => setProvider(e.target.value as any)}
                className="w-full bg-neutral-800 text-neutral-100 text-xs rounded-xl px-3 py-2.5 border border-neutral-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Anthropic">Anthropic</option>
                <option value="OpenAI">OpenAI</option>
                <option value="DeepSeek">DeepSeek</option>
                <option value="Google">Google</option>
                <option value="Meta">Meta</option>
                <option value="Mistral">Mistral</option>
                <option value="Qwen">Qwen</option>
                <option value="Other">Other / Custom</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                Primary Specialty
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full bg-neutral-800 text-neutral-100 text-xs rounded-xl px-3 py-2.5 border border-neutral-700 focus:outline-hidden focus:border-indigo-500"
              >
                <option value="Reasoning">Reasoning & Logic</option>
                <option value="Coding">Coding & Systems</option>
                <option value="General">General Purpose</option>
                <option value="Fast">Fast & Sub-agent</option>
                <option value="Vision">Multimodal & Vision</option>
              </select>
            </div>
          </div>

          {/* Context Window */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              Context Window (Tokens)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1024"
                step="1024"
                value={contextWindow}
                onChange={e => setContextWindow(Number(e.target.value))}
                className="w-full bg-neutral-800 text-neutral-100 text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700 font-mono focus:outline-hidden focus:border-indigo-500"
              />
              <div className="flex gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setContextWindow(128000)}
                  className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  128k
                </button>
                <button
                  type="button"
                  onClick={() => setContextWindow(200000)}
                  className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  200k
                </button>
                <button
                  type="button"
                  onClick={() => setContextWindow(1000000)}
                  className="px-2 py-1 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded border border-neutral-700"
                >
                  1M
                </button>
              </div>
            </div>
          </div>

          {/* System Prompt / Persona */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
              System Prompt & Persona
            </label>
            <textarea
              rows={3}
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="e.g. You are a senior security researcher. Conduct thorough vulnerability audits and point out insecure cryptographic algorithms..."
              className="w-full bg-neutral-800 text-neutral-100 placeholder-neutral-500 text-xs rounded-xl p-3 border border-neutral-700 focus:outline-hidden focus:border-indigo-500 font-mono"
            />
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-neutral-400 uppercase tracking-wider">
                Temperature ({temperature.toFixed(2)})
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
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-neutral-700 text-neutral-300 hover:text-white text-xs font-medium hover:bg-neutral-800 transition-colors min-h-[40px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!modelId.trim() || isSuccess}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium flex items-center gap-2 transition-colors min-h-[40px] cursor-pointer shadow-md"
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Agent Added!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Agent</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
