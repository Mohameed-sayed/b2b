import React, { useState } from 'react';
import { socketService } from '../../services/socket';

const EMOJIS = ['💡', '❓', '🤯', '👏', '🔥'];

export const ReactionBar: React.FC<{ roomCode: string }> = ({ roomCode }) => {
  const [cooldown, setCooldown] = useState(false);

  const handleReact = (emoji: string) => {
    if (cooldown) return;
    
    const socket = socketService.getSocket();
    if (socket.connected && roomCode) {
      socket.emit('participant:react', { roomCode, emoji });
    }
    
    // Tiny local visual feedback
    const btn = document.getElementById(`reaction-${emoji}`);
    if (btn) {
      btn.classList.add('scale-150', '-translate-y-2');
      setTimeout(() => {
        btn.classList.remove('scale-150', '-translate-y-2');
      }, 200);
    }

    setCooldown(true);
    setTimeout(() => setCooldown(false), 500); // 500ms cooldown to prevent aggressive spamming
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/60 z-50 flex items-center gap-2 transition-all">
      {EMOJIS.map(emoji => (
        <button
          key={emoji}
          id={`reaction-${emoji}`}
          onClick={() => handleReact(emoji)}
          disabled={cooldown}
          className="w-12 h-12 flex items-center justify-center text-2xl hover:bg-slate-100 rounded-full transition-all active:scale-95 disabled:opacity-50"
          title={`React with ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};
