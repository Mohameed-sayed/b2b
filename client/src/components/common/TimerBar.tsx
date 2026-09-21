import React from 'react';
import { Timer } from 'lucide-react';

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  isPaused?: boolean;
}

export const TimerBar: React.FC<TimerBarProps> = ({
  timeRemaining,
  totalTime,
  isPaused = false
}) => {
  const percentage = Math.max(0, Math.min(100, (timeRemaining / totalTime) * 100));
  const isUrgent = timeRemaining <= 10 && timeRemaining > 0;
  const isExpired = timeRemaining === 0;

  // Determine progress bar color
  let barColor = 'bg-gradient-to-r from-blue-500 to-cyan-400';
  if (isUrgent) {
    barColor = 'bg-gradient-to-r from-rose-600 via-red-500 to-orange-500 animate-pulse';
  } else if (timeRemaining <= 20) {
    barColor = 'bg-gradient-to-r from-amber-500 to-orange-400';
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold">
        <div className="flex items-center gap-2 text-slate-300">
          <Timer className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-blue-400'}`} />
          <span>{isPaused ? 'TIMER PAUSED' : isExpired ? 'TIME IS UP!' : 'TIME REMAINING'}</span>
        </div>
        <div className={`font-mono text-lg font-black tracking-tight ${isUrgent ? 'text-rose-400 animate-bounce' : 'text-slate-100'}`}>
          {timeRemaining}s
        </div>
      </div>

      <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-800/80 p-0.5 border border-slate-700/50">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-linear ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
