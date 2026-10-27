/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { AgentModel } from './utils/modelCatalog';
import { createManualAgentModel } from './utils/modelParser';
import {
  ChatMessage,
  ChatSession,
  parseSSEBuffer,
  CustomPersonality,
  PERSONALITY_PRESETS,
  branchUserMessage,
  switchMessageBranch,
  AttachedFile
} from './utils/chatManager';
import { getFileExtension, formatBytes } from './utils/codeUtils';
import { Header } from './components/Header';
import { AgentDeck } from './components/AgentDeck';
import { ChatMessageView } from './components/ChatMessageView';
import { ChatInput } from './components/ChatInput';
import { ModelCatalogModal } from './components/ModelCatalogModal';
import { AgentConfigModal } from './components/AgentConfigModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import { AddCustomAgentModal } from './components/AddCustomAgentModal';
import { CustomPersonalityModal } from './components/CustomPersonalityModal';
import { CodeSlideWindow } from './components/CodeSlideWindow';
import {
  Bot,
  Sparkles,
  Layers,
  Sliders,
  Trash2,
  Key,
  RefreshCw,
  AlertCircle,
  Shield,
  Eye,
  EyeOff,
  Plus,
  ExternalLink,
  ArrowRight,
  Check
} from 'lucide-react';

