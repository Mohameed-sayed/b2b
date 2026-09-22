import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ReconnectingScreenProps {
  name: string;
  avatar: string;
  roomCode: string;
  onGiveUp: () => void; // user wants to re-join manually instead
}

/**
 * Displayed while a returning participant's session is being re-established.
 * Shows after a browser refresh or tab close, before the reconnect ack comes back.
 */
export const ReconnectingScreen: React.FC<ReconnectingScreenProps> = ({
  name,
  avatar,
  roomCode,
  onGiveUp,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [dots, setDots] = useState('.');

  // Animated dots
  useEffect(() => {
    const t = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '.' : prev + '.'));
      setElapsed(prev => prev + 1);
    }, 800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center px-6 text-center animate-fade-in">
      {/* Animated ring */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-3xl bg-brand-white border-2 border-slate-300 flex items-center justify-center text-5xl shadow-2xl">
          {avatar || '🚀'}
        </div>
        {/* Pulsing ring */}
        <span className="absolute inset-0 rounded-3xl border-2 border-brand-accent/50 animate-ping" />
      </div>

      <h2 className="text-2xl font-black text-brand-dark mb-1">
        Welcome back, {name || 'Player'}!
      </h2>
      <p className="text-sm text-brand-secondary mb-6">
        Reconnecting you to room <span className="font-mono font-bold text-orange-400">{roomCode}</span>
        {dots}
      </p>

      {/* Status row */}
      <div className="flex items-center gap-2 text-xs font-bold text-amber-400 bg-brand-accent/10 border border-brand-accent/20 px-4 py-2 rounded-full mb-8">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Restoring your session</span>
      </div>

      {/* Escape hatch — only show after 6 seconds */}
      {elapsed >= 7 && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2 text-xs text-rose-400 bg-red-600/10 border border-red-600/20 px-4 py-2 rounded-full">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Taking longer than expected…</span>
          </div>
          <button
            onClick={onGiveUp}
            className="text-xs text-brand-secondary underline underline-offset-2 hover:text-brand-dark transition-colors"
          >
            Join as a new player instead
          </button>
        </div>
      )}
    </div>
  );
};

