import React, { useState } from 'react';
import { ChatMessage, extractReasoningThought } from '../utils/chatManager';
import {
  isBigCodeSnippet,
  getFileExtension,
  isLargeCodeFile,
  inferCodeFileName,
  formatBytes,
  getLanguageBadgeColor
} from '../utils/codeUtils';
import { parseMarkdownSections } from '../utils/markdownCodeParser';
import {
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  Sparkles,
  Download,
  Code2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Zap,
  FileCode,
  FileText,
  Image as ImageIcon,
  PanelRight,
  ExternalLink
} from 'lucide-react';

interface ChatMessageViewProps {
  message: ChatMessage;
  agentName?: string;
  provider?: string;
  isStreaming?: boolean;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onSwitchBranch?: (messageId: string, branchIndex: number) => void;
  onActionChipClick?: (prompt: string) => void;
  onOpenCodeSlideWindow?: (payload: { code: string; language: string; fileName: string }) => void;
}

export const ChatMessageView: React.FC<ChatMessageViewProps> = ({
  message,
  agentName,
  provider,
  isStreaming = false,
  onEditMessage,
  onSwitchBranch,
  onActionChipClick,
  onOpenCodeSlideWindow
}) => {
  const [copied, setCopied] = useState(false);
  const [isThoughtOpen, setIsThoughtOpen] = useState(true);

  // Smart Message Collapsing states
  const [isExpanded, setIsExpanded] = useState(false);

  // Conversation Branching Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const { thought, cleanContent } = extractReasoningThought(message.content);

  // Length thresholds for smart message collapsing
  const contentLength = message.content.length;
  const lineCount = message.content.split('\n').length;
  const hasCodeBlocks = cleanContent.includes('```') || cleanContent.includes('~~~');
  const isLengthyUser = message.role === 'user' && (contentLength > 600 || lineCount > 10);
  const isLengthyAssistant =
    message.role === 'assistant' && !isStreaming && !hasCodeBlocks && (contentLength > 1200 || lineCount > 20);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent || message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    if (onEditMessage) {
      onEditMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  // Branch pager info
  const totalBranches = message.branches ? message.branches.length : 1;
  const currentBranchIdx = message.currentBranchIndex ?? 0;

  // -------------------------------------------------------------
  // USER MESSAGE VIEW: Continuous Canvas Layout & In-place Branching
  // -------------------------------------------------------------
  if (message.role === 'user') {
    return (
      <div className="group w-full py-3.5 sm:py-4 px-3 sm:px-6 hover:bg-white/[0.015] transition-colors rounded-xl border border-transparent hover:border-white/[0.04]">
        <div className="max-w-3xl mx-auto flex items-start gap-3 sm:gap-4">
          {/* Minimal Monochromatic Avatar */}
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700/60 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <User className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header: User label & Branch Selector */}
            <div className="flex items-center justify-between mb-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-neutral-200">You</span>
                <span className="text-[11px] text-neutral-500 font-mono">
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                {/* Branch Navigation Pager: < 1 / 3 > */}
                {totalBranches > 1 && onSwitchBranch && (
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-neutral-800/80 border border-white/10 text-[11px] text-neutral-400 font-mono">
                    <button
                      type="button"
                      disabled={currentBranchIdx <= 0}
                      onClick={() => onSwitchBranch(message.id, currentBranchIdx - 1)}
                      className="hover:text-white disabled:opacity-30 p-0.5 cursor-pointer disabled:cursor-not-allowed"
                      title="Previous branch"
                      aria-label="Previous branch"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span>
                      {currentBranchIdx + 1}/{totalBranches}
                    </span>
                    <button
                      type="button"
                      disabled={currentBranchIdx >= totalBranches - 1}
                      onClick={() => onSwitchBranch(message.id, currentBranchIdx + 1)}
                      className="hover:text-white disabled:opacity-30 p-0.5 cursor-pointer disabled:cursor-not-allowed"
                      title="Next branch"
                      aria-label="Next branch"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Edit Message Button for Branching */}
                {!isEditing && onEditMessage && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditContent(message.content);
                      setIsEditing(true);
                    }}
                    className="p-1 rounded-md text-neutral-400 hover:text-indigo-300 hover:bg-neutral-800 transition-colors flex items-center gap-1 text-[11px]"
                    title="Edit message to fork conversation"
                    aria-label="Edit message"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* In-place Message Editor */}
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={Math.min(editContent.split('\n').length + 1, 8)}
                  className="w-full bg-[#181c26] text-neutral-100 text-sm rounded-xl p-3 border border-indigo-500/50 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!editContent.trim()}
                    className="px-3.5 py-1.5 rounded-lg text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium shadow-sm transition-colors cursor-pointer"
                  >
                    Send & Fork
                  </button>
                </div>
              </form>
            ) : (
              /* Message Content with Smart Collapsing */
              <div className="relative">
                {/* Attached Files Gallery */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-2.5">
                    {message.attachments.map(att => (
                      <div
                        key={att.id}
                        onClick={() => {
                          if (!att.isImage && onOpenCodeSlideWindow) {
                            onOpenCodeSlideWindow({
                              code: att.content,
                              language: getFileExtension(att.name.split('.').pop() || 'text'),
                              fileName: att.name
                            });
                          }
                        }}
                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs shadow-xs transition-colors ${
                          !att.isImage && onOpenCodeSlideWindow
                            ? 'bg-[#181d28] border-white/10 hover:border-indigo-500/50 hover:bg-[#1e2433] cursor-pointer'
                            : 'bg-[#181d28] border-white/10'
                        }`}
                        title={!att.isImage ? `Click to inspect ${att.name}` : att.name}
                      >
                        {att.isImage ? (
                          <img src={att.content} alt={att.name} className="w-5 h-5 rounded object-cover" />
                        ) : (
                          <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        )}
                        <span className="font-mono text-[11px] text-neutral-200 truncate max-w-[160px]">
                          {att.name}
                        </span>
                        <span className="font-mono text-[10px] text-neutral-500 shrink-0">
                          {formatBytes(att.size)}
                        </span>
                        {!att.isImage && onOpenCodeSlideWindow && (
                          <PanelRight className="w-3 h-3 text-indigo-400 opacity-60 ml-0.5 shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-sm sm:text-[15px] leading-relaxed text-neutral-100 whitespace-pre-wrap transition-all duration-300 select-text ${
                    isLengthyUser && !isExpanded ? 'max-h-28 overflow-hidden' : 'max-h-none'
                  }`}
                >
                  {message.content}
                </div>

                {/* Soft Gradient Fade & Expand Pill for lengthy user prompts */}
                {isLengthyUser && !isExpanded && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0f1218] via-[#0f1218]/80 to-transparent flex items-end justify-center pb-0.5">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(true)}
                      className="px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-indigo-300 hover:text-indigo-200 border border-neutral-700 text-xs font-medium flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                      aria-label="Expand lengthy prompt"
                    >
                      <span>Show more ({contentLength} chars)</span>
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {isLengthyUser && isExpanded && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 py-0.5 px-1.5 rounded hover:bg-neutral-800 transition-colors"
                      aria-label="Collapse prompt"
                    >
                      <span>Show less</span>
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ASSISTANT MESSAGE VIEW: Document Layout, Rich Code, Action Chips
  // -------------------------------------------------------------
  return (
    <div className="group w-full py-4 sm:py-5 px-3 sm:px-6 bg-[#161a23]/30 hover:bg-[#161a23]/60 transition-colors rounded-xl border border-white/[0.03]">
      <div className="max-w-3xl mx-auto flex items-start gap-3 sm:gap-4">
        {/* Agent Avatar with Subtle Glow */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <Bot className="w-4 h-4" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
            <div className="flex items-center gap-2 truncate">
              <span className="font-semibold text-xs sm:text-sm text-neutral-100 truncate">
                {agentName || 'AI Agent'}
              </span>
              {provider && (
                <span className="text-[11px] text-neutral-400 hidden sm:inline">
                  · {provider}
                </span>
              )}
              {isStreaming && (
                <span className="inline-flex items-center gap-1 text-[10px] text-indigo-400 font-medium px-1.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-900/40 animate-pulse">
                  <Zap className="w-2.5 h-2.5" />
                  Streaming
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-neutral-400 hover:text-neutral-200 transition-colors p-1.5 rounded-md hover:bg-white/5 text-xs flex items-center gap-1 min-h-[30px]"
                title="Copy answer"
                aria-label="Copy answer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Chain of Thought / Reasoning Block */}
          {(thought || message.thought) && (
            <div className="mb-3.5 rounded-xl border border-amber-900/40 bg-amber-950/20 overflow-hidden">
              <button
                onClick={() => setIsThoughtOpen(!isThoughtOpen)}
                className="w-full px-3.5 py-2 flex items-center justify-between text-xs text-amber-300/80 font-medium hover:bg-amber-900/10 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Chain of Thought Reasoning</span>
                </div>
                {isThoughtOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {isThoughtOpen && (
                <div className="px-4 py-3 text-xs font-mono text-neutral-300 whitespace-pre-wrap border-t border-amber-900/30 bg-black/25 leading-relaxed max-h-56 overflow-y-auto">
                  {thought || message.thought}
                </div>
              )}
            </div>
          )}

          {/* SKELETON LOADING INDICATOR (when streaming first tokens) */}
          {isStreaming && !cleanContent.trim() && (
            <div className="space-y-2.5 py-2 animate-pulse">
              <div className="h-3.5 bg-gradient-to-r from-neutral-800 via-neutral-700/50 to-neutral-800 rounded-md w-3/4" />
              <div className="h-3.5 bg-gradient-to-r from-neutral-800 via-neutral-700/50 to-neutral-800 rounded-md w-full" />
              <div className="h-3.5 bg-gradient-to-r from-neutral-800 via-neutral-700/50 to-neutral-800 rounded-md w-5/6" />
            </div>
          )}

          {/* Content Body with Smart Collapsing for Verbose Responses */}
          <div className="relative">
            <div
              className={`text-sm sm:text-[15px] leading-relaxed text-neutral-200 space-y-3 font-normal transition-all duration-300 ${
                isLengthyAssistant && !isExpanded ? 'max-h-96 overflow-hidden' : 'max-h-none'
              }`}
            >
              <RenderMarkdown content={cleanContent} onOpenCodeSlideWindow={onOpenCodeSlideWindow} />
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse align-middle ml-1" />
              )}
            </div>

            {/* Smart Message Collapsing: Bottom Gradient Overlay & Expand Button */}
            {isLengthyAssistant && !isExpanded && (
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#12151c] via-[#12151c]/90 to-transparent flex items-end justify-center pb-2 pt-10 pointer-events-none">
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="pointer-events-auto px-4 py-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white font-sans text-xs font-medium flex items-center gap-1.5 shadow-lg border border-indigo-400/30 transition-all cursor-pointer transform active:scale-95"
                  aria-label="Expand full response"
                >
                  <span>Show full response ({lineCount} lines)</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isLengthyAssistant && isExpanded && (
              <div className="mt-3 pt-2 border-t border-white/5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-white/5 transition-colors"
                  aria-label="Collapse response"
                >
                  <span>Collapse response</span>
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* CONTEXTUAL ACTION CHIPS (Interactive follow-up suggestions) */}
          {!isStreaming && cleanContent.trim().length > 0 && onActionChipClick && (
            <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-neutral-500 font-medium mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                Suggestions:
              </span>
              {[
                'Explain in simpler terms',
                'Add unit tests',
                'Optimize performance',
                'Show edge cases & error handling',
                'Add TypeScript types'
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => onActionChipClick(chip)}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-indigo-950/40 border border-white/10 hover:border-indigo-500/40 text-[11px] text-neutral-300 hover:text-indigo-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>{chip}</span>
                  <span className="text-indigo-400 opacity-60">→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Rich Markdown renderer with Mini Code Window and Large File Artifact Cards
 */
function RenderMarkdown({
  content,
  onOpenCodeSlideWindow
}: {
  content: string;
  onOpenCodeSlideWindow?: (payload: { code: string; language: string; fileName: string }) => void;
}) {
  if (!content) return null;

  const sections = parseMarkdownSections(content);

  return (
    <>
      {sections.map((sec, index) => {
        if (sec.type === 'code') {
          const codeBody = sec.code;
          const language = sec.language || 'text';
          const isLarge = isLargeCodeFile(codeBody);
          const fileName = inferCodeFileName(codeBody, language, index + 1);

          if (isLarge) {
            return (
              <LargeCodeFileCard
                key={index}
                code={codeBody}
                language={language}
                fileName={fileName}
                onOpenSlide={() => onOpenCodeSlideWindow?.({ code: codeBody, language, fileName })}
              />
            );
          }

          return (
            <MiniCodeWindow
              key={index}
              code={codeBody}
              language={language}
              fileName={fileName}
              onOpenSlide={() => onOpenCodeSlideWindow?.({ code: codeBody, language, fileName })}
            />
          );
        }

        return <TextFormattedSection key={index} text={sec.text} />;
      })}
    </>
  );
}

/**
 * Large Code File Artifact Card: compact card with file name, extension, line count, and slide window trigger
 */
interface LargeCodeFileCardProps {
  code: string;
  language: string;
  fileName: string;
  onOpenSlide: () => void;
}

function LargeCodeFileCard({ code, language, fileName, onOpenSlide }: LargeCodeFileCardProps) {
  const [copied, setCopied] = useState(false);
  const codeLines = code.split('\n');
  const lineCount = codeLines.length;
  const byteSize = new Blob([code]).size;
  const badgeColor = getLanguageBadgeColor(language);
  const previewLines = codeLines.slice(0, 4);

  const copyCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const ext = getFileExtension(language);
    const downloadName = fileName.includes('.') ? fileName : `${fileName}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onOpenSlide}
      className="my-3.5 rounded-xl border border-white/10 hover:border-indigo-500/50 bg-[#0d1017] hover:bg-[#10141f] transition-all shadow-lg overflow-hidden group cursor-pointer"
    >
      {/* File Card Header */}
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 bg-[#141822] border-b border-white/5">
        <div className="flex items-center gap-2.5 truncate mr-2">
          <div className={`w-7 h-7 rounded-lg ${badgeColor.bg} ${badgeColor.text} border ${badgeColor.border} flex items-center justify-center shrink-0`}>
            <FileCode className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs sm:text-sm font-semibold text-white tracking-tight group-hover:text-indigo-300 transition-colors">
                {fileName}
              </span>
              <span className={`text-[10px] uppercase font-semibold font-mono px-1.5 py-0.5 rounded border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border}`}>
                {language || getFileExtension(language)}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span>{lineCount} lines</span>
              <span>·</span>
              <span>{formatBytes(byteSize)}</span>
              <span className="hidden sm:inline">·</span>
              <span className="text-indigo-400 font-sans hidden sm:inline group-hover:underline">Click to view in slide window</span>
            </div>
          </div>
        </div>

        {/* Card Header Actions */}
        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={downloadFile}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:flex items-center cursor-pointer"
            title="Download file"
            aria-label={`Download ${fileName}`}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={copyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-colors text-xs cursor-pointer"
            aria-label={`Copy ${fileName}`}
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-sans text-[11px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="font-sans text-[11px]">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Mini Preview with Preserved Indentation */}
      <div className="relative font-mono text-xs bg-[#090c12] p-3 overflow-x-auto" style={{ whiteSpace: 'pre', tabSize: 4 }}>
        {previewLines.map((line, idx) => (
          <div
            key={idx}
            className="flex items-start min-h-[1.3rem] leading-5 font-mono text-xs"
            style={{ whiteSpace: 'pre', tabSize: 4 }}
          >
            <div className="select-none pr-3 text-right text-neutral-600 font-mono text-[11px] border-r border-white/5 shrink-0 w-8">
              {idx + 1}
            </div>
            <div
              className="pl-3 font-mono text-xs text-neutral-300"
              style={{ whiteSpace: 'pre', tabSize: 4 }}
            >
              {highlightSyntaxTokens(line, language)}
            </div>
          </div>
        ))}

        {/* Action Bar Footer */}
        <div className="mt-2.5 -mx-3 -mb-3 px-3.5 py-2 bg-gradient-to-r from-[#141824]/90 to-[#10141f]/90 border-t border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-indigo-400" />
            Large code file ({lineCount} lines)
          </span>
          <button
            type="button"
            onClick={onOpenSlide}
            className="px-3 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition-all group-hover:scale-105 cursor-pointer"
          >
            <span>Open in Slide Window</span>
            <PanelRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Direct Mini Code Window: renders code in an authentic code editor container with macOS chrome
 */
interface MiniCodeWindowProps {
  code: string;
  language: string;
  fileName: string;
  onOpenSlide?: () => void;
}

function MiniCodeWindow({ code, language, fileName, onOpenSlide }: MiniCodeWindowProps) {
  const [copied, setCopied] = useState(false);
  const codeLines = code.split('\n');
  const lineCount = codeLines.length;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSnippet = () => {
    const ext = getFileExtension(language);
    const downloadName = fileName.includes('.') ? fileName : `${fileName}.${ext}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-white/10 bg-[#0d1017] font-mono text-xs shadow-xl">
      {/* Mini Window Chrome Header with macOS Dots & File Info */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141822] border-b border-white/5 text-xs text-neutral-400 select-none">
        <div className="flex items-center gap-2.5 truncate mr-2">
          {/* macOS subtle window dots */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/40 border border-rose-500/60 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/60 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/40 border border-emerald-500/60 inline-block" />
          </div>

          <span className="font-semibold text-neutral-200 text-xs font-mono truncate">
            {fileName}
          </span>

          <span className="font-semibold text-indigo-400 uppercase tracking-wider text-[10px] px-1.5 py-0.5 rounded bg-indigo-950/50 border border-indigo-500/30">
            {language || 'code'}
          </span>
          <span className="text-[11px] text-neutral-500 tabular-nums hidden sm:inline">
            ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onOpenSlide && (
            <button
              onClick={onOpenSlide}
              className="p-1 text-neutral-400 hover:text-indigo-300 rounded hover:bg-white/5 transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
              title="Open in Slide Window"
              aria-label="Open code in slide window"
            >
              <PanelRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-sans">Slide</span>
            </button>
          )}

          <button
            onClick={downloadSnippet}
            className="p-1 text-neutral-400 hover:text-neutral-200 rounded hover:bg-white/5 transition-colors hidden sm:flex items-center cursor-pointer"
            title="Download snippet"
            aria-label="Download snippet"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded hover:bg-white/5 text-neutral-300 hover:text-white transition-colors text-[11px] cursor-pointer"
            aria-label="Copy code snippet"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-sans">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="font-sans">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Editor Body: Line-by-Line with Strict Python Indentation & Gutter */}
      <div className="overflow-x-auto bg-[#0a0d14] p-3 sm:p-4 select-text font-mono text-xs">
        {codeLines.map((line, idx) => (
          <div
            key={idx}
            className="flex items-start min-h-[1.35rem] leading-5 hover:bg-white/[0.04] transition-colors rounded-xs group/line"
            style={{ whiteSpace: 'pre', tabSize: 4 }}
          >
            {/* Gutter Line Number */}
            <div className="select-none pr-3 sm:pr-4 text-right text-neutral-600 font-mono text-[11px] border-r border-white/5 shrink-0 w-9 sm:w-11 group-hover/line:text-neutral-400 transition-colors">
              {idx + 1}
            </div>

            {/* Code Content */}
            <div
              className="pl-3 sm:pl-4 font-mono text-xs text-neutral-200"
              style={{ whiteSpace: 'pre', tabSize: 4 }}
            >
              {highlightSyntaxTokens(line, language)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Syntax token highlighter with complete Python support and strict indentation preservation
 */
function highlightSyntaxTokens(line: string, _language: string): React.ReactNode {
  if (!line || line.length === 0) {
    return <span style={{ whiteSpace: 'pre' }}>{'\u00A0'}</span>;
  }

  // Preserve lines that are only whitespace (e.g. empty lines with indent in Python)
  if (/^\s+$/.test(line)) {
    return <span style={{ whiteSpace: 'pre' }}>{line}</span>;
  }

  // Comment line with preserved indentation
  const commentMatch = line.match(/^(\s*)(#|\/\/|--|\/\*)(.*)$/);
  if (commentMatch) {
    const [, indent, prefix, commentBody] = commentMatch;
    return (
      <span style={{ whiteSpace: 'pre' }}>
        <span>{indent}</span>
        <span className="text-neutral-500 italic">{prefix}{commentBody}</span>
      </span>
    );
  }

  // Tokenize keywords, strings, builtins, decorators, numbers
  const tokenRegex = /(\b(?:def|class|return|yield|import|from|as|if|elif|else|while|for|in|is|not|and|or|try|except|finally|raise|with|pass|break|continue|lambda|global|nonlocal|assert|del|async|await|const|let|var|function|type|interface|extends|implements|new|this|typeof|instanceof|switch|case|default)\b|(?:\b(?:self|cls|True|False|None|true|false|null|undefined)\b)|(?:\b(?:print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool|super|isinstance|open|sum|min|max|abs|round|sorted|any|all)\b)|(?:@(?:[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*))|(?:"{3}[\s\S]*?"{3}|'{3}[\s\S]*?'{3}|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(?:\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|0x[0-9a-fA-F]+|0b[01]+))/g;

  const parts = line.split(tokenRegex);

  return (
    <span style={{ whiteSpace: 'pre', tabSize: 4 }}>
      {parts.map((part, i) => {
        if (!part) return null;

        // Strings
        if (
          (part.startsWith('"') && part.endsWith('"')) ||
          (part.startsWith("'") && part.endsWith("'")) ||
          (part.startsWith('`') && part.endsWith('`'))
        ) {
          return <span key={i} className="text-emerald-300/90">{part}</span>;
        }

        // Keywords
        if (/^(?:def|class|return|yield|import|from|as|if|elif|else|while|for|in|is|not|and|or|try|except|finally|raise|with|pass|break|continue|lambda|global|nonlocal|assert|del|async|await|const|let|var|function|type|interface|extends|implements|new|this|typeof|instanceof|switch|case|default)$/.test(part)) {
          return <span key={i} className="text-indigo-400 font-semibold">{part}</span>;
        }

        // Builtins
        if (/^(?:print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool|super|isinstance|open|sum|min|max|abs|round|sorted|any|all)$/.test(part)) {
          return <span key={i} className="text-sky-300 font-medium">{part}</span>;
        }

        // Decorators
        if (part.startsWith('@')) {
          return <span key={i} className="text-pink-400">{part}</span>;
        }

        // Booleans & Constants
        if (/^(?:True|False|None|self|cls|true|false|null|undefined)$/.test(part)) {
          return <span key={i} className="text-amber-300 font-medium">{part}</span>;
        }

        // Numbers
        if (/^\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(part) || /^0x[0-9a-fA-F]+$/.test(part) || /^0b[01]+$/.test(part)) {
          return <span key={i} className="text-purple-300">{part}</span>;
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

function TextFormattedSection({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-base font-semibold text-white mt-4 mb-2 font-display">
              {trimmed.slice(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-lg font-semibold text-white mt-5 mb-2 font-display">
              {trimmed.slice(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={pIdx} className="text-xl font-bold text-white mt-6 mb-3 font-display">
              {trimmed.slice(2)}
            </h1>
          );
        }
        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={pIdx} className="pl-3 border-l-2 border-indigo-500/50 text-neutral-300 italic my-2">
              {trimmed.slice(2)}
            </blockquote>
          );
        }

        // List items
        const lines = trimmed.split('\n');
        const isList = lines.every(l => /^(\*|-|\d+\.)\s/.test(l.trim()));

        if (isList) {
          return (
            <ul key={pIdx} className="space-y-1.5 my-2 pl-4 list-disc text-neutral-300">
              {lines.map((l, lIdx) => (
                <li key={lIdx}>
                  {formatInline(l.replace(/^(\*|-|\d+\.)\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={pIdx} className="my-1.5 leading-relaxed text-neutral-300">
            {lines.map((l, lIdx) => (
              <React.Fragment key={lIdx}>
                {formatInline(l)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

function formatInline(str: string): React.ReactNode {
  const boldParts = str.split(/(\*\*.*?\*\*)/g);

  return boldParts.map((bPart, bIdx) => {
    if (bPart.startsWith('**') && bPart.endsWith('**')) {
      return (
        <strong key={bIdx} className="font-semibold text-neutral-100">
          {formatCodeInline(bPart.slice(2, -2))}
        </strong>
      );
    }
    return <React.Fragment key={bIdx}>{formatCodeInline(bPart)}</React.Fragment>;
  });
}

function formatCodeInline(str: string): React.ReactNode {
  const codeParts = str.split(/(`.*?`)/g);

  return codeParts.map((cPart, cIdx) => {
    if (cPart.startsWith('`') && cPart.endsWith('`')) {
      return (
        <code key={cIdx} className="px-1.5 py-0.5 rounded bg-white/10 text-indigo-300 font-mono text-xs border border-white/10">
          {cPart.slice(1, -1)}
        </code>
      );
    }
    return cPart;
  });
}
