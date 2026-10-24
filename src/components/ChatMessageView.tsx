import React, { useState } from 'react';
import { ChatMessage, extractReasoningThought } from '../utils/chatManager';
import { isBigCodeSnippet, isBigTextMessage, getFileExtension } from '../utils/codeUtils';
import { Copy, Check, ChevronDown, ChevronUp, Bot, User, Sparkles, Download, Code2 } from 'lucide-react';

interface ChatMessageViewProps {
  message: ChatMessage;
  agentName?: string;
  provider?: string;
  isStreaming?: boolean;
}

export const ChatMessageView: React.FC<ChatMessageViewProps> = ({
  message,
  agentName,
  provider,
  isStreaming
}) => {
  const [copied, setCopied] = useState(false);
  const [isThoughtOpen, setIsThoughtOpen] = useState(true);
  const [isUserExpanded, setIsUserExpanded] = useState(false);

  const { thought, cleanContent } = extractReasoningThought(message.content);
  const isBigUser = message.role === 'user' && isBigTextMessage(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanContent || message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (message.role === 'user') {
    return (
      <div className="flex justify-end my-3 sm:my-4">
        <div className="max-w-xl sm:max-w-2xl bg-neutral-800 text-neutral-100 rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 shadow-sm border border-neutral-700/60 relative overflow-hidden">
          <div className="text-xs text-neutral-400 mb-1 flex items-center justify-between gap-2 font-medium">
            <span className="text-[11px] text-neutral-500 font-mono">
              {message.content.length} chars
            </span>
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>You</span>
            </div>
          </div>

          {/* User message content with collapsible preview if large */}
          <div
            className={`whitespace-pre-wrap text-sm sm:text-[15px] leading-relaxed select-text transition-all duration-200 ${
              isBigUser && !isUserExpanded ? 'max-h-24 overflow-hidden relative' : 'max-h-none'
            }`}
          >
            {message.content}

            {/* Gradient overlay when collapsed */}
            {isBigUser && !isUserExpanded && (
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-neutral-800 to-transparent pointer-events-none" />
            )}
          </div>

          {/* Expand / Collapse Toggle for Big User Message */}
          {isBigUser && (
            <div className="mt-2 pt-1 border-t border-neutral-700/50 flex justify-end">
              <button
                type="button"
                onClick={() => setIsUserExpanded(!isUserExpanded)}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 py-1 px-1.5 rounded transition-colors"
                aria-label={isUserExpanded ? 'Collapse user message' : 'Show full user message'}
              >
                <span>{isUserExpanded ? 'Show less' : 'Show full message'}</span>
                {isUserExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start my-4 sm:my-6 group">
      <div className="max-w-3xl w-full bg-neutral-900/90 text-neutral-100 rounded-2xl p-4 sm:p-6 border border-neutral-800 shadow-sm relative">
        {/* Agent Header */}
        <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm text-neutral-100 truncate">
                  {agentName || 'AI Agent'}
                </span>
                {provider && (
                  <span className="text-[11px] sm:text-xs text-neutral-400">
                    · {provider}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="text-neutral-400 hover:text-neutral-200 transition-colors p-1.5 rounded-md hover:bg-neutral-800 text-xs flex items-center gap-1 min-h-[32px]"
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
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Chain of Thought / Reasoning Block */}
        {(thought || message.thought) && (
          <div className="mb-4 rounded-xl border border-amber-900/30 bg-amber-950/20 overflow-hidden">
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
              <div className="px-4 py-3 text-xs font-mono text-neutral-300/90 whitespace-pre-wrap border-t border-amber-900/20 bg-black/20 leading-relaxed max-h-60 overflow-y-auto">
                {thought || message.thought}
              </div>
            )}
          </div>
        )}

        {/* Markdown & Code Body (Full text, with smart shrinking code windows) */}
        <div className="text-sm sm:text-[15px] leading-relaxed text-neutral-200 space-y-3 font-normal">
          <RenderMarkdown content={cleanContent} />
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-indigo-500 animate-pulse align-middle ml-1" />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Clean lightweight Markdown renderer with enhanced code window collapse/expansion
 */
function RenderMarkdown({ content }: { content: string }) {
  if (!content) return null;

  // Split into code blocks vs text blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const language = /^[a-zA-Z0-9_-]+$/.test(firstLine) ? firstLine : '';
          const codeBody = language ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <CodeBlockView key={index} code={codeBody} language={language} />
          );
        }

        return <TextFormattedSection key={index} text={part} />;
      })}
    </>
  );
}

