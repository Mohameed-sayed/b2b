import React, { useEffect } from 'react';
import { Question, Participant } from '../../types/game';
import { TimerBar } from '../common/TimerBar';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { sound } from '../../utils/audio';
import { Eye, Users, AlertCircle, MessageSquare } from 'lucide-react';

interface QuestionViewProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  isPaused: boolean;
  participants: Participant[];
  answeredCount: number;
  onRevealAnswer: () => void;
}

const optionColors = [
  { bg: 'bg-rose-500/10 border-rose-500/40 text-rose-400', badge: 'bg-rose-500 text-white' },
  { bg: 'bg-blue-500/10 border-blue-500/40 text-blue-400', badge: 'bg-blue-500 text-white' },
  { bg: 'bg-amber-500/10 border-amber-500/40 text-amber-400', badge: 'bg-amber-500 text-slate-900' },
  { bg: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400', badge: 'bg-emerald-500 text-white' },
];

export const QuestionView: React.FC<QuestionViewProps> = ({
  question,
  questionIndex,
  totalQuestions,
  timeRemaining,
  isPaused,
  participants,
  answeredCount,
  onRevealAnswer,
}) => {
  const totalParticipants = participants.length;
  const answeredPercentage = totalParticipants > 0 ? (answeredCount / totalParticipants) * 100 : 0;
  const allAnswered = totalParticipants > 0 && answeredCount >= totalParticipants;

  // Sound effects on countdown
  useEffect(() => {
    if (!isPaused && timeRemaining > 0 && timeRemaining <= 5) {
      sound.playTick(true);
    } else if (!isPaused && timeRemaining > 0 && timeRemaining % 5 === 0) {
      sound.playTick(false);
    }
  }, [timeRemaining, isPaused]);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto pb-24">
      {/* Top Header: Question Index, Type Badge, and Timer Bar */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-extrabold text-orange-400 tracking-wider">
              QUESTION {questionIndex + 1} OF {totalQuestions}
            </span>
            <Badge variant="primary" size="sm">
              {question.type.toUpperCase()}
            </Badge>
            <Badge variant="orange" size="sm">
              +{question.points} PTS
            </Badge>
          </div>

          {/* Live Participant Answer Progress */}
          <div className="flex items-center gap-3 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-800">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-slate-300">
              ANSWERS: <span className="text-white text-sm font-mono">{answeredCount}</span> / {totalParticipants}
            </span>
            <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${answeredPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Countdown Timer */}
        <div className="mt-4">
          <TimerBar
            timeRemaining={timeRemaining}
            totalTime={question.timeLimit}
            isPaused={isPaused}
          />
        </div>
      </div>

      {/* Main Presentation Area: 16:9 centered layout with large bold typography */}
      <div className="my-6 space-y-6">
        {/* Title */}
        <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight font-display">
          {question.title}
        </h2>

        {/* Scenario Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border-2 border-slate-700/60 shadow-2xl text-slate-100 text-lg md:text-xl font-medium leading-relaxed whitespace-pre-line">
          {question.scenario}
        </div>

        {/* Question Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {question.options.map((opt, idx) => {
            const style = optionColors[idx % optionColors.length];
            return (
              <div
                key={opt.id}
                className={`p-5 rounded-2xl border-2 transition-all flex items-start gap-4 ${style.bg}`}
              >
                <span
                  className={`w-10 h-10 rounded-xl font-black font-mono flex items-center justify-center shrink-0 text-base shadow-md ${style.badge}`}
                >
                  {opt.id}
                </span>
                <span className="text-base md:text-lg font-bold text-slate-100 leading-snug mt-1.5">
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
