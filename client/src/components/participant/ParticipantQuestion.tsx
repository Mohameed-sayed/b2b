import React, { useState } from 'react';
import { Question } from '../../types/game';
import { TimerBar } from '../common/TimerBar';
import { Badge } from '../common/Badge';
import { ScenarioCard } from '../common/ScenarioCard';
import { Button } from '../common/Button';
import { sound } from '../../utils/audio';
import { Send, ThumbsUp, ThumbsDown } from 'lucide-react';

interface ParticipantQuestionProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  isPaused?: boolean;
  onSubmitAnswer: (answerId: string) => void;
  onSubmitReflection?: (text: string) => void;
}

const mcOptionColors = [
  { bg: 'bg-brand-white border-slate-200 active:bg-slate-50 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
  { bg: 'bg-brand-white border-slate-200 active:bg-slate-50 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
  { bg: 'bg-brand-white border-slate-200 active:bg-slate-50 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
  { bg: 'bg-brand-white border-slate-200 active:bg-slate-50 text-slate-500', badge: 'bg-slate-100 text-slate-500' },
];

export const ParticipantQuestion: React.FC<ParticipantQuestionProps> = ({
  question,
  questionIndex,
  totalQuestions,
  timeRemaining,
  isPaused,
  onSubmitAnswer,
  onSubmitReflection,
}) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [reflectionText, setReflectionText] = useState<string>('');

  // server rejects answers once time is up or the game is paused
  const locked = timeRemaining <= 0 || !!isPaused;

  const handleSelectOption = (optionId: string) => {
    if (locked) return;
    sound.playPop();
    setSelectedOption(optionId);
    onSubmitAnswer(optionId);
  };

  const handleReflectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionText.trim()) return;
    sound.playPop();
    if (onSubmitReflection) {
      onSubmitReflection(reflectionText.trim());
    } else {
      onSubmitAnswer(reflectionText.trim());
    }
  };

  const handleSelectSuggestion = (text: string) => {
    sound.playPop();
    setReflectionText(text);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto animate-fade-in pb-28">
      {/* Top Header: Question Index, Badges, and Countdown */}
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
        </div>

        {/* Dynamic Countdown Timer */}
        <div className="mt-4">
          <TimerBar
            timeRemaining={timeRemaining}
            totalTime={question.timeLimit}
            isPaused={isPaused}
          />
          {locked && question.type !== 'reflection' && (
            <p role="status" className="mt-3 text-center text-sm font-bold text-red-600">
              {isPaused ? 'Paused: answers open again when the host resumes.' : "Time's up! Waiting for the host to reveal."}
            </p>
          )}
        </div>
      </div>

      {/* Main Question Content Area matching Host Screen Spacing */}
      <div className="my-6 space-y-6">
        {/* Title */}
        <h2 className="text-2xl md:text-4xl font-black text-brand-dark tracking-tight font-display">
          {question.title}
        </h2>

        {/* 1. WHATSAPP COURT QUESTION TYPE */}
        {question.type === 'voting' ? (
          <div className="space-y-6">
            <ScenarioCard scenario={question.scenario} blocks={question.blocks} type={question.type} />

            {/* Verdict Prompt */}
            <div className="text-center text-sm font-black uppercase tracking-wider text-brand-dark">
              Judge this message: Is it professional?
            </div>

            {/* Big YES / NO Verdict Buttons */}
            <div className={`grid ${question.options.length <= 2 && question.options.some(o => o.id === 'YES' || o.id === 'NO') ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-4 pt-2`}>
              {question.options.map((opt) => {
                const isYes = opt.id === 'YES';
                const isNo = opt.id === 'NO';
                
                if (isYes || isNo) {
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectOption(opt.id)}
                      className={`py-5 px-4 rounded-2xl font-black text-base flex flex-col items-center justify-center gap-2 shadow-xl border transition-all active:scale-95 text-white ${
                        isYes 
                          ? 'bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-green-600 hover:to-emerald-600 shadow-emerald-600/25 border-emerald-400/40' 
                          : 'bg-gradient-to-b from-rose-600 to-rose-700 hover:from-red-600 hover:to-rose-600 shadow-rose-600/25 border-rose-400/40'
                      }`}
                    >
                      {isYes ? <ThumbsUp className="w-7 h-7" /> : <ThumbsDown className="w-7 h-7" />}
                      <span className="tracking-wide">{opt.text}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className="p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] hover:border-brand-accent/50 flex items-start gap-4 bg-brand-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm"
                  >
                    <span className="w-10 h-10 rounded-xl font-black font-mono flex items-center justify-center shrink-0 text-base shadow-md bg-slate-100 text-slate-600">
                      {opt.id}
                    </span>
                    <span className="text-base md:text-lg font-bold text-brand-dark leading-snug mt-1.5 flex-1">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : question.type === 'categorization' ? (
          /* 2. TRIAGE QUESTION TYPE */
          <div className="space-y-6">
            <ScenarioCard scenario={question.scenario} blocks={question.blocks} type={question.type} />

            <div className="text-center text-sm font-black uppercase tracking-wider text-brand-secondary">
              Select the appropriate triage action:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handleSelectOption('OWN')}
                className="w-full py-5 px-5 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 active:scale-95 border-2 border-green-600/50 text-emerald-300 font-black text-lg flex items-center justify-between shadow-xl shadow-green-600/10 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🟢</span>
                  <span>OWN IT</span>
                </span>
                <span className="text-xs text-emerald-400 font-normal">Personal responsibility</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('SUPPORT')}
                className="w-full py-5 px-5 rounded-2xl bg-amber-950/40 hover:bg-amber-950/70 active:scale-95 border-2 border-brand-accent/50 text-amber-300 font-black text-lg flex items-center justify-between shadow-xl shadow-brand-accent/10 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🟡</span>
                  <span>SUPPORT IT</span>
                </span>
                <span className="text-xs text-amber-400 font-normal">Help a colleague</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('ESCALATE')}
                className="w-full py-5 px-5 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 active:scale-95 border-2 border-red-600/50 text-rose-300 font-black text-lg flex items-center justify-between shadow-xl shadow-red-600/10 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="text-2xl">🔴</span>
                  <span>ESCALATE IT</span>
                </span>
                <span className="text-xs text-rose-400 font-normal">Inform leadership</span>
              </button>
            </div>
          </div>
        ) : question.type === 'reflection' ? (
          /* 3. REFLECTION QUESTION TYPE */
          <form onSubmit={handleReflectionSubmit} className="space-y-6">
            <ScenarioCard scenario={question.scenario} blocks={question.blocks} type={question.type} />

            {/* Quick Suggestion Chips */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-2">
                Quick commitments (tap to select):
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  'I will always acknowledge tickets within 15 minutes',
                  'I will test every lab environment 30 minutes before session start',
                  'I will proactively post Slack updates when a parent reaches out',
                  'I will never cancel a live class without lead approval',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleSelectSuggestion(chip)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-brand-white text-slate-700 hover:border-brand-accent hover:text-brand-accent transition-all"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                Your Commitment Pledge
              </label>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="In one clear sentence, what will you do differently starting tomorrow?"
                rows={3}
                required
                className="w-full rounded-2xl bg-brand-white border-2 border-slate-300/80 p-4 text-sm md:text-base text-brand-dark placeholder:text-slate-400 focus:border-brand-accent focus:outline-none shadow-sm"
              />
            </div>

            <Button
              type="submit"
              variant="orange"
              size="xl"
              icon={<Send className="w-5 h-5" />}
              iconPosition="right"
              disabled={!reflectionText.trim()}
              className="w-full shadow-xl shadow-brand-accent/25"
            >
              PLEDGE COMMITMENT 🚀
            </Button>
          </form>
        ) : (
          /* 4. STANDARD MULTIPLE CHOICE & SLACK SCENARIO */
          <div className="space-y-6">
            <ScenarioCard scenario={question.scenario} blocks={question.blocks} type={question.type} />

            {/* Question Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {question.options.map((opt, idx) => {
                const style = mcOptionColors[idx % mcOptionColors.length];
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-5 rounded-2xl border-2 text-left transition-all active:scale-[0.98] hover:border-brand-accent/50 flex items-start gap-4 ${style.bg} ${isSelected ? 'ring-2 ring-brand-accent border-brand-accent scale-[1.01] shadow-xl' : 'shadow-sm hover:shadow-md'}`}
                  >
                    <span
                      className={`w-10 h-10 rounded-xl font-black font-mono flex items-center justify-center shrink-0 text-base shadow-md ${style.badge}`}
                    >
                      {opt.id}
                    </span>
                    <span className="text-base md:text-lg font-bold text-brand-dark leading-snug mt-1.5 flex-1">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-4">
        <span className="text-xs text-brand-secondary font-medium">
          Select carefully · Answer cannot be modified once submitted
        </span>
      </div>
    </div>
  );
};

