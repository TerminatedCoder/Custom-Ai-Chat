import React from 'react';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  HardDrive
} from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface MobileAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenApkSettings?: () => void;
}

export const MobileAppInstallModal: React.FC<MobileAppInstallModalProps> = ({
  isOpen,
  onClose,
  onOpenApkSettings
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        onClose();
      }
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Install BranchLabs Mobile App"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
    >
      <div
        className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with App Icon */}
        <div className="relative p-6 bg-gradient-to-b from-indigo-950/60 to-neutral-900 border-b border-neutral-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close install modal"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-neutral-800 border border-indigo-500/40 shadow-lg flex items-center justify-center shrink-0">
              <img src="/pwa-192x192.png" alt="BranchLabs App Icon" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold tracking-wide uppercase mb-1">
                <Sparkles className="w-3 h-3" />
                <span>Mobile App</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight font-display">
                Install BranchLabs
              </h2>
              <p className="text-xs text-neutral-400">
                Custom Agent Chat Studio on your phone
              </p>
            </div>
          </div>
        </div>

        {/* Features Checklist */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-800 text-neutral-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Full-screen app</span>
            </div>
            <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-800 text-neutral-300 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Offline chat storage</span>
            </div>
          </div>

          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                BranchLabs is already installed on your device and running as a standalone app!
              </span>
            </div>
          ) : isInstallable ? (
            /* Chrome / Android / Desktop 1-Click Install */
            <div className="space-y-3">
              <p className="text-xs text-neutral-300 leading-relaxed">
                Add BranchLabs directly to your phone's home screen for instant access with zero browser bars.
              </p>
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/25 transition-all cursor-pointer min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Install Mobile App Now</span>
              </button>
            </div>
          ) : isIOS ? (
            /* iOS Safari Manual Instructions */
            <div className="space-y-3 text-left">
              <p className="text-xs text-neutral-300 font-medium">
                To install on iOS (iPhone / iPad):
              </p>
              <div className="space-y-2.5 text-xs text-neutral-300">
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0">
                    <Share className="w-4 h-4 text-indigo-400" />
                  </div>
                  <span>1. Tap the <strong>Share</strong> button in Safari toolbar.</span>
                </div>
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-neutral-700 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span>2. Scroll down and tap <strong>Add to Home Screen</strong>.</span>
                </div>
              </div>
            </div>
          ) : (
            /* Generic instructions for mobile browsers */
            <div className="space-y-3 text-left">
              <p className="text-xs text-neutral-300 leading-relaxed">
                To install this webapp as an app on your phone:
              </p>
              <div className="p-3.5 rounded-xl bg-neutral-800/70 border border-neutral-700/60 text-xs text-neutral-300 space-y-2">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Open your browser's menu (<strong>⋮</strong> or <strong>Share</strong>)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Select <strong>Install app</strong> or <strong>Add to Home screen</strong></span>
                </div>
              </div>
            </div>
          )}

          {/* Direct Android APK Option in Settings */}
          <div className="p-3.5 rounded-xl bg-neutral-800/50 border border-neutral-700/50 text-left flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <span>Android APK (.apk)</span>
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                    APK
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400">
                  Build .apk file or export Android Studio project
                </div>
              </div>
            </div>
            {onOpenApkSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenApkSettings();
                }}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors shrink-0 cursor-pointer"
              >
                Settings APK &rarr;
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-neutral-900 border-t border-neutral-800 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors cursor-pointer min-h-[38px]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