/**
 * Enhanced CodeBlockView: Shrinks large code response with drop-down arrow to show full code
 */
function CodeBlockView({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const isBig = isBigCodeSnippet(code);
  const [isExpanded, setIsExpanded] = useState(!isBig);

  const codeLines = code.split('\n');
  const lineCount = codeLines.length;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadSnippet = () => {
    const ext = getFileExtension(language);
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `snippet_${Date.now()}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-neutral-800 bg-[#0d1117] font-mono text-xs shadow-sm">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2 bg-[#161b22] border-b border-neutral-800 text-xs text-neutral-400">
        <div className="flex items-center gap-2 truncate mr-2">
          <Code2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-medium text-neutral-200">
            {language || 'code'}
          </span>
          <span className="text-[11px] text-neutral-500 tabular-nums">
            ({lineCount} {lineCount === 1 ? 'line' : 'lines'})
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Drop-down arrow toggle in header for big code */}
          {isBig && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-indigo-300 hover:text-white transition-colors text-[11px] font-sans"
              title={isExpanded ? 'Shrink code window' : 'Expand full code'}
              aria-label={isExpanded ? 'Collapse code snippet' : 'Expand full code snippet'}
            >
              <span>{isExpanded ? 'Collapse' : 'Full code'}</span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <button
            onClick={downloadSnippet}
            className="p-1 hover:text-neutral-200 text-neutral-400 rounded transition-colors hidden sm:flex items-center"
            title="Download file snippet"
            aria-label="Download snippet"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={copyCode}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors text-[11px]"
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

      {/* Code Editor Body with Line Numbers & Collapsible Window */}
      <div className="relative">
        <div
          className={`overflow-x-auto transition-all duration-300 ${
            isBig && !isExpanded ? 'max-h-52 overflow-hidden' : 'max-h-none'
          }`}
        >
          <pre className="p-3 sm:p-4 text-neutral-200 leading-relaxed flex text-xs">
            {/* Line numbers gutter */}
            <div className="select-none pr-3 sm:pr-4 text-right text-neutral-600 font-mono text-[11px] border-r border-neutral-800 shrink-0">
              {codeLines.map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code content */}
            <code className="pl-3 sm:pl-4 overflow-x-auto whitespace-pre font-mono">
              {code}
            </code>
          </pre>
        </div>

        {/* Bottom Gradient Fade & Central Drop-down Arrow when Shrunk */}
        {isBig && !isExpanded && (
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/80 to-transparent flex items-end justify-center pb-2.5 pt-6">
            <button
              onClick={() => setIsExpanded(true)}
              className="px-4 py-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white font-sans text-xs font-medium flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all transform active:scale-95 cursor-pointer border border-indigo-400/30"
              aria-label={`Expand full code (${lineCount} lines)`}
            >
              <span>Show full code ({lineCount} lines)</span>
              <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer bar when expanded to easily collapse without scrolling to top */}
      {isBig && isExpanded && (
        <div className="px-4 py-1.5 bg-[#161b22]/70 border-t border-neutral-800 flex justify-between items-center text-[11px] text-neutral-400 font-sans">
          <span>{lineCount} lines total</span>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 py-0.5 px-1.5 rounded transition-colors"
            aria-label="Collapse code window"
          >
            <span>Collapse code</span>
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function TextFormattedSection({ text }: { text: string }) {
  const paragraphs = text.split('\n\n');

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Heading 3
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-base font-semibold text-white mt-4 mb-2">
              {trimmed.slice(4)}
            </h3>
          );
        }
        // Heading 2
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-lg font-semibold text-white mt-5 mb-2">
              {trimmed.slice(3)}
            </h2>
          );
        }
        // Heading 1
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={pIdx} className="text-xl font-bold text-white mt-6 mb-3">
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

        // Ordered or Unordered list items
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
  // Bold **text**
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
  // Inline code `code`
  const codeParts = str.split(/(`.*?`)/g);

  return codeParts.map((cPart, cIdx) => {
    if (cPart.startsWith('`') && cPart.endsWith('`')) {
      return (
        <code key={cIdx} className="px-1.5 py-0.5 rounded bg-neutral-800 text-indigo-300 font-mono text-xs border border-neutral-700/60">
          {cPart.slice(1, -1)}
        </code>
      );
    }
    return cPart;
  });
}
