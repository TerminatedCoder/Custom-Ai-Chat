/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CustomPersonality, PERSONALITY_PRESETS } from '../utils/chatManager';
import { X, Sparkles, Check, Layers, HelpCircle, Shield, Users, Zap, BookOpen, RotateCcw } from 'lucide-react';

interface CustomPersonalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePersonalityId?: string;
  customInstructions?: string;
  onSavePersonality: (preset?: CustomPersonality, customText?: string) => void;
  onClearPersonality: () => void;
}

export const CustomPersonalityModal: React.FC<CustomPersonalityModalProps> = ({
  isOpen,
  onClose,
  activePersonalityId,
  customInstructions = '',
  onSavePersonality,
  onClearPersonality
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(activePersonalityId || '');
  const [customText, setCustomText] = useState<string>(customInstructions);

  if (!isOpen) return null;

  const handleSelectPreset = (id: string) => {
    if (selectedPresetId === id) {
      setSelectedPresetId('');
    } else {
      setSelectedPresetId(id);
      const found = PERSONALITY_PRESETS.find(p => p.id === id);
      if (found && !customText.trim()) {
        // optionally suggest or leave customText for specific overrides
      }
    }
  };

  const handleApply = () => {
    const preset = PERSONALITY_PRESETS.find(p => p.id === selectedPresetId);
    onSavePersonality(preset, customText.trim());
    onClose();
  };

  const handleClear = () => {
    setSelectedPresetId('');
    setCustomText('');
    onClearPersonality();
    onClose();
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Layers':
        return <Layers className="w-4 h-4" />;
      case 'HelpCircle':
        return <HelpCircle className="w-4 h-4" />;
      case 'Shield':
        return <Shield className="w-4 h-4" />;
      case 'Users':
        return <Users className="w-4 h-4" />;
      case 'Zap':
        return <Zap className="w-4 h-4" />;
      case 'BookOpen':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-md transition-opacity">
      <div className="bg-[#141822]/95 border-t sm:border border-white/10 rounded-t-3xl sm:rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden backdrop-blur-xl">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-neutral-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base font-display">
                AI Character & Custom Personality
              </h3>
              <p className="text-[11px] text-neutral-400">
                Overlay custom instructions or role presets onto your active agent
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-xs text-neutral-300">
          {/* Preset Persona Selection */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
                Specialized Role Presets
              </span>
              <span className="text-[11px] text-neutral-500">
                Click to toggle
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PERSONALITY_PRESETS.map(preset => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${isSelected ? 'bg-indigo-600/30 text-indigo-300' : 'bg-neutral-800/80 text-neutral-400'}`}>
                          {getPresetIcon(preset.icon)}
                        </span>
                        <span className="font-semibold text-neutral-100 text-xs">
                          {preset.name}
                        </span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isSelected ? 'bg-indigo-500/30 text-indigo-200' : 'bg-neutral-800 text-neutral-400'
                      }`}>
                        {preset.badge}
                      </span>
                    </div>

                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {preset.tagline}
                    </p>

                    {isSelected && (
                      <div className="absolute right-2 bottom-2 text-indigo-400">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom System Instructions */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-neutral-200 uppercase tracking-wider text-[11px]">
                Custom System Instructions
              </label>
              <span className="text-[11px] text-neutral-500">
                Appended to system prompt
              </span>
            </div>
            <textarea
              rows={4}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              placeholder="e.g. Always respond concisely in TypeScript. Never use emojis. Enforce zero memory leaks and modular interfaces..."
              className="w-full bg-[#181c26] text-neutral-100 placeholder-neutral-500 text-xs rounded-xl p-3 border border-white/10 focus:outline-hidden focus:border-indigo-500 leading-relaxed font-sans"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              These guidelines will be applied to every message sent in this session.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="text-neutral-400 hover:text-rose-300 text-xs font-medium flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-rose-950/20 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Personality</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
