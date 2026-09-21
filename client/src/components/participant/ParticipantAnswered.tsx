import React from 'react';
import { CheckCircle2, Clock } from 'lucide-react';

interface ParticipantAnsweredProps {
  selectedAnswer: string;
}

export const ParticipantAnswered: React.FC<ParticipantAnsweredProps> = ({
  selectedAnswer,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-center max-w-md mx-auto animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 flex items-center justify-center mb-6 animate-bounce-short shadow-xl shadow-emerald-500/20">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <h2 className="text-2xl font-black text-white font-display mb-2">
        Answer Submitted!
      </h2>
      <p className="text-xs text-slate-400 mb-6 max-w-xs">
        Your choice has been recorded. Look at the facilitator's screen to see how the room voted.
      </p>

      {/* Answer Badge */}
      <div className="px-5 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 flex items-center gap-2 mb-8">
        <span>YOUR SELECTION:</span>
        <span className="text-orange-400 text-sm font-black">{selectedAnswer}</span>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 animate-pulse">
        <Clock className="w-3.5 h-3.5" />
        <span>Waiting for host to reveal results...</span>
      </div>
    </div>
  );
};
