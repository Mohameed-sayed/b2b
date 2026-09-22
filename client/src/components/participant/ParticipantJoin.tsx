import React, { useState } from 'react';
import { TeamName } from '../../types/game';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { sound } from '../../utils/audio';
import { User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

interface ParticipantJoinProps {
  initialCode?: string;
  onJoin: (code: string, name: string, avatar: string, team: TeamName) => void;
  isLoading?: boolean;
  errorMessage?: string;
}

const avatars = ['🚀', '💻', '⚡', '🦁', '🤖', '🦄', '🧠', '🎯', '🦅', '🔥', '👑', '👾'];
const teams: TeamName[] = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'];

export const ParticipantJoin: React.FC<ParticipantJoinProps> = ({
  initialCode = '',
  onJoin,
  isLoading = false,
  errorMessage,
}) => {
  const [code, setCode] = useState<string>(initialCode.toUpperCase());
  const [name, setName] = useState<string>('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>(avatars[0]);
  const [selectedTeam, setSelectedTeam] = useState<TeamName>(teams[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    sound.playPop();
    onJoin(code.trim().toUpperCase(), name.trim(), selectedAvatar, selectedTeam);
  };

  return (
    <div className="min-h-screen bg-brand-light flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
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
            className="w-full rounded-2xl bg-brand-light border-2 border-slate-200 px-4 py-3 text-center text-xl font-mono font-black text-orange-400 placeholder:text-slate-700 focus:border-brand-accent focus:outline-none tracking-widest uppercase transition-all"
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
            placeholder="e.g. Mostafa or Nour"
            maxLength={25}
            required
            className="w-full rounded-2xl bg-brand-light border-2 border-slate-200 px-4 py-3 text-brand-dark font-bold placeholder:text-slate-700 focus:border-brand-accent focus:outline-none text-base transition-all"
          />
        </div>

        {/* Avatar Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-2">
            Choose Your Avatar
          </label>
          <div className="grid grid-cols-6 gap-2">
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

        {/* Team Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-secondary mb-2">
            Select Your Team
          </label>
          <div className="grid grid-cols-2 gap-2">
            {teams.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  sound.playPop();
                  setSelectedTeam(t);
                }}
                className={`py-2 px-3 text-xs font-bold rounded-xl border text-left transition-all ${selectedTeam === t ? 'border-purple-500 bg-purple-600/20 text-purple-300 shadow-md' : 'border-slate-200 bg-brand-light text-brand-secondary hover:bg-slate-100'}`}
              >
                {t}
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

