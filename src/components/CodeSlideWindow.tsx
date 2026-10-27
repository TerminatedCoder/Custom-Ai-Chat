import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, FileCode, Hash, Sparkles, Terminal } from 'lucide-react';
import { getFileExtension, formatBytes, getLanguageBadgeColor } from '../utils/codeUtils';

interface CodeSlideWindowProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  code: string;
  language: string;
}

export const CodeSlideWindow: React.FC<CodeSlideWindowProps> = ({
  isOpen,
  onClose,
  fileName,
  code,
  language
}) => {
  const [copied, setCopied] = useState(false);
  const [wrapLines, setWrapLines] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const lines = code ? code.split('\n') : [];
  const lineCount = lines.length;
  const byteSize = new Blob([code || '']).size;
  const badgeColor = getLanguageBadgeColor(language);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
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
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-in fade-in duration-200">
      {/* Frosted Glass Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
        onClick={onClose}
        aria-label="Close backdrop overlay"
      />

      {/* Slide-over Window Panel */}
      <aside
        className="relative z-50 w-full sm:w-[580px] md:w-[720px] lg:w-[840px] bg-[#0d1017]/95 backdrop-blur-2xl border-l border-white/10 shadow-2xl flex flex-col h-full transform transition-transform duration-300 ease-out"
        role="dialog"
        aria-label={`Code Inspector: ${fileName}`}
      >
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#141822]/90 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0 mr-3">
            <div className={`w-8 h-8 rounded-lg ${badgeColor.bg} ${badgeColor.text} border ${badgeColor.border} flex items-center justify-center shrink-0`}>
              <FileCode className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm sm:text-base font-semibold text-white truncate tracking-tight">
                  {fileName}
                </h3>
                <span className={`text-[10px] uppercase font-semibold font-mono px-2 py-0.5 rounded border ${badgeColor.bg} ${badgeColor.text} ${badgeColor.border} shrink-0`}>
                  {language || getFileExtension(language)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-neutral-400 font-mono mt-0.5">
                <span>{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                <span>·</span>
                <span>{formatBytes(byteSize)}</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Wrap toggle */}
            <button
              type="button"
              onClick={() => setWrapLines(!wrapLines)}
              className={`hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-colors cursor-pointer ${
                wrapLines
                  ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:bg-white/10'
              }`}
              title="Toggle line wrapping"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>{wrapLines ? 'Unwrap' : 'Wrap'}</span>
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
              title="Download file"
              aria-label="Download code file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors flex items-center gap-1.5 text-xs shadow-sm cursor-pointer"
              title="Copy entire code to clipboard"
              aria-label="Copy code to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span className="text-emerald-300">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-neutral-400 hover:text-red-300 transition-colors flex items-center gap-1 text-xs cursor-pointer ml-1"
              title="Close window (Esc)"
              aria-label="Close slide window"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline font-sans">Close</span>
            </button>
          </div>
        </div>

        {/* Code Content Canvas */}
        <div className="flex-1 overflow-auto bg-[#0a0d14] relative font-mono text-xs select-text">
          <pre
            className="p-4 leading-relaxed flex min-w-full font-mono text-xs"
            style={{ whiteSpace: wrapLines ? 'pre-wrap' : 'pre', tabSize: 4 }}
          >
            {/* Sticky Line Number Gutter */}
            <div className="select-none pr-4 text-right text-neutral-600 font-mono text-xs border-r border-white/5 shrink-0 sticky left-0 bg-[#0a0d14] w-10 sm:w-12">
              {lines.map((_, i) => (
                <div key={i} className="h-5 leading-5">{i + 1}</div>
              ))}
            </div>

            {/* Syntax Highlighted Lines */}
            <code
              className="pl-4 font-mono block w-full text-neutral-200"
              style={{ whiteSpace: wrapLines ? 'pre-wrap' : 'pre', tabSize: 4 }}
            >
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="h-5 leading-5 hover:bg-white/[0.04] transition-colors rounded-xs"
                  style={{ whiteSpace: wrapLines ? 'pre-wrap' : 'pre', tabSize: 4 }}
                >
                  {renderHighlightedLine(line, language)}
                </div>
              ))}
            </code>
          </pre>
        </div>

        {/* Slide Window Footer */}
        <div className="px-4 py-2.5 bg-[#12151e] border-t border-white/5 flex items-center justify-between text-[11px] text-neutral-400 shrink-0 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-neutral-300">{fileName}</span>
            <span className="text-neutral-600">·</span>
            <span>UTF-8</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-neutral-500 hidden sm:inline">Press Esc or click Close</span>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

/**
 * Token highlighter for slide window code lines with strict indentation preservation
 */
function renderHighlightedLine(line: string, _language: string): React.ReactNode {
  if (!line || line.length === 0) return <span>{'\u00A0'}</span>;

  // Preserve lines that are only whitespace
  if (/^\s+$/.test(line)) {
    return <span style={{ whiteSpace: 'pre' }}>{line}</span>;
  }

  // Comment matching with preserved leading indentation
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

  // Generic keyword, string, number and boolean tokenization
  const parts = line.split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`|\b(?:def|class|return|yield|import|from|as|if|elif|else|while|for|in|is|not|and|or|try|except|finally|raise|with|pass|break|continue|lambda|global|nonlocal|assert|del|async|await|const|let|var|function|type|interface|extends|implements|new|this|typeof|instanceof|struct|impl|pub|fn)\b|(?:\b(?:self|cls|True|False|None|true|false|null|undefined)\b)|(?:\b(?:print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool|super|isinstance|open)\b)|(?:@(?:[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*))|\b\d+(?:\.\d+)?\b)/g);

  return (
    <span style={{ whiteSpace: 'pre', tabSize: 4 }}>
      {parts.map((part, i) => {
        if (!part) return null;

        // Strings
        if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'")) || (part.startsWith('`') && part.endsWith('`'))) {
          return <span key={i} className="text-emerald-300/90">{part}</span>;
        }

        // Keywords
        if (/^(?:def|class|return|yield|import|from|as|if|elif|else|while|for|in|is|not|and|or|try|except|finally|raise|with|pass|break|continue|lambda|global|nonlocal|assert|del|async|await|const|let|var|function|type|interface|extends|implements|new|this|typeof|instanceof|struct|impl|pub|fn)$/.test(part)) {
          return <span key={i} className="text-indigo-400 font-semibold">{part}</span>;
        }

        // Builtins
        if (/^(?:print|len|range|enumerate|zip|map|filter|list|dict|set|tuple|str|int|float|bool|super|isinstance|open)$/.test(part)) {
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
        if (/^\d+(?:\.\d+)?$/.test(part)) {
          return <span key={i} className="text-purple-300">{part}</span>;
        }

        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}
