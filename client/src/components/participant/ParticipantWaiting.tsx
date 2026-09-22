import React, { useState, useEffect } from 'react';
import { Participant } from '../../types/game';
import { Badge } from '../common/Badge';
import { Sparkles, Wifi } from 'lucide-react';

interface ParticipantWaitingProps {
  roomCode: string;
  participant: Participant;
  customMessage?: string;
}

const instructorTips = [
  "💡 B2B Principle: Classroom delivery is sacred. Never compromise student experience for back-office requests.",
  "⚡ Pro Tip: A 1-sentence acknowledgment with an exact ETA is 100x better than ghosting.",
  "🎯 Notice → Inform → Fix → Prevent: Own mistakes early and team leads will trust you infinitely more.",
  "🚀 Saying NO constructively: Offer a realistic alternative instead of an abrupt flat rejection.",
  "🤝 Great instructors operate as a relay team. Support colleagues today and they will cover you tomorrow.",
];

export const ParticipantWaiting: React.FC<ParticipantWaitingProps> = ({
  roomCode,
  participant,
  customMessage,
}) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % instructorTips.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-between p-6 max-w-md mx-auto text-center animate-fade-in">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-ping" />
          <span className="font-mono text-xs font-bold text-brand-secondary">ROOM {roomCode}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-green-600/10 px-2.5 py-1 rounded-full border border-green-600/20">
          <Wifi className="w-3.5 h-3.5" />
          <span>CONNECTED</span>
        </div>
      </div>

      {/* Main Avatar & Waiting State */}
      <div className="my-auto space-y-6">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-3xl bg-brand-white border-2 border-slate-300 flex items-center justify-center text-5xl shadow-2xl mx-auto animate-pulse">
            {participant.avatar}
          </div>
          <span className="absolute -bottom-2 -right-2 text-xl">✨</span>
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-brand-dark font-display">
            Hey, {participant.name}! 👋
          </h2>
          <p className="text-xs font-semibold text-purple-400">
            {participant.team} · {participant.score.toLocaleString()} PTS
          </p>
        </div>

        {/* Pulse message */}
        <div className="p-4 rounded-2xl bg-brand-white border border-slate-200 shadow-xl space-y-2">
          <div className="flex items-center justify-center gap-2 text-orange-400 font-extrabold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4 animate-spin" />
            <span>{customMessage || "You're all set!"}</span>
          </div>
          <p className="text-xs text-brand-secondary">
            Look up at the facilitator's shared screen. The next scenario will launch directly on your phone!
          </p>
        </div>
      </div>

      {/* Rotating Tips Box */}
      <div className="p-4 rounded-2xl bg-brand-white border border-slate-200/80 text-left">
        <div className="text-[10px] font-black uppercase tracking-widest text-brand-secondary mb-1">
          INSTRUCTOR PRO-TIP
        </div>
        <p className="text-xs text-brand-dark font-medium leading-relaxed transition-all">
          {instructorTips[tipIndex]}
        </p>
      </div>
    </div>
  );
};

