import React, { useEffect, useState } from 'react';
import { socketService } from '../../services/socket';

interface Reaction {
  id: string;
  emoji: string;
  participantName?: string;
  left: number; // percentage from left
}

export const FloatingReactions: React.FC = () => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    const handleReaction = (data: { emoji: string, participantName?: string }) => {
      const id = Math.random().toString(36).substr(2, 9);
      const left = 5 + Math.random() * 90; // 5% to 95%
      
      setReactions(prev => [...prev, { id, emoji: data.emoji, participantName: data.participantName, left }]);
      
      // Remove after 3 seconds (duration of animation)
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.id !== id));
      }, 3000);
    };

    socket.on('room:reaction', handleReaction);

    return () => {
      socket.off('room:reaction', handleReaction);
    };
  }, []);

  if (reactions.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {reactions.map(r => (
        <div
          key={r.id}
          className="absolute bottom-10 animate-float-up pointer-events-none select-none"
          style={{ left: `${r.left}%` }}
        >
          {/* Google Meet Style Reaction Pill */}
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.16)] backdrop-blur-md">
            <span className="text-2xl md:text-3xl leading-none">{r.emoji}</span>
            {r.participantName && (
              <span className="text-xs md:text-sm font-bold text-slate-800 tracking-tight max-w-[140px] truncate">
                {r.participantName}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
