import React, { useEffect } from 'react';
import { Question, OptionDistributionStats } from '../../types/game';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { sound } from '../../utils/audio';
import {
  CheckCircle2,
  XCircle,
  Trophy,
  MessageCircle,
  Lightbulb,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface AnswerRevealViewProps {
  question: Question;
  stats: OptionDistributionStats[];
  totalAnswers: number;
  onShowLeaderboard: () => void;
}

export const AnswerRevealView: React.FC<AnswerRevealViewProps> = ({
  question,
  stats,
  totalAnswers,
  onShowLeaderboard,
}) => {
  // Play celebration fanfare when reveal loads
  useEffect(() => {
    sound.playCorrect();
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Badge variant="success" size="md" icon={<CheckCircle2 className="w-4 h-4" />}>
            RESULTS & DEBRIEF
          </Badge>
          <span className="text-sm font-extrabold text-slate-300">
            {question.title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400">
            TOTAL RESPONSES: <span className="text-white font-mono">{totalAnswers}</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Distribution Chart + Explanation (Left) vs Facilitator Debrief Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-6 items-start">
        {/* Left Column: Live Animated Distribution Chart & Rationale */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <span>Live Answer Distribution</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h3>

            {/* Distribution Bars */}
            <div className="space-y-3.5">
              {stats.map((item) => {
                const isCorrect = item.isCorrect;
                return (
                  <div
                    key={item.optionId}
                    className={`relative overflow-hidden rounded-2xl border-2 transition-all p-4 ${isCorrect ? 'border-emerald-500 bg-emerald-950/30 shadow-lg shadow-emerald-500/10' : 'border-slate-800 bg-slate-950/60'}`}
                  >
                    {/* Animated Percentage Fill Bar */}
                    <div
                      className={`absolute top-0 bottom-0 left-0 transition-all duration-1000 ease-out opacity-25 ${isCorrect ? 'bg-emerald-500' : 'bg-slate-600'}`}
                      style={{ width: `${item.percentage}%` }}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className={`w-8 h-8 rounded-lg font-black font-mono flex items-center justify-center shrink-0 text-sm ${isCorrect ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-800 text-slate-300'}`}
                        >
                          {item.optionId}
                        </span>
                        <span
                          className={`text-sm md:text-base font-bold truncate ${isCorrect ? 'text-emerald-300 font-extrabold' : 'text-slate-200'}`}
                        >
                          {item.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : null}
                        <div className="text-right">
                          <span className="font-mono text-base font-black text-white">
                            {item.percentage}%
                          </span>
                          <div className="text-[11px] text-slate-400">
                            {item.count} vote{item.count !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Correct Answer Explanation Box */}
          <div className="bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border-2 border-emerald-500/40 rounded-3xl p-6 shadow-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider">
              <Lightbulb className="w-4 h-4" />
              <span>Why This is the Professional B2B Choice</span>
            </div>
            <p className="text-base text-slate-100 font-medium leading-relaxed">
              {question.explanation}
            </p>
          </div>
        </div>

        {/* Right Column: Facilitator Debrief Section (Discussion prompts, learning objectives) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-gradient-to-b from-orange-950/20 via-slate-900 to-slate-950 border-2 border-orange-500/30 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                <h3 className="text-lg font-black text-white font-display">
                  Facilitator Debrief Guide
                </h3>
              </div>
              <Badge variant="orange" size="sm">
                HOST ONLY
              </Badge>
            </div>

            {/* Core Learning Objective */}
            <div className="space-y-1.5 bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
              <div className="flex items-center gap-2 text-xs font-extrabold text-orange-400 uppercase tracking-wider">
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Core Behavioral Takeaway</span>
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {question.learningObjective}
              </p>
            </div>

            {/* Discussion Prompts */}
            {question.discussionQuestion && (
              <div className="space-y-2 bg-blue-950/30 rounded-2xl p-4 border border-blue-500/30">
                <div className="flex items-center gap-2 text-xs font-extrabold text-blue-400 uppercase tracking-wider">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Discussion Question for the Room</span>
                </div>
                <p className="text-base font-bold text-white leading-snug">
                  "{question.discussionQuestion}"
                </p>
                <div className="text-xs text-slate-400 pt-1">
                  💡 Facilitation Tip: Call on 1-2 participants who picked different options to explain their rationale before revealing the corporate perspective.
                </div>
              </div>
            )}

            {/* Facilitator Extra Tips if any */}
            {question.facilitatorTips && (
              <div className="space-y-1.5 bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Pro Facilitation Note</span>
                </div>
                <p className="text-xs text-slate-300">
                  {question.facilitatorTips}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
