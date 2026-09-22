import React, { useState } from 'react';
import { Question } from '../../types/game';
import { TimerBar } from '../common/TimerBar';
import { Button } from '../common/Button';
import { sound } from '../../utils/audio';
import { Check, Send, CheckCheck, ThumbsUp, ThumbsDown } from 'lucide-react';

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
  { bg: 'bg-red-600/15 border-red-600/50 active:bg-red-600/30 text-rose-300', badge: 'bg-red-600 text-brand-dark' },
  { bg: 'bg-brand-primary/15 border-brand-primary/50 active:bg-brand-primary/30 text-blue-300', badge: 'bg-brand-primary text-brand-dark' },
  { bg: 'bg-brand-accent/15 border-brand-accent/50 active:bg-brand-accent/30 text-amber-300', badge: 'bg-brand-accent text-brand-dark' },
  { bg: 'bg-green-600/15 border-green-600/50 active:bg-green-600/30 text-emerald-300', badge: 'bg-green-600 text-brand-dark' },
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

  const handleSelectOption = (optionId: string) => {
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
    <div className="min-h-screen bg-brand-light flex flex-col justify-between p-4 md:p-6 max-w-md mx-auto animate-fade-in pb-12">
      {/* Top Header: Question Index & Countdown */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <span className="font-mono text-xs font-black text-orange-400">
            QUESTION {questionIndex + 1} OF {totalQuestions}
          </span>
          <span className="text-xs font-bold text-brand-secondary">
            +{question.points} PTS
          </span>
        </div>

        <div className="mt-3">
          <TimerBar
            timeRemaining={timeRemaining}
            totalTime={question.timeLimit}
            isPaused={isPaused}
          />
        </div>
      </div>

      {/* Main Question Content Area */}
      <div className="my-auto py-4 space-y-4">
        {/* Title */}
        <h2 className="text-lg md:text-xl font-black text-brand-dark font-display text-center leading-snug">
          {question.title}
        </h2>

        {/* 1. WHATSAPP COURT QUESTION TYPE */}
        {question.type === 'voting' ? (
          <div className="space-y-4">
            {/* Realistic WhatsApp Chat Box Mockup */}
            <div className="rounded-2xl bg-[#efeae2] border border-slate-200 overflow-hidden shadow-xl">
              {/* WhatsApp Header */}
              <div className="bg-[#008069] px-3 py-2.5 flex items-center gap-2.5 shadow-sm relative z-10">
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-700">
                  M
                </div>
                <div>
                  <div className="text-xs font-bold text-white leading-none">
                    iSchool B2B Coordinator
                  </div>
                  <div className="text-[10px] text-emerald-100 mt-0.5">online</div>
                </div>
              </div>

              {/* Chat Canvas with Wallpaper look */}
              <div className="p-3.5 space-y-3 bg-[#efeae2] text-xs">
                {/* Incoming Message Bubble */}
                <div className="bg-white text-slate-800 p-2.5 rounded-2xl rounded-tl-none max-w-[85%] shadow-sm space-y-1 relative">
                  <p className="whitespace-pre-line text-xs">
                    {question.scenario.split('\n\n')[0] || question.scenario}
                  </p>
                  <div className="text-[10px] text-slate-400 text-right">
                    8:00 PM
                  </div>
                </div>

                {/* Outgoing Message Bubble */}
                {question.scenario.includes('\n\n') && (
                  <div className="ml-auto bg-[#d9fdd3] text-slate-800 p-2.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm space-y-1 relative">
                    <p className="whitespace-pre-line text-xs font-medium">
                      {question.scenario.split('\n\n')[1]}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                      <span>11:30 PM</span>
                      <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Verdict Prompt */}
            <div className="text-center text-xs font-black uppercase tracking-wider text-brand-dark">
              Judge this message: Is it professional?
            </div>

            {/* Big YES / NO Verdict Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSelectOption('YES')}
                className="py-4 px-3 rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 hover:from-green-600 hover:to-emerald-600 active:scale-95 text-brand-dark font-black text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20 border border-emerald-400/30 transition-all"
              >
                <ThumbsUp className="w-6 h-6" />
                <span>PROFESSIONAL</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('NO')}
                className="py-4 px-3 rounded-2xl bg-gradient-to-b from-rose-600 to-rose-700 hover:from-red-600 hover:to-rose-600 active:scale-95 text-brand-dark font-black text-sm flex flex-col items-center justify-center gap-1.5 shadow-lg shadow-rose-600/20 border border-rose-400/30 transition-all"
              >
                <ThumbsDown className="w-6 h-6" />
                <span>UNPROFESSIONAL</span>
              </button>
            </div>
          </div>
        ) : question.type === 'categorization' ? (
          /* 2. TRIAGE QUESTION TYPE (OWN IT, SUPPORT IT, ESCALATE IT) */
          <div className="space-y-4">
            {/* Scenario snippet */}
            <div className="p-4 rounded-2xl bg-brand-white border border-slate-200 text-sm text-brand-dark font-medium leading-relaxed">
              {question.scenario}
            </div>

            <div className="text-center text-xs font-black uppercase tracking-wider text-brand-secondary">
              Select the appropriate triage action:
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSelectOption('OWN')}
                className="w-full py-4 px-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-950/70 active:scale-95 border-2 border-green-600/50 text-emerald-300 font-black text-base flex items-center justify-between shadow-lg shadow-green-600/10 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">🟢</span>
                  <span>OWN IT</span>
                </span>
                <span className="text-xs text-emerald-400 font-normal">Personal responsibility</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('SUPPORT')}
                className="w-full py-4 px-4 rounded-2xl bg-amber-950/40 hover:bg-amber-950/70 active:scale-95 border-2 border-brand-accent/50 text-amber-300 font-black text-base flex items-center justify-between shadow-lg shadow-brand-accent/10 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">🟡</span>
                  <span>SUPPORT IT</span>
                </span>
                <span className="text-xs text-amber-400 font-normal">Help a colleague</span>
              </button>

              <button
                type="button"
                onClick={() => handleSelectOption('ESCALATE')}
                className="w-full py-4 px-4 rounded-2xl bg-rose-950/40 hover:bg-rose-950/70 active:scale-95 border-2 border-red-600/50 text-rose-300 font-black text-base flex items-center justify-between shadow-lg shadow-red-600/10 transition-all"
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">🔴</span>
                  <span>ESCALATE IT</span>
                </span>
                <span className="text-xs text-rose-400 font-normal">Inform leadership</span>
              </button>
            </div>
          </div>
        ) : question.type === 'reflection' ? (
          /* 3. REFLECTION QUESTION TYPE */
          <form onSubmit={handleReflectionSubmit} className="space-y-4">
            <div className="p-4 rounded-2xl bg-brand-white border border-slate-200 text-xs text-brand-dark">
              {question.scenario}
            </div>

            {/* Quick Suggestion Chips */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                Quick Commitments (Tap to use)
              </label>
              <div className="flex flex-col gap-2">
                {[
                  "I will clarify requirements and constraints before committing blindly.",
                  "I will own mistakes early instead of hiding them.",
                  "I will stay calm and switch to Plan B when classroom tech fails.",
                  "I will communicate prompt ETAs instead of ghosting messages."
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSuggestion(chip)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-brand-white hover:bg-slate-850 text-left text-xs font-semibold text-brand-dark hover:text-brand-dark transition-colors"
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Input */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
                Or write your own commitment:
              </label>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="In one clear sentence, what will you do differently starting tomorrow?"
                rows={3}
                required
                className="w-full rounded-xl bg-brand-light border border-slate-300 p-3 text-xs text-brand-dark placeholder:text-slate-600 focus:border-brand-accent focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="orange"
              size="lg"
              icon={<Send className="w-4 h-4" />}
              iconPosition="right"
              disabled={!reflectionText.trim()}
              className="w-full"
            >
              PLEDGE COMMITMENT 🚀
            </Button>
          </form>
        ) : (
          /* 4. STANDARD MULTIPLE CHOICE / RAPID RESPONSE */
          <div className="space-y-4">
            {/* Scenario snippet */}
            <div className="p-4 rounded-2xl bg-brand-white border border-slate-200 text-xs md:text-sm text-brand-dark font-medium leading-relaxed max-h-36 overflow-y-auto">
              {question.scenario}
            </div>

            {/* Options */}
            <div className="grid grid-cols-1 gap-2.5">
              {question.options.map((opt, idx) => {
                const style = mcOptionColors[idx % mcOptionColors.length];
                const isSelected = selectedOption === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectOption(opt.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all active:scale-98 flex items-start gap-3 ${style.bg} ${isSelected ? 'ring-2 ring-brand-accent scale-[1.02]' : ''}`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl font-black font-mono flex items-center justify-center shrink-0 text-xs shadow ${style.badge}`}
                    >
                      {opt.id}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-brand-dark mt-1 leading-snug flex-1">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="text-center pt-2">
        <span className="text-[10px] text-brand-secondary">
          Select carefully · Answer cannot be modified once submitted
        </span>
      </div>
    </div>
  );
};

