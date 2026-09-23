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
  { bg: 'bg-brand-white border-slate-200 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
  { bg: 'bg-brand-white border-slate-200 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
  { bg: 'bg-brand-white border-slate-200 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
  { bg: 'bg-brand-white border-slate-200 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
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
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
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
          <div className="flex items-center gap-3 bg-brand-white px-4 py-2 rounded-2xl border border-slate-200">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-bold text-brand-dark">
              ANSWERS: <span className="text-brand-dark text-sm font-mono">{answeredCount}</span> / {totalParticipants}
            </span>
            <div className="w-24 h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-primary to-emerald-400 transition-all duration-300"
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
        <h2 className="text-2xl md:text-4xl font-black text-brand-dark tracking-tight font-display">
          {question.title}
        </h2>

        {/* Scenario Card */}
        {question.type === 'slack-scenario' ? (
          <div className="rounded-3xl bg-[#1a1d21] border border-[#35373b] overflow-hidden shadow-2xl mb-8">
            <div className="bg-[#1a1d21] px-6 py-4 border-b border-[#35373b] flex items-center gap-3">
              <span className="text-slate-400 font-bold text-xl">#</span>
              <span className="text-slate-200 font-bold text-lg tracking-wide">b2b-support</span>
            </div>
            <div className="p-6 md:p-8 space-y-6 bg-[#1a1d21] text-base max-h-96 overflow-y-auto">
              {question.scenario.split(/\\n\\n|\n\n/).map((msg, i) => {
                const isTutor = msg.startsWith('Tutor:');
                const content = msg.replace(/^(Mentor|Tutor):\s*/, '').replace(/\\n/g, '\n').replace(/â€”/g, '—').replace(/â€™/g, "'").replace(/\uFFFD/g, '—');
                const sender = isTutor ? 'Ahmed' : 'Mentor';
                const time = `10:${12 + i} AM`; 
                return (
                  <div key={i} className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded flex items-center justify-center text-xl font-bold text-white ${isTutor ? 'bg-blue-600' : 'bg-emerald-700'}`}>
                      {sender[0]}
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <div className="flex items-baseline gap-3">
                        <span className="font-bold text-slate-200 text-lg">{sender}</span>
                        <span className="text-xs text-slate-500">{time}</span>
                      </div>
                      <div className="text-slate-300 leading-relaxed whitespace-pre-wrap break-words">{content}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 rounded-3xl bg-brand-white border-2 border-slate-300/60 shadow-2xl text-brand-dark text-lg md:text-xl font-medium leading-relaxed whitespace-pre-line mb-8">
            {question.scenario}
          </div>
        )}

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
                <span className="text-base md:text-lg font-bold text-brand-dark leading-snug mt-1.5">
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

