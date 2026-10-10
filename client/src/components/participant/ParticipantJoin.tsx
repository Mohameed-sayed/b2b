import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { sound } from '../../utils/audio';
import { User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface ParticipantJoinProps {
  initialCode?: string;
  onJoin: (code: string, name: string, avatar: string) => void;
  isLoading?: boolean;
  errorMessage?: string;
}

const avatars = ['🚀', '💻', '⚡', '🦁', '🤖', '🦄', '🧠', '🎯', '🦅', '🔥', '👑', '👾'];

export const ParticipantJoin: React.FC<ParticipantJoinProps> = ({
  initialCode = '',
  onJoin,
  isLoading = false,
  errorMessage,
}) => {
  const [code, setCode] = useState<string>(initialCode.toUpperCase());
  const [name, setName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(avatars[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    sound.playPop();
    onJoin(code.trim().toUpperCase(), name.trim(), selectedAvatar);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center px-4 py-8 w-full max-w-7xl mx-auto">
      {/* Brand Header */}
      <div className="text-center mb-6 space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-accent to-brand-accent text-3xl shadow-xl shadow-brand-accent/20 font-black mb-2 animate-bounce-short">
          {selectedAvatar}
        </div>
        <h1 className="text-2xl font-black text-brand-dark font-display tracking-tight">
          iSchool B2B Onboarding
        </h1>
        <p className="text-xs text-brand-secondary">
          Enter your name and join the live interactive workshop session
        </p>
      </div>

      {/* Join Form Card */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-brand-white border-2 border-slate-200 p-6 shadow-2xl space-y-5 backdrop-blur-md"
      >
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-600/20 border border-red-600/40 text-rose-300 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}

        {/* Room Code */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
            Room Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. B2B7X"
            maxLength={8}
            required
            className="w-full rounded-2xl bg-brand-light border-2 border-slate-200 px-4 py-3 text-center text-xl font-mono font-black text-orange-400 placeholder:text-slate-400 focus:border-brand-accent focus:outline-none tracking-widest uppercase transition-all"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-1.5">
            Your Name / Nickname
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Tohamy or ToT"
            maxLength={25}
            required
            className="w-full rounded-2xl bg-brand-light border-2 border-slate-200 px-4 py-3 text-brand-dark font-bold placeholder:text-slate-400 focus:border-brand-accent focus:outline-none text-base transition-all"
          />
        </div>

        {/* Avatar Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-2">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-6 md:grid-cols-12 gap-2 md:gap-3">
            {avatars.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  sound.playPop();
                  setSelectedAvatar(emoji);
                }}
                className={`w-11 h-11 text-xl rounded-xl border flex items-center justify-center transition-all ${selectedAvatar === emoji ? 'border-brand-accent bg-brand-accent/20 scale-110 shadow-md' : 'border-slate-200 bg-brand-light hover:bg-slate-100'}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>


        {/* Join Submit Button */}
        <Button
          type="submit"
          variant="orange"
          size="lg"
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="right"
          isLoading={isLoading}
          disabled={!code.trim() || !name.trim()}
          className="w-full shadow-xl shadow-brand-accent/25"
        >
          JOIN WORKSHOP
        </Button>

        <div className="text-center pt-1">
          <span className="text-[11px] text-brand-secondary flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
            <span>Instant participation. No app download needed.</span>
          </span>
        </div>
      </form>
    </div>
  );
};

