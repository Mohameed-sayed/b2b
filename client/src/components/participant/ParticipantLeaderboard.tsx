import React from 'react';
import { Participant } from '../../types/game';
import { Trophy, Flame, User, Users } from 'lucide-react';

interface ParticipantLeaderboardProps {
  currentParticipant: Participant;
  allParticipants: Participant[];
}

export const ParticipantLeaderboard: React.FC<ParticipantLeaderboardProps> = ({
  currentParticipant,
  allParticipants,
}) => {
  const sorted = [...allParticipants].sort((a, b) => b.score - a.score);
  const myRank = sorted.findIndex((p) => p.id === currentParticipant.id) + 1;
  const topPlayers = sorted.slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between p-6 max-w-md mx-auto animate-fade-in pb-12">
      {/* Top Brand */}
      <div className="text-center space-y-1">
        <h2 className="text-xl font-black text-white font-display flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Workshop Standings</span>
        </h2>
        <p className="text-xs text-slate-400">Current ranks after this round</p>
      </div>

      {/* Current Player's Highlight Card */}
      <div className="my-4 p-5 rounded-3xl bg-gradient-to-r from-orange-500/20 via-slate-900 to-slate-900 border-2 border-orange-500/50 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-orange-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
            #{myRank > 0 ? myRank : 1}
          </div>
          <div>
            <div className="text-sm font-black text-white flex items-center gap-1.5">
              <span>{currentParticipant.avatar}</span>
              <span>{currentParticipant.name} (YOU)</span>
            </div>
            <div className="text-xs text-slate-400">
              {currentParticipant.team}
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-lg font-black text-orange-400">
            {currentParticipant.score.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">POINTS</div>
        </div>
      </div>

      {/* Top 5 Players List */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 space-y-2.5">
        <div className="text-xs font-black uppercase tracking-wider text-slate-400 px-2 pb-1 border-b border-slate-800 flex items-center justify-between">
          <span>Top Instructors</span>
          <span>Score</span>
        </div>

        {topPlayers.map((p, idx) => {
          const isMe = p.id === currentParticipant.id;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${isMe ? 'bg-orange-500/15 border border-orange-500/30 font-bold' : 'hover:bg-slate-800/50'}`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-6 text-center font-mono text-xs font-black ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-600' : 'text-slate-500'}`}
                >
                  #{idx + 1}
                </span>
                <span className="text-lg">{p.avatar}</span>
                <div>
                  <div className={`text-xs font-bold ${isMe ? 'text-orange-300' : 'text-slate-200'}`}>
                    {p.name} {isMe ? '⭐' : ''}
                  </div>
                  <div className="text-[10px] text-slate-500">{p.team}</div>
                </div>
              </div>

              <div className="font-mono text-xs font-black text-slate-200">
                {p.score.toLocaleString()} pts
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-4">
        <span className="text-[11px] text-slate-500">
          Get ready for the next round!
        </span>
      </div>
    </div>
  );
};
