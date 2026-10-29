import React from 'react';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-amber-950/90 border border-amber-600/60 px-4 py-1.5 text-xs font-medium text-amber-200 shadow-xl backdrop-blur-md animate-fade-in"
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>Offline Mode — Browsing local chat history</span>
    </div>
  );
};
