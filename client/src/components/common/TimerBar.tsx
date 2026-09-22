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

  let barColor = 'bg-brand-primary';
  if (isUrgent) {
    barColor = 'bg-red-500 animate-pulse';
  } else if (timeRemaining <= 20) {
    barColor = 'bg-brand-accent';
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm font-semibold">
        <div className="flex items-center gap-2 text-brand-dark">
          <Timer className={`w-4 h-4 ${isUrgent ? 'text-rose-400 animate-spin' : 'text-blue-400'}`} />
          <span>{isPaused ? 'TIMER PAUSED' : isExpired ? 'TIME IS UP!' : 'TIME REMAINING'}</span>
        </div>
        <div className={`font-mono text-lg font-black tracking-tight ${isUrgent ? 'text-rose-400 animate-bounce' : 'text-brand-dark'}`}>
          {timeRemaining}s
        </div>
      </div>

      <div className="h-3.5 w-full overflow-hidden rounded-full bg-slate-100/80 p-0.5 border border-slate-300/50">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-linear ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
