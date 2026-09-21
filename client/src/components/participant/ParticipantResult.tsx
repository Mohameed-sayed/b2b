import React, { useEffect } from 'react';
import { Badge } from '../common/Badge';
import { sound } from '../../utils/audio';
import { fireSmallStreak } from '../../utils/confetti';
import { CheckCircle2, XCircle, Flame, Lightbulb, Trophy } from 'lucide-react';

interface ParticipantResultProps {
  isCorrect: boolean;
  pointsAwarded: number;
  totalScore: number;
  streak: number;
  explanation?: string;
}

export const ParticipantResult: React.FC<ParticipantResultProps> = ({
  isCorrect,
  pointsAwarded,
  totalScore,
  streak,
  explanation,
}) => {
  useEffect(() => {
    if (isCorrect) {
      sound.playCorrect();
      if (streak >= 2) {
        fireSmallStreak();
      }
    } else {
      sound.playBuzzer();
    }
  }, [isCorrect, streak]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 max-w-md mx-auto text-center animate-fade-in pb-12">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <Badge variant={isCorrect ? 'success' : 'danger'} size="sm">
          {isCorrect ? 'CORRECT' : 'NOT QUITE'}
        </Badge>

        {streak > 1 && (
          <div className="flex items-center gap-1 text-xs font-bold text-orange-400 bg-orange-500/15 px-2.5 py-1 rounded-full border border-orange-500/30">
            <Flame className="w-3.5 h-3.5 fill-orange-400" />
            <span>{streak} IN A ROW!</span>
          </div>
        )}
      </div>

      {/* Center Score Card */}
      <div className="my-auto space-y-6">
        <div
          className={`w-24 h-24 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-2xl ${isCorrect ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/40 shadow-emerald-500/20' : 'bg-rose-500/20 text-rose-400 border-2 border-rose-500/40'}`}
        >
          {isCorrect ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
        </div>

        <div>
          <div
            className={`text-4xl font-black font-mono tracking-tight ${isCorrect ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            {isCorrect ? `+${pointsAwarded}` : '+0'}
          </div>
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {isCorrect ? 'Great Professional Instinct 🔥' : 'Valuable Lesson Learned'}
          </div>
        </div>

        {/* Takeaway Explanation */}
        {explanation && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Lightbulb className="w-4 h-4" />
              <span>Key Takeaway</span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {explanation}
            </p>
          </div>
        )}
      </div>

      {/* Bottom Total Score */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-bold">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>YOUR TOTAL SCORE</span>
        </div>
        <div className="font-mono text-base font-black text-white">
          {totalScore.toLocaleString()} pts
        </div>
      </div>
    </div>
  );
};
