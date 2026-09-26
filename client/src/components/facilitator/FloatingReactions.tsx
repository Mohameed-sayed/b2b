import React, { useEffect, useState } from 'react';
import { socketService } from '../../services/socket';

interface Reaction {
  id: string;
  emoji: string;
  left: number; // percentage from left
}

export const FloatingReactions: React.FC = () => {
  const [reactions, setReactions] = useState<Reaction[]>([]);

  useEffect(() => {
    const socket = socketService.getSocket();
    
    const handleReaction = (data: { emoji: string }) => {
      const id = Math.random().toString(36).substr(2, 9);
      const left = 5 + Math.random() * 90; // 5% to 95%
      
      setReactions(prev => [...prev, { id, emoji: data.emoji, left }]);
      
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
          className="absolute bottom-0 text-4xl md:text-6xl animate-float-up drop-shadow-lg"
          style={{ left: `${r.left}%` }}
        >
          {r.emoji}
        </div>
      ))}
    </div>
  );
};
