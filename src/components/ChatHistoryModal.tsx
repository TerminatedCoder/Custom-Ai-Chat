import React, { useState, useMemo } from 'react';
import { ChatSession } from '../utils/chatManager';
import {
  History,
  Search,
  MessageSquare,
  Trash2,
  Download,
  Upload,
  Plus,
  X,
  Calendar,
  Check,
  Pencil,
  ArrowRight,
  Bot
} from 'lucide-react';

interface ChatHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClearAllSessions: () => void;
  onRenameSession: (id: string, newTitle: string) => void;
  onImportSessions: (imported: ChatSession[]) => void;
}

export const ChatHistoryModal: React.FC<ChatHistoryModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
  onClearAllSessions,
  onRenameSession,
  onImportSessions
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitleInput, setEditTitleInput] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // Filter sessions by title, modelId, or message content (called unconditionally)
  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sessions;

    return sessions.filter(s => {
      if (s.title.toLowerCase().includes(q)) return true;
      if (s.agentId.toLowerCase().includes(q)) return true;
      return s.messages.some(m => m.content.toLowerCase().includes(q));
    });
  }, [sessions, searchQuery]);

  if (!isOpen) return null;

  const handleStartRename = (s: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(s.id);
    setEditTitleInput(s.title);
  };

  const handleSaveRename = (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (editTitleInput.trim()) {
      onRenameSession(sessionId, editTitleInput.trim());
    }
    setEditingSessionId(null);
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(sessions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `branchlabs_chat_history_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setFeedbackMsg('Chat history exported successfully.');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0) {
          onImportSessions(parsed);
          setFeedbackMsg(`Imported ${parsed.length} sessions.`);
          setTimeout(() => setFeedbackMsg(''), 3000);
        } else {
          setFeedbackMsg('Invalid chat history file structure.');
          setTimeout(() => setFeedbackMsg(''), 3000);
        }
      } catch (err) {
        setFeedbackMsg('Error parsing JSON file.');
        setTimeout(() => setFeedbackMsg(''), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#121622] border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden select-none"
        role="dialog"
        aria-modal="true"
        aria-label="Chat History Manager"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/5 flex items-center justify-between bg-[#151a28]/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-white">Chat History</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300">
                  {sessions.length} {sessions.length === 1 ? 'conversation' : 'conversations'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                Browse, search, switch, or backup your conversation sessions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onNewSession();
                onClose();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="Start a new chat session"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label="Close history modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Tool Bar */}
        <div className="p-3.5 border-b border-white/5 bg-[#10141f] flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chat history, prompts, code..."
              className="w-full bg-[#181d2a] text-neutral-100 text-xs rounded-xl pl-9 pr-3 py-2 border border-white/5 focus:outline-hidden focus:border-indigo-500 placeholder-neutral-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Backup & Clear Actions */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleExportJson}
              disabled={sessions.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              title="Export all chat history to JSON file"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">Export</span>
            </button>

            <label className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Import</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            {sessions.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-300 border border-white/5 hover:border-rose-900/50 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Clear all chat history"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-[11px]">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert Banner */}
        {feedbackMsg && (
          <div className="px-4 py-2 bg-indigo-950/40 border-b border-indigo-900/50 text-xs text-indigo-300 flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Clear Confirm Dialog Overlay */}
        {showClearConfirm && (
          <div className="p-4 bg-rose-950/60 border-b border-rose-900/80 flex items-center justify-between gap-3 text-xs text-rose-200">
            <span>Are you sure you want to delete all {sessions.length} conversations? This cannot be undone.</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 rounded bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClearAllSessions();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-xs"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {filteredSessions.length === 0 ? (
            <div className="py-12 text-center text-neutral-400">
              <MessageSquare className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <p className="text-xs">
                {searchQuery ? `No conversations matched "${searchQuery}"` : 'No conversation history found.'}
              </p>
              <button
                onClick={() => {
                  onNewSession();
                  onClose();
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Start a New Conversation</span>
              </button>
            </div>
          ) : (
            filteredSessions.map(s => {
              const isActive = s.id === activeSessionId;
              const isEditingThis = editingSessionId === s.id;
              const lastMsg = s.messages[s.messages.length - 1];
              const firstMsg = s.messages.find(m => m.role === 'user');

              return (
                <div
                  key={s.id}
                  onClick={() => {
                    if (!isEditingThis) {
                      onSelectSession(s.id);
                      onClose();
                    }
                  }}
                  className={`group p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                    isActive
                      ? 'bg-[#181d2b] border-indigo-500/50 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-[#141824]/60 hover:bg-[#181d2b] border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Session Title & Actions Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                      {isActive ? (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
                      ) : (
                        <MessageSquare className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      )}

                      {isEditingThis ? (
                        <form
                          onSubmit={e => handleSaveRename(s.id, e)}
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 flex-1 min-w-0"
                        >
                          <input
                            type="text"
                            value={editTitleInput}
                            onChange={e => setEditTitleInput(e.target.value)}
                            autoFocus
                            className="bg-neutral-800 text-white text-xs rounded px-2 py-1 border border-indigo-500 flex-1 min-w-0 focus:outline-hidden"
                          />
                          <button
                            type="submit"
                            className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-xs"
                            title="Save title"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setEditingSessionId(null);
                            }}
                            className="p-1 rounded bg-neutral-800 text-neutral-400 hover:text-white"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </form>
                      ) : (
                        <span className="font-medium text-xs sm:text-sm text-neutral-100 truncate">
                          {s.title}
                        </span>
                      )}

                      {isActive && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-500/30 shrink-0">
                          Active
                        </span>
                      )}
                    </div>

                    {/* Quick Session Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100">
                      {!isEditingThis && (
                        <button
                          type="button"
                          onClick={e => handleStartRename(s, e)}
                          className="p-1 text-neutral-500 hover:text-neutral-200 rounded hover:bg-white/5 transition-colors"
                          title="Rename conversation"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteSession(s.id);
                        }}
                        className="p-1 text-neutral-500 hover:text-rose-400 rounded hover:bg-white/5 transition-colors"
                        title="Delete conversation"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div className="text-neutral-400 group-hover:text-indigo-400 transition-colors ml-1">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>

                  {/* Snippet & Metadata */}
                  <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1 border-t border-white/5">
                    <div className="flex items-center gap-2 truncate mr-2">
                      <span className="font-mono text-neutral-500 flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        {s.agentId || 'General Agent'}
                      </span>
                      <span>·</span>
                      <span className="text-neutral-400">
                        {s.messages.length} {s.messages.length === 1 ? 'message' : 'messages'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-neutral-500 shrink-0 font-mono text-[10px]">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(s.updatedAt || s.createdAt)}</span>
                    </div>
                  </div>

                  {/* Message Preview */}
                  {(firstMsg || lastMsg) && (
                    <p className="text-[11px] text-neutral-400/80 line-clamp-1 italic font-sans">
                      &ldquo;{(firstMsg || lastMsg)?.content.slice(0, 110)}&hellip;&rdquo;
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
