import React, { useRef, useEffect } from 'react';
import { Send, Square, Bot, Sliders } from 'lucide-react';
import { estimateTokenCount } from '../utils/modelParser';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStop: () => void;
  activeModelName: string;
  provider: string;
  onOpenConfig: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isStreaming,
  onStop,
  activeModelName,
  provider,
  onOpenConfig
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) {
        onSend();
      }
    }
  };

  const estimatedTokens = estimateTokenCount(input);

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-4 pb-2 sm:pb-4 shrink-0">
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 shadow-lg p-2 sm:p-2.5 focus-within:border-neutral-700 transition-colors">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between px-2 py-1 text-xs text-neutral-400 border-b border-neutral-800/60 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5 truncate mr-2">
            <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="text-neutral-300 font-medium truncate text-xs">
              {activeModelName}
            </span>
            <span className="text-neutral-500 font-mono text-[11px] hidden sm:inline">
              ({provider})
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {input.trim() && (
              <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                ~{estimatedTokens} tok
              </span>
            )}
            <button
              onClick={onOpenConfig}
              className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[11px] min-h-[32px]"
              title="Tune parameters"
              aria-label="Open model parameters"
            >
              <Sliders className="w-3 h-3 text-neutral-400" />
              <span>Params</span>
            </button>
          </div>
        </div>

        {/* Text Area & Action Button */}
        <div className="flex items-end gap-2 px-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask ${activeModelName.split(' ')[0]}...`}
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-base sm:text-sm resize-none focus:outline-hidden py-1 leading-relaxed max-h-40"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm min-w-[40px] min-h-[40px]"
              title="Stop response generation"
              aria-label="Stop generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!input.trim()}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-800 disabled:text-neutral-600 text-white flex items-center justify-center shrink-0 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed min-w-[40px] min-h-[40px]"
              title="Send message"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
