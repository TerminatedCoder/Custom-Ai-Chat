import React from 'react';
import { Smartphone, Download } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall';

interface PWAInstallButtonProps {
  onOpenModal: () => void;
  compact?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenModal,
  compact = false
}) => {
  const { isInstalled, isInstallable, install } = usePWAInstall();

  // If already running in standalone mode, hide button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
    } else {
      onOpenModal();
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleClick}
        className="px-2.5 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 rounded-lg border border-indigo-700/60 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap min-h-[36px]"
        title="Install BranchLabs as Mobile App"
        aria-label="Install mobile app"
      >
        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
        <span className="hidden sm:inline">Install App</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-indigo-900/60 to-purple-900/60 hover:from-indigo-800/80 hover:to-purple-800/80 border border-indigo-700/50 text-neutral-100 hover:text-white text-xs font-medium flex items-center justify-between transition-all group shadow-sm cursor-pointer min-h-[42px]"
      title="Install as Mobile App on your device"
      aria-label="Install as Mobile App"
    >
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:scale-105 transition-transform">
          <Smartphone className="w-3.5 h-3.5" />
        </div>
        <div className="text-left">
          <div className="text-xs font-semibold text-white">Mobile App</div>
          <div className="text-[10px] text-neutral-400">Install to Home Screen</div>
        </div>
      </div>
      <Download className="w-3.5 h-3.5 text-indigo-400 group-hover:translate-y-0.5 transition-transform" />
    </button>
  );
};