export default function App() {
  // Purge any previously stored predefined models
  useEffect(() => {
    localStorage.removeItem('ar_scraped_models');
    localStorage.removeItem('ar_scraped_models_v2');
    localStorage.removeItem('ar_scraped_models_v3');
  }, []);

  // Credentials & Gateway config
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('ar_api_key') || '';
  });
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    const saved = localStorage.getItem('ar_base_url');
    if (!saved || (saved.includes('agentrouter.org') && !saved.includes('co.agentrouter.org'))) {
      return 'https://co.agentrouter.org/v1';
    }
    return saved;
  });

  // Strictly scraped models (starts empty, NO predefined or demo models)
  const [models, setModels] = useState<AgentModel[]>(() => {
    const cached = localStorage.getItem('ar_scraped_models_live');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [];
  });

  const [activeAgent, setActiveAgent] = useState<AgentModel | null>(() => {
    const cached = localStorage.getItem('ar_scraped_models_live');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      } catch (e) {}
    }
    return null;
  });

  // Chat sessions & messages
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const cached = localStorage.getItem('ar_chat_sessions');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    const initialSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: 'New Conversation',
      agentId: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };
    return [initialSession];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || 'default_session';
  });

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeStatusMessage, setScrapeStatusMessage] = useState<string>('');
  const [scrapeError, setScrapeError] = useState<string>('');

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals state
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAddCustomModalOpen, setIsAddCustomModalOpen] = useState(false);
  const [isPersonalityModalOpen, setIsPersonalityModalOpen] = useState(false);

  // Custom AI character & instructions state
  const [customPersonalityId, setCustomPersonalityId] = useState<string>(() => {
    return localStorage.getItem('ar_personality_id') || '';
  });
  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    return localStorage.getItem('ar_custom_instructions') || '';
  });

  // In-page setup state for first time users
  const [setupKeyInput, setSetupKeyInput] = useState('');
  const [setupUrlInput, setSetupUrlInput] = useState('https://co.agentrouter.org/v1');
  const [showSetupKey, setShowSetupKey] = useState(false);
  const [directModelInput, setDirectModelInput] = useState('');

  // Attached files for chat
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);

  // Code Slide Window state
  const [codeSlideData, setCodeSlideData] = useState<{
    isOpen: boolean;
    fileName: string;
    code: string;
    language: string;
  }>({
    isOpen: false,
    fileName: '',
    code: '',
    language: ''
  });

  const handleAddFiles = (newFiles: AttachedFile[]) => {
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (fileId: string) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleOpenCodeSlide = (payload: { code: string; language: string; fileName: string }) => {
    setCodeSlideData({
      isOpen: true,
      ...payload
    });
  };

  const handleCloseCodeSlide = () => {
    setCodeSlideData(prev => ({ ...prev, isOpen: false }));
  };

  // References
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Active Session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const activeMessages = activeSession?.messages || [];

  // Persist sessions
  useEffect(() => {
    localStorage.setItem('ar_chat_sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Persist scraped models strictly
  useEffect(() => {
    if (models.length > 0) {
      localStorage.setItem('ar_scraped_models_live', JSON.stringify(models));
    } else {
      localStorage.removeItem('ar_scraped_models_live');
    }
  }, [models]);

  // Clear all models manually
  const handleClearModels = () => {
    setModels([]);
    setActiveAgent(null);
    localStorage.removeItem('ar_scraped_models');
    localStorage.removeItem('ar_scraped_models_v2');
    localStorage.removeItem('ar_scraped_models_v3');
    localStorage.removeItem('ar_scraped_models_live');
    setScrapeStatusMessage('');
    setScrapeError('');
  };

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isStreaming]);

  /**
   * Directly add any model ID
   */
  const handleAddDirectModel = (modelIdToAdd: string) => {
    const trimmed = modelIdToAdd.trim();
    if (!trimmed) return;

    const newAgent = createManualAgentModel(trimmed);

    setModels(prev => {
      const exists = prev.some(m => m.id === newAgent.id);
      if (exists) return prev;
      return [newAgent, ...prev];
    });

    setActiveAgent(newAgent);
    setScrapeError('');
    setScrapeStatusMessage(`Added model ${newAgent.name} (${newAgent.id}) to active agents.`);
    setDirectModelInput('');

    // Update active session
    if (activeSession) {
      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, agentId: newAgent.id, title: `${newAgent.name.split(' ')[0]} Chat` }
            : s
        )
      );
    }
  };

  /**
   * Scrape all agents from AgentRouter live portal / documentation
   */
  const handleScrapeDocs = async () => {
    setIsScraping(true);
    setScrapeError('');
    setScrapeStatusMessage('Scraping live models from https://co.agentrouter.org/portal/models...');

    try {
      const res = await fetch('/api/router/scrape-docs');
      const data = await res.json();

      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setModels(data.models);
        if (!activeAgent || !data.models.some((m: AgentModel) => m.id === activeAgent.id)) {
          setActiveAgent(data.models[0]);
        }
        setScrapeStatusMessage(data.message || `Scraped ${data.models.length} models live from AgentRouter!`);
      } else {
        setScrapeError(data.error || 'Failed to scrape live models from AgentRouter.');
        setScrapeStatusMessage('');
      }
    } catch (err: any) {
      setScrapeError(`Network error while scraping: ${err?.message || 'Check connection'}`);
      setScrapeStatusMessage('');
    } finally {
      setIsScraping(false);
    }
  };

  /**
   * Scrape models from API endpoint or documentation
   */
  const handleScrapeModels = async (keyToUse: string = apiKey, urlToUse: string = baseUrl) => {
    const trimmedKey = keyToUse.trim();
    setIsScraping(true);
    setScrapeError('');
    setScrapeStatusMessage(`Scraping models from ${urlToUse}...`);

    try {
      const res = await fetch('/api/router/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: trimmedKey,
          baseUrl: urlToUse.trim()
        })
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.models) && data.models.length > 0) {
        setModels(data.models);
        if (!activeAgent || !data.models.some((m: AgentModel) => m.id === activeAgent.id)) {
          setActiveAgent(data.models[0]);
        }
        setScrapeStatusMessage(data.message || `Successfully scraped ${data.models.length} models!`);

        // Update active session agent if empty
        if (activeSession && (!activeSession.agentId || activeSession.messages.length === 0)) {
          setSessions(prev =>
            prev.map(s =>
              s.id === activeSession.id
                ? { ...s, agentId: data.models[0].id, title: `${data.models[0].name.split(' ')[0]} Chat` }
                : s
            )
          );
        }
      } else {
        const err = data.error || 'Failed to scrape models from API.';
        setScrapeError(err);
        setScrapeStatusMessage('');
      }
    } catch (err: any) {
      setScrapeError(`Network error reaching gateway: ${err?.message || 'Check connection'}`);
      setScrapeStatusMessage('');
    } finally {
      setIsScraping(false);
    }
  };

  /**
   * Add a custom agent with detailed attributes
   */
  const handleAddCustomAgent = (newAgent: AgentModel) => {
    setModels(prev => {
      const exists = prev.some(m => m.id === newAgent.id);
      if (exists) {
        return prev.map(m => m.id === newAgent.id ? newAgent : m);
      }
      return [newAgent, ...prev];
    });

    setActiveAgent(newAgent);
    setScrapeError('');
    setScrapeStatusMessage(`Added custom agent ${newAgent.name} (${newAgent.id})`);

    if (activeSession) {
      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, agentId: newAgent.id, title: `${newAgent.name.split(' ')[0]} Chat` }
            : s
        )
      );
    }
  };

  /**
   * Save API Key and Gateway settings
   */
  const handleSaveApiKey = (newKey: string, newUrl: string) => {
    setApiKey(newKey);
    setBaseUrl(newUrl);

    localStorage.setItem('ar_api_key', newKey);
    localStorage.setItem('ar_base_url', newUrl);

    handleScrapeModels(newKey, newUrl);
  };

  /**
   * Quick in-page initial scrape
   */
  const handleInitialSetupScrape = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveApiKey(setupKeyInput.trim(), setupUrlInput.trim());
  };

  /**
   * Create New Chat Session
   */
  const handleNewChat = () => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }

    const initialAgent = activeAgent || models[0];
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: initialAgent ? `${initialAgent.name.split(' ')[0]} Chat` : 'New Conversation',
      agentId: initialAgent ? initialAgent.id : '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: []
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsMobileDrawerOpen(false);
  };

  /**
   * Select an agent to chat with
   */
  const handleSelectAgent = (agent: AgentModel) => {
    setActiveAgent(agent);

    if (activeSession && activeSession.messages.length === 0) {
      setSessions(prev =>
        prev.map(s =>
          s.id === activeSession.id
            ? { ...s, agentId: agent.id, title: `${agent.name.split(' ')[0]} Chat` }
            : s
        )
      );
    }
  };

  /**
   * Delete Chat Session
   */
  const handleDeleteSession = (id: string) => {
    setSessions(prev => {
      const remaining = prev.filter(s => s.id !== id);
      if (remaining.length === 0) {
        const fresh: ChatSession = {
          id: 'session_' + Date.now(),
          title: 'New Conversation',
          agentId: activeAgent ? activeAgent.id : '',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: []
        };
        setActiveSessionId(fresh.id);
        return [fresh];
      }
      if (activeSessionId === id) {
        setActiveSessionId(remaining[0].id);
      }
      return remaining;
    });
  };

  /**
   * Clear current conversation
   */
  const handleClearCurrentChat = () => {
    if (!activeSession) return;
    setSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? { ...s, messages: [], updatedAt: Date.now() }
          : s
      )
    );
  };

  const activePersonality = PERSONALITY_PRESETS.find(p => p.id === customPersonalityId);

  /**
   * Save Custom Personality & Instructions
   */
  const handleSavePersonality = (preset?: CustomPersonality, customText?: string) => {
    const pId = preset ? preset.id : '';
    const text = customText ?? '';
    setCustomPersonalityId(pId);
    setCustomInstructions(text);
    localStorage.setItem('ar_personality_id', pId);
    localStorage.setItem('ar_custom_instructions', text);
    setScrapeStatusMessage(preset ? `Applied ${preset.name} persona.` : 'Custom instructions applied.');
    setTimeout(() => setScrapeStatusMessage(''), 3000);
  };

  /**
   * Reset Personality to default
   */
  const handleClearPersonality = () => {
    setCustomPersonalityId('');
    setCustomInstructions('');
    localStorage.removeItem('ar_personality_id');
    localStorage.removeItem('ar_custom_instructions');
    setScrapeStatusMessage('Reset AI character to default agent persona.');
    setTimeout(() => setScrapeStatusMessage(''), 3000);
  };

  /**
   * Reusable streaming response runner for new chats and branching forks
   */
  const executeStreamResponse = async (contextMessages: ChatMessage[], assistantMessageId: string) => {
    if (!activeAgent) return;

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    // Construct enriched system prompt incorporating agent persona + custom character instructions
    let enrichedSystemPrompt = activeAgent.systemPrompt;
    if (activePersonality) {
      enrichedSystemPrompt += `\n\n[Active Personality Role: ${activePersonality.name}]\n${activePersonality.instructions}`;
    }
    if (customInstructions && customInstructions.trim()) {
      enrichedSystemPrompt += `\n\n[Custom User Instructions]:\n${customInstructions.trim()}`;
    }

    try {
      const response = await fetch('/api/router/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          baseUrl,
          model: activeAgent.actualModelId || activeAgent.id,
          protocol: activeAgent.protocol,
          messages: contextMessages,
          systemPrompt: enrichedSystemPrompt,
          temperature: activeAgent.temperature ?? 0.7,
          maxTokens: activeAgent.maxTokens ?? 2048
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.body) {
        throw new Error('No readable response body from server.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamBuffer = '';
      let accumulatedContent = '';
      let accumulatedThought = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const textChunk = decoder.decode(value, { stream: true });
        streamBuffer += textChunk;

        const { deltas, thoughts, remainingBuffer, isDone } = parseSSEBuffer(streamBuffer);
        streamBuffer = remainingBuffer;

        if (deltas.length > 0) {
          accumulatedContent += deltas.join('');
        }
        if (thoughts.length > 0) {
          accumulatedThought += thoughts.join('');
        }

        setSessions(prev =>
          prev.map(s => {
            if (s.id !== activeSession.id) return s;
            const msgs = s.messages.map(m => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content: accumulatedContent,
                  thought: accumulatedThought
                };
              }
              return m;
            });
            return { ...s, messages: msgs };
          })
        );

        if (isDone) break;
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Chat generation error:', err);
        setSessions(prev =>
          prev.map(s => {
            if (s.id !== activeSession.id) return s;
            const msgs = s.messages.map(m => {
              if (m.id === assistantMessageId) {
                return {
                  ...m,
                  content:
                    m.content ||
                    `**Gateway Error**: Unable to reach ${baseUrl} with scraped model \`${activeAgent.id}\`. Please verify your API key.`
                };
              }
              return m;
            });
            return { ...s, messages: msgs };
          })
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  /**
   * Send User Message and Stream Agent Response (supporting attached files)
   */
  const handleSendMessage = async (textToSend: string = input) => {
    const trimmed = textToSend.trim();
    if ((!trimmed && attachedFiles.length === 0) || isStreaming || !activeAgent) return;

    const currentAttachments = [...attachedFiles];
    setInput('');
    setAttachedFiles([]);

    // Construct prompt context with attached files formatted
    let effectiveContent = trimmed;
    if (currentAttachments.length > 0) {
      const fileHeaders = currentAttachments
        .map(f => {
          if (f.isImage) {
            return `[Attached Image: ${f.name} (${formatBytes(f.size)})]`;
          }
          const ext = getFileExtension(f.name.split('.').pop() || 'txt');
          return `[Attached File: ${f.name} (${formatBytes(f.size)})]\n\`\`\`${ext}\n${f.content}\n\`\`\``;
        })
        .join('\n\n');

      effectiveContent = trimmed
        ? `${fileHeaders}\n\nUser Question/Instruction:\n${trimmed}`
        : `${fileHeaders}\n\nPlease inspect the above attached file(s) and provide a comprehensive analysis or requested code implementation.`;
    }

    const displayPrompt =
      trimmed ||
      (currentAttachments.length > 0
        ? `Attached ${currentAttachments.length} file${currentAttachments.length === 1 ? '' : 's'}`
        : '');

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: displayPrompt,
      timestamp: Date.now(),
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined
    };

    const contextUserMessage: ChatMessage = {
      ...userMessage,
      content: effectiveContent
    };

    const assistantMessageId = 'msg_ast_' + (Date.now() + 1);
    const placeholderAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      thought: '',
      timestamp: Date.now() + 1,
      modelId: activeAgent.id,
      provider: activeAgent.provider
    };

    const updatedTitle =
      activeMessages.length === 0
        ? displayPrompt.slice(0, 32) + (displayPrompt.length > 32 ? '...' : '')
        : activeSession.title;

    const newMessages = [...activeMessages, userMessage];
    const streamContextMessages = [...activeMessages, contextUserMessage];

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              title: updatedTitle,
              messages: [...newMessages, placeholderAssistantMessage],
              updatedAt: Date.now()
            }
          : s
      )
    );

    executeStreamResponse(streamContextMessages, assistantMessageId);
  };

  /**
   * Conversation Branching: Edit previously sent message and fork the conversation path
   */
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }

    const { updatedMessages, targetIndex } = branchUserMessage(activeMessages, messageId, newContent);
    if (targetIndex === -1 || !activeAgent) return;

    const assistantMessageId = 'msg_ast_' + (Date.now() + 1);
    const placeholderAssistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      thought: '',
      timestamp: Date.now() + 1,
      modelId: activeAgent.id,
      provider: activeAgent.provider
    };

    const finalMessages = [...updatedMessages, placeholderAssistantMessage];

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: finalMessages,
              updatedAt: Date.now()
            }
          : s
      )
    );

    executeStreamResponse(updatedMessages, assistantMessageId);
  };

  /**
   * Conversation Branching: Toggle between previous branches
   */
  const handleSwitchBranch = (messageId: string, branchIndex: number) => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }

    const switchedMessages = switchMessageBranch(activeMessages, messageId, branchIndex);

    setSessions(prev =>
      prev.map(s =>
        s.id === activeSession.id
          ? {
              ...s,
              messages: switchedMessages,
              updatedAt: Date.now()
            }
          : s
      )
    );
  };

  /**
   * Contextual Action Chip Trigger
   */
  const handleActionChipClick = (prompt: string) => {
    if (isStreaming) return;
    handleSendMessage(prompt);
  };

  /**
   * Stop generation
   */
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0b0f17] text-neutral-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <Header
        activeAgent={activeAgent}
        apiKey={apiKey}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        onOpenCatalogModal={() => setIsCatalogModalOpen(true)}
        onNewChat={handleNewChat}
        onToggleMobileDrawer={() => setIsMobileDrawerOpen(!isMobileDrawerOpen)}
        onScrapeDocs={handleScrapeDocs}
        onOpenAddCustom={() => setIsAddCustomModalOpen(true)}
        onOpenPersonality={() => setIsPersonalityModalOpen(true)}
        scrapedCount={models.length}
      />

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Agent Deck */}
        <AgentDeck
          agents={models}
          activeAgent={activeAgent}
          onSelectAgent={handleSelectAgent}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={id => setActiveSessionId(id)}
          onDeleteSession={handleDeleteSession}
          onOpenCatalog={() => setIsCatalogModalOpen(true)}
          onOpenConfig={() => setIsConfigModalOpen(true)}
          onOpenApiKey={() => setIsApiKeyModalOpen(true)}
          onOpenAddCustom={() => setIsAddCustomModalOpen(true)}
          onOpenPersonality={() => setIsPersonalityModalOpen(true)}
          apiKey={apiKey}
          onScrapeModels={() => handleScrapeModels(apiKey, baseUrl)}
          onScrapeDocs={handleScrapeDocs}
          onClearModels={handleClearModels}
          isScraping={isScraping}
          isOpenOnMobile={isMobileDrawerOpen}
          onCloseMobile={() => setIsMobileDrawerOpen(false)}
        />

        {/* Center / Chat Stage with Refined Dark Mode */}
        <main className="flex-1 flex flex-col h-full bg-[#0f1218] relative overflow-hidden min-w-0 pb-16 md:pb-0">
          {/* Agent HUD Bar with Frosted Glassmorphism */}
          <div className="h-11 sm:h-12 px-3 sm:px-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#12151d]/85 backdrop-blur-md z-10">
            <div className="flex items-center gap-2 sm:gap-3 truncate mr-2">
              <div className="w-6 h-6 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 truncate">
                <span className="font-semibold text-xs sm:text-sm text-neutral-100 truncate">
                  {activeAgent ? activeAgent.name : 'No Scraped Model Selected'}
                </span>
                {activeAgent && (
                  <>
                    <span className="text-neutral-500 text-xs hidden sm:inline">·</span>
                    <span className="text-xs text-neutral-400 font-mono hidden sm:inline">
                      {activeAgent.provider}
                    </span>
                  </>
                )}
                {activePersonality && (
                  <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-950/40 text-indigo-300 border border-indigo-500/25 text-[10px] font-mono">
                    <Sparkles className="w-2.5 h-2.5" />
                    {activePersonality.name}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {models.length > 0 && (
                <>
                  <button
                    onClick={() => setIsCatalogModalOpen(true)}
                    className="px-2 sm:px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 min-h-[34px] cursor-pointer"
                    title="Switch scraped model"
                    aria-label="Switch agent"
                  >
                    <Layers className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">Models ({models.length})</span>
                  </button>

                  <button
                    onClick={() => setIsPersonalityModalOpen(true)}
                    className="px-2 sm:px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 min-h-[34px] cursor-pointer"
                    title="Customize AI character & instructions"
                    aria-label="Customize AI character persona"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="hidden sm:inline">
                      {activePersonality ? activePersonality.name : 'Persona'}
                    </span>
                  </button>

                  {activeAgent && (
                    <button
                      onClick={() => setIsConfigModalOpen(true)}
                      className="px-2 sm:px-2.5 py-1 text-xs text-neutral-300 hover:text-white rounded-lg hover:bg-white/5 transition-colors flex items-center gap-1 min-h-[34px] cursor-pointer"
                      title="Customize persona"
                      aria-label="Configure agent parameters"
                    >
                      <Sliders className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="hidden sm:inline">Params</span>
                    </button>
                  )}
                </>
              )}

              {activeMessages.length > 0 && (
                <button
                  onClick={handleClearCurrentChat}
                  className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg hover:bg-neutral-800 transition-colors min-w-[34px] min-h-[34px] flex items-center justify-center"
                  title="Clear conversation"
                  aria-label="Clear chat"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Messages Scroll View OR Initial Scrape Setup Screen */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6 space-y-2">
            {models.length === 0 ? (
              /* EMPTY STATE: Only Scraped Models Allowed */
              <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <Key className="w-7 h-7" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
                  Scrape Agents from AgentRouter Docs
                </h1>

                <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mb-4 leading-relaxed">
                  Scrape AI coding agents and comparative models live from the official documentation:
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                  <a
                    href="https://agentrouter.org/docs/claude-code.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/40 border border-orange-800/60 text-xs text-orange-300 hover:text-orange-200 hover:bg-orange-950/60 transition-colors"
                  >
                    <span>Claude Code Agent Docs</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="https://agentrouter.org/docs/codex.html"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 hover:text-emerald-200 hover:bg-emerald-950/60 transition-colors"
                  >
                    <span>Codex & Comparative Models</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {scrapeError && (
                  <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300 flex items-start gap-2.5 text-left">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{scrapeError}</span>
                  </div>
                )}

                {scrapeStatusMessage && (
                  <div className="mb-5 p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/50 text-xs text-indigo-300 flex items-center gap-2.5 text-left">
                    <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
                    <span>{scrapeStatusMessage}</span>
                  </div>
                )}

                <div className="mb-6">
                  <button
                    type="button"
                    onClick={handleScrapeDocs}
                    disabled={isScraping}
                    className="w-full py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-indigo-500/25 cursor-pointer min-h-[48px]"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScraping ? 'animate-spin' : ''}`} />
                    <span>Scrape All Agents & Models from Live Docs</span>
                  </button>
                  <p className="text-[11px] text-neutral-400 mt-2">
                    Scrapes Claude Code CLI, Codex, Cline, Roo Code, Trae, OpenCode & comparative models directly from the live site.
                  </p>
                </div>

                <form onSubmit={handleInitialSetupScrape} className="bg-neutral-900/90 border border-neutral-800 p-5 rounded-2xl text-left space-y-4 shadow-xl">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        Gateway Base URL
                      </label>
                      <span className="text-[11px] text-neutral-500">Official Gateway</span>
                    </div>
                    <input
                      type="text"
                      value={setupUrlInput}
                      onChange={e => setSetupUrlInput(e.target.value)}
                      placeholder="https://co.agentrouter.org/v1"
                      className="w-full bg-neutral-800 text-neutral-100 text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700 font-mono focus:outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                        AgentRouter API Key
                      </label>
                      <a
                        href="https://co.agentrouter.org"
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Get Key ↗
                      </a>
                    </div>
                    <div className="relative">
                      <input
                        type={showSetupKey ? 'text' : 'password'}
                        value={setupKeyInput}
                        onChange={e => setSetupKeyInput(e.target.value)}
                        placeholder="Enter API key to chat with scraped agents"
                        className="w-full bg-neutral-800 text-neutral-100 text-xs rounded-xl pl-3.5 pr-10 py-2.5 border border-neutral-700 font-mono focus:outline-hidden focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSetupKey(!showSetupKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-1.5"
                        aria-label={showSetupKey ? 'Hide key' : 'Show key'}
                      >
                        {showSetupKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-1.5">
                      Used for chat completions with Claude Code, Codex, and other scraped agents.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isScraping}
                    className="w-full py-2.5 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 disabled:opacity-50 text-neutral-200 hover:text-white text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[44px]"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Save Key & Scrape Agents</span>
                  </button>
                </form>

                {/* Direct Model ID Add Card */}
                <div className="mt-5 p-4 rounded-2xl bg-neutral-900/70 border border-neutral-800 text-left shadow-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Or Add Model / Agent by ID Directly</span>
                    </span>
                    <span className="text-[10px] text-indigo-400 font-medium px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-900/50">
                      Instant
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-400 mb-3 leading-relaxed">
                    Have an AgentRouter model ID from the documentation? Add it directly to chat:
                  </p>

                  <div className="flex gap-2 mb-2.5">
                    <input
                      type="text"
                      value={directModelInput}
                      onChange={e => setDirectModelInput(e.target.value)}
                      placeholder="e.g. claude-opus-4-8 or gpt-5.5"
                      className="flex-1 bg-neutral-800 text-neutral-100 text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700 font-mono focus:outline-hidden focus:border-indigo-500"
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddDirectModel(directModelInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleAddDirectModel(directModelInput)}
                      disabled={!directModelInput.trim()}
                      className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[42px] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add & Chat</span>
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-neutral-500">Documented Models:</span>
                    {[
                      'claude-opus-4-8',
                      'gpt-5.5',
                      'kimi-k2.6',
                      'glm-5.1',
                      'step3p5-code-alpha',
                      'step3p6-preview'
                    ].map(id => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleAddDirectModel(id)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-indigo-300 border border-neutral-700 transition-colors"
                      >
                        +{id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeMessages.length === 0 && activeAgent ? (
              /* Welcome Screen with active scraped model */
              <div className="max-w-2xl mx-auto py-8 sm:py-12 px-2 text-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-sm">
                  <Bot className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>

                <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 font-display">
                  {activeAgent.name}
                </h1>

                <p className="text-xs sm:text-sm text-neutral-400 max-w-lg mx-auto mb-3 leading-relaxed px-2">
                  {activeAgent.description}
                </p>

                <div className="text-[11px] sm:text-xs text-neutral-400 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8">
                  <span>Provider: {activeAgent.provider}</span>
                  <span>·</span>
                  <span>Model ID: <code className="font-mono text-indigo-300">{activeAgent.id}</code></span>
                  <span>·</span>
                  <span>{(activeAgent.contextWindow / 1000).toFixed(0)}k ctx</span>
                </div>

                {/* Prompt Starters */}
                <div className="text-left max-w-xl mx-auto">
                  <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Suggested Prompts for this Model</span>
                  </div>

                  <div className="space-y-2">
                    {activeAgent.suggestedPrompts.map((promptText, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(promptText)}
                        className="w-full p-3 rounded-xl bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-left text-xs text-neutral-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer min-h-[48px]"
                      >
                        <span className="truncate pr-2">{promptText}</span>
                        <span className="text-indigo-400 text-xs shrink-0 font-medium">
                          Ask &rarr;
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Continuous Document Canvas */
              <div className="max-w-3xl mx-auto space-y-1 sm:space-y-2">
                {activeMessages.map(msg => (
                  <ChatMessageView
                    key={msg.id}
                    message={msg}
                    agentName={activeAgent ? activeAgent.name : 'Scraped Agent'}
                    provider={activeAgent ? activeAgent.provider : undefined}
                    isStreaming={isStreaming && msg.id === activeMessages[activeMessages.length - 1]?.id}
                    onEditMessage={handleEditMessage}
                    onSwitchBranch={handleSwitchBranch}
                    onActionChipClick={handleActionChipClick}
                    onOpenCodeSlideWindow={handleOpenCodeSlide}
                  />
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Floating Input Pill Area (Continuous Breathing Room) */}
          {models.length > 0 && activeAgent && (
            <ChatInput
              input={input}
              setInput={setInput}
              onSend={() => handleSendMessage()}
              isStreaming={isStreaming}
              onStop={handleStopGeneration}
              activeModelName={activeAgent.name}
              provider={activeAgent.provider}
              onOpenConfig={() => setIsConfigModalOpen(true)}
              onOpenPersonality={() => setIsPersonalityModalOpen(true)}
              activePersonality={activePersonality}
              hasCustomInstructions={Boolean(customInstructions.trim())}
              attachedFiles={attachedFiles}
              onAddFiles={handleAddFiles}
              onRemoveFile={handleRemoveFile}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Tab Bar with Frosted Glass */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#12151e]/90 backdrop-blur-xl border-t border-white/5 grid grid-cols-4 items-center h-14 pb-safe select-none">
        <button
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex flex-col items-center justify-center h-full text-neutral-400 hover:text-white transition-colors min-h-[44px]"
          aria-label="Open sessions and agents drawer"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Drawer</span>
        </button>

        <button
          onClick={() => setIsCatalogModalOpen(true)}
          disabled={models.length === 0}
          className="flex flex-col items-center justify-center h-full text-neutral-400 hover:text-white disabled:opacity-30 transition-colors min-h-[44px]"
          aria-label="Open model catalog"
        >
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Models ({models.length})</span>
        </button>

        <button
          onClick={() => setIsPersonalityModalOpen(true)}
          className="flex flex-col items-center justify-center h-full text-neutral-400 hover:text-white transition-colors min-h-[44px]"
          aria-label="Customize AI character persona"
        >
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-medium tracking-tight mt-1">Persona</span>
        </button>

        <button
          onClick={() => setIsApiKeyModalOpen(true)}
          className="flex flex-col items-center justify-center h-full text-neutral-400 hover:text-white transition-colors min-h-[44px]"
          aria-label="Open API settings"
        >
          <Shield className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-medium tracking-tight mt-1">API Key</span>
        </button>
      </nav>

      {/* Modals */}
      <CustomPersonalityModal
        isOpen={isPersonalityModalOpen}
        onClose={() => setIsPersonalityModalOpen(false)}
        activePersonalityId={customPersonalityId}
        customInstructions={customInstructions}
        onSavePersonality={handleSavePersonality}
        onClearPersonality={handleClearPersonality}
      />

      <ModelCatalogModal
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        models={models}
        activeAgentId={activeAgent ? activeAgent.id : ''}
        onSelectAgent={handleSelectAgent}
        onScrapeModels={() => handleScrapeModels(apiKey, baseUrl)}
        onScrapeDocs={handleScrapeDocs}
        onClearModels={handleClearModels}
        onAddDirectModel={handleAddDirectModel}
        onOpenAddCustom={() => setIsAddCustomModalOpen(true)}
        isScraping={isScraping}
        scrapeStatusMessage={scrapeStatusMessage}
      />

      <AddCustomAgentModal
        isOpen={isAddCustomModalOpen}
        onClose={() => setIsAddCustomModalOpen(false)}
        onAddAgent={handleAddCustomAgent}
      />

      {activeAgent && (
        <AgentConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          agent={activeAgent}
          onUpdateAgent={updated => {
            setActiveAgent(updated);
            setModels(prev => prev.map(m => (m.id === updated.id ? updated : m)));
          }}
        />
      )}

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={apiKey}
        baseUrl={baseUrl}
        onSave={handleSaveApiKey}
        isScraping={isScraping}
      />

      {/* Slide-over Code Inspector Window */}
      <CodeSlideWindow
        isOpen={codeSlideData.isOpen}
        onClose={handleCloseCodeSlide}
        fileName={codeSlideData.fileName}
        code={codeSlideData.code}
        language={codeSlideData.language}
      />
    </div>
  );
}
