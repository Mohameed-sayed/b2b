import React, { useState, useEffect } from 'react';
import { Participant } from '../../types/game';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { firePodiumConfetti } from '../../utils/confetti';
import { sound } from '../../utils/audio';
import {
  Trophy,
  Users,
  User,
  Flame,
  ChevronRight,
  Medal,
  Award,
  Sparkles,
} from 'lucide-react';

interface LeaderboardViewProps {
  participants: Participant[];
  teamMode: boolean;
  isLastQuestion: boolean;
  onNextQuestion: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  participants,
  teamMode: initialTeamMode,
  isLastQuestion,
  onNextQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'individual' | 'teams'>(
    initialTeamMode ? 'teams' : 'individual'
  );

  useEffect(() => {
    sound.playCelebration();
    firePodiumConfetti();
  }, []);

  // Sorted participants
  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);
  const top1 = sortedParticipants[0];
  const top2 = sortedParticipants[1];
  const top3 = sortedParticipants[2];
  const restParticipants = sortedParticipants.slice(3);

  // Group and sort teams
  const teamScores: Record<string, { totalScore: number; count: number }> = {};
  participants.forEach((p) => {
    if (!teamScores[p.team]) {
      teamScores[p.team] = { totalScore: 0, count: 0 };
    }
    teamScores[p.team].totalScore += p.score;
    teamScores[p.team].count += 1;
  });

  const sortedTeams = Object.entries(teamScores)
    .map(([teamName, data]) => ({
      name: teamName,
      score: data.totalScore,
      avgScore: data.count > 0 ? Math.round(data.totalScore / data.count) : 0,
      memberCount: data.count,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-accent/20 text-amber-400 flex items-center justify-center font-bold">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-dark font-display flex items-center gap-2">
              Leaderboard & Rankings
              <Sparkles className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-brand-secondary">Real-time workshop scores</p>
          </div>
        </div>

        {/* Tab Switcher & Next Button */}
        <div className="flex items-center gap-4">
          <div className="flex rounded-xl bg-brand-white border border-slate-200 p-1">
            <button
              onClick={() => setActiveTab('individual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'individual' ? 'bg-blue-600 text-brand-dark shadow-md' : 'text-brand-secondary hover:text-brand-dark'}`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Instructors</span>
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'teams' ? 'bg-purple-600 text-brand-dark shadow-md' : 'text-brand-secondary hover:text-brand-dark'}`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Teams</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Individual vs Teams view */}
      {activeTab === 'individual' ? (
        <div className="my-8 space-y-8">
          {/* Top 3 Podium (2nd, 1st, 3rd) */}
          {sortedParticipants.length > 0 ? (
            <div className="flex flex-col md:flex-row items-end justify-center gap-4 md:gap-6 pt-8 pb-4">
              {/* 2nd Place (Silver) */}
              {top2 && (
                <div className="order-2 md:order-1 flex-1 max-w-xs w-full flex flex-col items-center animate-slide-up">
                  <div className="text-3xl mb-2">{top2.avatar}</div>
                  <div className="w-full rounded-2xl bg-brand-white border-2 border-slate-600 p-5 text-center shadow-xl">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-700 text-brand-dark font-black text-sm mb-2 shadow">
                      2
                    </div>
                    <h3 className="text-base font-bold text-brand-dark truncate">{top2.name}</h3>
                    <p className="text-xs text-brand-secondary">{top2.team}</p>
                    <div className="mt-3 font-mono text-xl font-black text-brand-dark">
                      {top2.score.toLocaleString()} <span className="text-xs font-sans text-brand-secondary">pts</span>
                    </div>
                    {top2.streak > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-400 bg-brand-accent/10 px-2 py-0.5 rounded-full border border-brand-accent/20">
                        <Flame className="w-3 h-3 fill-orange-400" />
                        <span>{top2.streak} STREAK</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 1st Place (Gold) - Elevated Stand */}
              {top1 && (
                <div className="order-1 md:order-2 flex-1 max-w-xs w-full flex flex-col items-center animate-slide-up">
                  <div className="text-4xl mb-2 animate-bounce">{top1.avatar}</div>
                  <div className="w-full rounded-3xl bg-brand-white border-2 border-amber-400 p-6 text-center shadow-2xl shadow-brand-accent/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-brand-accent" />
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-tr from-brand-accent to-yellow-300 text-brand-dark font-black text-lg mb-2 shadow-lg">
                      👑 1
                    </div>
                    <h3 className="text-lg font-black text-brand-dark truncate">{top1.name}</h3>
                    <p className="text-xs text-amber-300/80 font-medium">{top1.team}</p>
                    <div className="mt-3 font-mono text-2xl font-black text-amber-300">
                      {top1.score.toLocaleString()} <span className="text-xs font-sans text-amber-400">pts</span>
                    </div>
                    {top1.streak > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-400 bg-brand-accent/20 px-2.5 py-0.5 rounded-full border border-brand-accent/30">
                        <Flame className="w-3.5 h-3.5 fill-orange-400" />
                        <span>{top1.streak} STREAK 🔥</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3rd Place (Bronze) */}
              {top3 && (
                <div className="order-3 md:order-3 flex-1 max-w-xs w-full flex flex-col items-center animate-slide-up">
                  <div className="text-3xl mb-2">{top3.avatar}</div>
                  <div className="w-full rounded-2xl bg-brand-white border-2 border-amber-800/60 p-5 text-center shadow-xl">
                    <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-900/60 text-amber-300 font-black text-sm mb-2 shadow">
                      3
                    </div>
                    <h3 className="text-base font-bold text-brand-dark truncate">{top3.name}</h3>
                    <p className="text-xs text-brand-secondary">{top3.team}</p>
                    <div className="mt-3 font-mono text-xl font-black text-brand-dark">
                      {top3.score.toLocaleString()} <span className="text-xs font-sans text-brand-secondary">pts</span>
                    </div>
                    {top3.streak > 1 && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-orange-400 bg-brand-accent/10 px-2 py-0.5 rounded-full border border-brand-accent/20">
                        <Flame className="w-3 h-3 fill-orange-400" />
                        <span>{top3.streak} STREAK</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-brand-secondary">No participants yet</div>
          )}

          {/* 4th Place and onwards */}
          {restParticipants.length > 0 && (
            <div className="bg-brand-white border border-slate-200 rounded-3xl p-4 max-w-3xl mx-auto">
              <div className="divide-y divide-slate-200">
                {restParticipants.map((p, idx) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-mono text-xs font-bold text-brand-secondary">
                        #{idx + 4}
                      </span>
                      <span className="text-xl">{p.avatar}</span>
                      <div>
                        <div className="text-sm font-bold text-brand-dark">{p.name}</div>
                        <div className="text-[11px] text-brand-secondary">{p.team}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {p.streak > 1 && (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-orange-400">
                          <Flame className="w-3 h-3 fill-orange-400" />
                          <span>{p.streak}</span>
                        </div>
                      )}
                      <div className="font-mono text-sm font-black text-brand-dark">
                        {p.score.toLocaleString()} pts
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Team Standings View */
        <div className="my-8 max-w-3xl mx-auto w-full space-y-4">
          {sortedTeams.map((team, idx) => (
            <div
              key={team.name}
              className={`p-6 rounded-3xl border-2 transition-all flex items-center justify-between gap-4 ${idx === 0 ? 'bg-brand-white border-brand-primary shadow-xl shadow-purple-500/10' : 'bg-brand-white border-slate-200'}`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-10 h-10 rounded-2xl font-black font-mono flex items-center justify-center text-base ${idx === 0 ? 'bg-purple-600 text-brand-dark shadow-lg' : 'bg-slate-100 text-brand-dark'}`}
                >
                  #{idx + 1}
                </span>
                <div>
                  <h3 className="text-lg font-black text-brand-dark">{team.name}</h3>
                  <div className="text-xs text-brand-secondary">
                    {team.memberCount} members · avg {team.avgScore} pts/member
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-mono text-2xl font-black text-purple-400">
                  {team.score.toLocaleString()} <span className="text-xs font-sans text-brand-secondary">pts</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

