import React, { useState, useEffect } from 'react';
import {
  X,
  Key,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  Globe,
  Smartphone,
  Download,
  ExternalLink,
  Package,
  HardDrive,
  FileCode,
  Sparkles,
  Info,
  Copy,
  FileJson,
  AlertTriangle
} from 'lucide-react';
import {
  getPwaBuilderUrl,
  downloadAndroidTwaZip,
  AndroidApkConfig
} from '../utils/androidApkGenerator';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  baseUrl: string;
  onSave: (key: string, url: string) => void;
  isScraping?: boolean;
  initialTab?: 'gateway' | 'apk';
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  baseUrl,
  onSave,
  isScraping,
  initialTab = 'gateway'
}) => {
  const [activeTab, setActiveTab] = useState<'gateway' | 'apk'>(initialTab);
  const [inputKey, setInputKey] = useState(apiKey);
  const [inputUrl, setInputUrl] = useState(baseUrl || 'https://co.agentrouter.org/v1');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  // Android APK configuration state
  const [apkTargetUrl, setApkTargetUrl] = useState(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://branchlabs.app';
  });
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [zipSuccess, setZipSuccess] = useState(false);
  const [manifestCopied, setManifestCopied] = useState(false);
  const [showManifestPreview, setShowManifestPreview] = useState(false);

  const manifestJsonString = JSON.stringify(
    {
      id: '/',
      name: 'BranchLabs - Custom Agent Chat Studio',
      short_name: 'BranchLabs',
      description: 'Multi-model AI studio with live docs scraping, code window, and conversation branching.',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait-primary',
      theme_color: '#0d1117',
      background_color: '#0d1117',
      categories: ['productivity', 'utilities', 'developer'],
      lang: 'en',
      dir: 'ltr',
      prefer_related_applications: false,
      shortcuts: [
        {
          name: 'New Chat',
          short_name: 'New',
          description: 'Start a new AI agent conversation',
          url: '/',
          icons: [{ src: '/pwa-192x192.png', sizes: '192x192' }]
        }
      ],
      icons: [
        { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
      ]
    },
    null,
    2
  );

  const handleCopyManifest = async () => {
    try {
      await navigator.clipboard.writeText(manifestJsonString);
      setManifestCopied(true);
      setTimeout(() => setManifestCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy manifest:', err);
    }
  };

  // Sync tab with initialTab when opening
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  // Sync apiKey and baseUrl props
  useEffect(() => {
    setInputKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (baseUrl) {
      setInputUrl(baseUrl);
    }
  }, [baseUrl]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(inputKey.trim(), inputUrl.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleKeyChange = (val: string) => {
    setInputKey(val);
    const trimmed = val.trim();
    if (trimmed.startsWith('sk-or-') && inputUrl.includes('agentrouter.org')) {
      setInputUrl('https://openrouter.ai/api/v1');
    }
  };

  const handleQuickPreset = (url: string) => {
    setInputUrl(url);
  };

  const handleDownloadProjectZip = async () => {
    try {
      setIsExportingZip(true);
      const config: AndroidApkConfig = {
        appName: 'BranchLabs',
        packageName: 'com.branchlabs.app',
        appUrl: apkTargetUrl.trim() || window.location.origin,
        themeColor: '#0D1117',
        backgroundColor: '#0B0F17'
      };
      await downloadAndroidTwaZip(config, 'branchlabs-android-project.zip');
      setZipSuccess(true);
      setTimeout(() => setZipSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate Android project zip:', err);
    } finally {
      setIsExportingZip(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
      <div className="bg-neutral-900 border-t sm:border border-neutral-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Mobile Drag Indicator */}
        <div className="sm:hidden w-10 h-1 bg-neutral-700 rounded-full mx-auto mt-2.5 mb-1 shrink-0" />

        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
              {activeTab === 'apk' ? <Smartphone className="w-4 h-4 text-emerald-400" /> : <Key className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="font-bold text-white text-base font-display">
                {activeTab === 'apk' ? 'Android APK & Mobile App' : 'Gateway & API Key Setup'}
              </h3>
              <p className="text-xs text-neutral-400">
                {activeTab === 'apk'
                  ? 'Download or generate native Android .apk package'
                  : 'Configure API keys to scrape models and chat'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-2 rounded-lg min-w-[40px] min-h-[40px] flex items-center justify-center -mr-1"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Tab Selector */}
        <div className="grid grid-cols-2 p-1.5 bg-neutral-950/60 border-b border-neutral-800 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('gateway')}
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[36px] ${
              activeTab === 'gateway'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Key className="w-3.5 h-3.5 text-indigo-400" />
            <span>Gateway & API Key</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('apk')}
            className={`py-2 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[36px] ${
              activeTab === 'apk'
                ? 'bg-neutral-800 text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Android APK (.apk)</span>
            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
              APK
            </span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto">
          {activeTab === 'gateway' ? (
            /* Gateway & API Key Tab */
            <>
              {/* Base URL */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Router Gateway Base URL</span>
                  </label>
                  <a
                    href="https://agentrouter.org/docs/index.html"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline"
                  >
                    Docs ↗
                  </a>
                </div>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={e => setInputUrl(e.target.value)}
                  placeholder="https://co.agentrouter.org/v1"
                  className="w-full bg-neutral-800/90 text-neutral-100 placeholder-neutral-500 text-base sm:text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700/60 focus:outline-hidden focus:border-indigo-500 font-mono"
                />
                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] text-neutral-500">Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('https://co.agentrouter.org/v1')}
                    className="px-2 py-0.5 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/50 min-h-[28px]"
                  >
                    agentrouter.org
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('https://openrouter.ai/api/v1')}
                    className="px-2 py-0.5 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/50 min-h-[28px]"
                  >
                    openrouter.ai
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('https://api.openai.com/v1')}
                    className="px-2 py-0.5 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/50 min-h-[28px]"
                  >
                    openai.com
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPreset('https://api.deepseek.com/v1')}
                    className="px-2 py-0.5 rounded text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors border border-neutral-700/50 min-h-[28px]"
                  >
                    deepseek.com
                  </button>
                </div>
              </div>

              {/* API Key */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-neutral-300 uppercase tracking-wider text-[11px]">
                    Custom API Key
                  </label>
                  {inputKey && (
                    <button
                      type="button"
                      onClick={() => setInputKey('')}
                      className="text-[11px] text-neutral-400 hover:text-rose-400 transition-colors py-1"
                    >
                      Clear Key
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={inputKey}
                    onChange={e => handleKeyChange(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-neutral-800/90 text-neutral-100 placeholder-neutral-500 text-base sm:text-xs rounded-xl pl-3.5 pr-10 py-2.5 border border-neutral-700/60 focus:outline-hidden focus:border-indigo-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center"
                    aria-label={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="p-3 bg-neutral-800/40 rounded-xl border border-neutral-800 text-[11px] text-neutral-400 flex items-start gap-2 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  Your API key is saved locally in your browser and used securely to scrape models and route completions to the gateway.
                </span>
              </div>
            </>
          ) : (
            /* Android APK Tab */
            <div className="space-y-4">
              {/* Target App URL Field */}
              <div>
                <label className="block font-semibold text-neutral-300 uppercase tracking-wider text-[11px] mb-1.5">
                  Target Website / Deployment URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={apkTargetUrl}
                    onChange={e => setApkTargetUrl(e.target.value)}
                    placeholder="https://your-site.netlify.app"
                    className="flex-1 bg-neutral-800 text-neutral-100 text-xs rounded-xl px-3.5 py-2.5 border border-neutral-700 font-mono focus:outline-hidden focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setApkTargetUrl(window.location.origin)}
                    className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-neutral-300 text-[11px]"
                    title="Reset to current browser origin"
                  >
                    Current
                  </button>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1">
                  The Android APK will embed this URL inside the native Trusted Web Activity wrapper.
                </p>
              </div>

              {/* Private URL Detection & PWABuilder Solution */}
              {(apkTargetUrl.includes('run.app') || apkTargetUrl.includes('localhost') || apkTargetUrl.includes('127.0.0.1')) && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 text-xs text-amber-200 space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Why PWABuilder says &ldquo;did not find a Web Manifest&rdquo;</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-relaxed">
                    AI Studio preview URLs (<code>*.run.app</code>) require Google login credentials. When external tools like PWABuilder scan this private URL, they get redirected to a Google login page instead of your app, reporting that no manifest was found.
                  </p>
                  <div className="p-2.5 rounded-lg bg-black/40 border border-amber-900/40 text-[11px] space-y-1.5">
                    <div className="font-semibold text-white">How to fix in PWABuilder:</div>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-300 pl-1">
                      <li>Click <strong>Copy Manifest JSON</strong> below.</li>
                      <li>In PWABuilder, click <strong>&ldquo;Manifest Editor&rdquo;</strong> &rarr; <strong>&ldquo;Input JSON&rdquo;</strong> and paste.</li>
                      <li>PWABuilder will immediately validate your manifest with a 100% score and generate your APK package!</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* 1-Click Copy Manifest JSON for PWABuilder */}
              <div className="p-3.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold text-white text-xs">
                      Web App Manifest JSON
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowManifestPreview(!showManifestPreview)}
                      className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors py-1 px-1.5 cursor-pointer"
                    >
                      {showManifestPreview ? 'Hide JSON' : 'View JSON'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyManifest}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm min-h-[32px]"
                    >
                      {manifestCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Manifest JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Ready-to-use W3C manifest containing app identity, description, theme colors, shortcuts, and 192/512 icon assets.
                </p>

                {showManifestPreview && (
                  <pre className="p-3 bg-black/60 rounded-xl border border-neutral-800 text-[10px] font-mono text-emerald-300 overflow-x-auto max-h-40">
                    {manifestJsonString}
                  </pre>
                )}
              </div>

              {/* Option 1: 1-Click Online APK Generator (PWABuilder) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/40 via-neutral-900 to-emerald-950/30 border border-indigo-800/50 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-xs">
                      1-Click Online APK Builder (Recommended)
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                    Instant
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">
                  Uses Microsoft PWABuilder to compile an official signed Android <strong>.apk</strong> or <strong>.aab</strong> package ready for installation on any phone or Google Play Store.
                </p>
                <a
                  href={getPwaBuilderUrl(apkTargetUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center justify-center gap-2 transition-colors shadow-sm min-h-[40px]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Build & Download .apk File on PWABuilder ↗</span>
                </a>
              </div>

              {/* Option 2: Full Android Studio TWA Project (.zip) */}
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-white text-xs">
                      Export Android Studio Project (.zip)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Gradle TWA
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                  Download a complete native Android project with <code>AndroidManifest.xml</code>, Gradle scripts, styles, colors, and Trusted Web Activity dependencies.
                </p>

                <button
                  type="button"
                  onClick={handleDownloadProjectZip}
                  disabled={isExportingZip}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[40px] disabled:opacity-50"
                >
                  <Download className={`w-3.5 h-3.5 ${isExportingZip ? 'animate-bounce' : ''}`} />
                  <span>
                    {isExportingZip
                      ? 'Generating Android Project...'
                      : zipSuccess
                      ? '✓ Android Project Downloaded!'
                      : 'Download Android Project Bundle (.zip)'}
                  </span>
                </button>
              </div>

              {/* Step-by-Step Installation Guide */}
              <div className="p-4 rounded-xl bg-neutral-800/40 border border-neutral-800 space-y-2.5">
                <div className="flex items-center gap-2 text-neutral-200 font-semibold text-xs">
                  <Info className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>How to Install the APK on Your Android Phone:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-neutral-300 leading-relaxed pl-1">
                  <li>Download the <strong>.apk</strong> file to your phone's Downloads.</li>
                  <li>Tap the downloaded file from your browser notification or Files app.</li>
                  <li>
                    If Android prompts <em>"Unknown sources"</em>: tap <strong>Settings</strong>, toggle <strong>"Allow from this source"</strong>, and tap <strong>Install</strong>.
                  </li>
                  <li>BranchLabs will now be installed as a native Android app in your app drawer!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-4 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between gap-2 shrink-0">
          <div className="text-[11px] text-neutral-500">
            {activeTab === 'apk' ? 'Package: com.branchlabs.app' : 'v1.0.0'}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-300 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors min-h-[40px]"
            >
              Close
            </button>
            {activeTab === 'gateway' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={isScraping}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-1.5 shadow-sm min-h-[40px] cursor-pointer"
              >
                {saved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>Saved & Scraping</span>
                  </>
                ) : (
                  <span>Save & Scrape Models</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
