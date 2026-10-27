/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { Send, Square, Bot, Sliders, Sparkles, Paperclip, X, FileCode, FileText, Image as ImageIcon } from 'lucide-react';
import { estimateTokenCount } from '../utils/modelParser';
import { CustomPersonality, AttachedFile } from '../utils/chatManager';
import { formatBytes } from '../utils/codeUtils';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStop: () => void;
  activeModelName: string;
  provider: string;
  onOpenConfig: () => void;
  onOpenPersonality?: () => void;
  activePersonality?: CustomPersonality;
  hasCustomInstructions?: boolean;
  attachedFiles?: AttachedFile[];
  onAddFiles?: (files: AttachedFile[]) => void;
  onRemoveFile?: (fileId: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  setInput,
  onSend,
  isStreaming,
  onStop,
  activeModelName,
  provider,
  onOpenConfig,
  onOpenPersonality,
  activePersonality,
  hasCustomInstructions,
  attachedFiles = [],
  onAddFiles,
  onRemoveFile
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachedFiles.length > 0)) {
        onSend();
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && onAddFiles) {
      await processSelectedFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processSelectedFiles = async (fileList: FileList) => {
    if (!onAddFiles) return;
    const filesToLoad: AttachedFile[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isImg = file.type.startsWith('image/');

      try {
        if (isImg) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          filesToLoad.push({
            id: `att_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: file.size,
            type: file.type || 'image',
            content: dataUrl,
            isImage: true
          });
        } else {
          const text = await file.text();
          filesToLoad.push({
            id: `att_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
            name: file.name,
            size: file.size,
            type: file.type || 'text/plain',
            content: text,
            isImage: false
          });
        }
      } catch (err) {
        console.error('Error reading attached file:', file.name, err);
      }
    }

    if (filesToLoad.length > 0) {
      onAddFiles(filesToLoad);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processSelectedFiles(e.dataTransfer.files);
    }
  };

  const estimatedTokens = estimateTokenCount(input);
  const canSubmit = input.trim().length > 0 || attachedFiles.length > 0;

  return (
    <div className="w-full max-w-3xl mx-auto px-3 sm:px-4 pb-3 sm:pb-5 shrink-0 z-20">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        aria-label="Upload files to chat"
      />

      {/* Floating Pill Container with Frosted Glassmorphism & Drag-and-drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`bg-[#161a25]/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border shadow-2xl p-2 sm:p-3 transition-all ${
          isDragging
            ? 'border-indigo-400 ring-2 ring-indigo-500/50 bg-[#1e2333]/95'
            : 'border-white/10 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/30'
        }`}
      >
        {/* Top Mini HUD Bar */}
        <div className="flex items-center justify-between px-2 py-1 text-xs text-neutral-400 border-b border-white/5 pb-1.5 mb-1.5">
          <div className="flex items-center gap-2 truncate mr-2">
            <div className="flex items-center gap-1.5 truncate">
              <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-neutral-200 font-medium truncate text-xs">
                {activeModelName}
              </span>
              <span className="text-neutral-500 font-mono text-[11px] hidden sm:inline">
                ({provider})
              </span>
            </div>

            {/* Active Personality Indicator */}
            {(activePersonality || hasCustomInstructions) && onOpenPersonality && (
              <button
                type="button"
                onClick={onOpenPersonality}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-[10px] text-indigo-300 hover:text-white transition-colors cursor-pointer"
                title="Edit active character personality"
              >
                <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                <span className="truncate max-w-[120px]">
                  {activePersonality?.name || 'Custom Persona'}
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {input.trim() && (
              <span className="text-[11px] font-mono text-neutral-500 tabular-nums">
                ~{estimatedTokens} tok
              </span>
            )}

            {onOpenPersonality && (
              <button
                type="button"
                onClick={onOpenPersonality}
                className="text-neutral-400 hover:text-indigo-300 p-1 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 text-[11px]"
                title="Customize AI character & instructions"
                aria-label="Customize AI character"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span className="hidden sm:inline">Persona</span>
              </button>
            )}

            <button
              onClick={onOpenConfig}
              className="text-neutral-400 hover:text-neutral-200 p-1 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 text-[11px]"
              title="Tune parameters"
              aria-label="Open model parameters"
            >
              <Sliders className="w-3 h-3 text-neutral-400" />
              <span>Params</span>
            </button>
          </div>
        </div>

        {/* Attached Files Preview Pills */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 px-1 pb-2 pt-0.5 border-b border-white/5 mb-1.5">
            {attachedFiles.map(file => (
              <div
                key={file.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#202636] border border-white/10 text-xs text-neutral-200 max-w-[220px] group/file shadow-xs"
              >
                {file.isImage ? (
                  <img
                    src={file.content}
                    alt={file.name}
                    className="w-4 h-4 rounded object-cover shrink-0"
                  />
                ) : file.name.endsWith('.ts') || file.name.endsWith('.js') || file.name.endsWith('.py') ? (
                  <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}

                <span className="truncate font-mono text-[11px] flex-1">
                  {file.name}
                </span>

                <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                  {formatBytes(file.size)}
                </span>

                {onRemoveFile && (
                  <button
                    type="button"
                    onClick={() => onRemoveFile(file.id)}
                    className="text-neutral-500 hover:text-red-400 transition-colors p-0.5 rounded hover:bg-white/5 cursor-pointer ml-0.5"
                    aria-label={`Remove file ${file.name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Text Area & Floating Action Buttons */}
        <div className="flex items-end gap-2 px-1">
          {/* File Attachment Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl text-neutral-400 hover:text-indigo-300 hover:bg-white/5 transition-colors flex items-center justify-center shrink-0 cursor-pointer min-h-[38px] min-w-[38px]"
            title="Attach code or data files (or drag & drop)"
            aria-label="Attach files to message"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              attachedFiles.length > 0
                ? `Ask ${activeModelName.split(' ')[0]} about these ${attachedFiles.length} file${attachedFiles.length === 1 ? '' : 's'}...`
                : `Ask ${activeModelName.split(' ')[0]} or write code (Shift+Enter for newline)...`
            }
            className="w-full bg-transparent text-neutral-100 placeholder-neutral-500 text-sm sm:text-[15px] resize-none focus:outline-hidden py-1.5 leading-relaxed max-h-40 font-sans"
          />

          {/* Prominent Stop or Send Button */}
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shrink-0 transition-all shadow-md shadow-rose-600/30 min-w-[40px] min-h-[40px] cursor-pointer animate-pulse"
              title="Stop response generation"
              aria-label="Stop generation"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSubmit}
              className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-white/5 disabled:text-neutral-600 text-white flex items-center justify-center shrink-0 transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed min-w-[40px] min-h-[40px] active:scale-95"
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
