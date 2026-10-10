import React, { useState } from 'react';
import { Participant } from '../../types/game';

const TEAMS = [
  { id: 'Team Alpha', badge: '🦁', color: 'bg-amber-50 border-amber-300' },
  { id: 'Team Beta', badge: '🦅', color: 'bg-blue-50 border-blue-300' },
  { id: 'Team Gamma', badge: '🐺', color: 'bg-emerald-50 border-emerald-300' },
  { id: 'Team Delta', badge: '🐉', color: 'bg-purple-50 border-purple-300' },
];

interface TeamBoardProps {
  participants: Participant[];
  teamCount: number;
  onMove: (participantId: string, team: string) => void;
}

// Drag a player card onto a team column to move them.
export const TeamBoard: React.FC<TeamBoardProps> = ({ participants, teamCount, onMove }) => {
  const [over, setOver] = useState<string | null>(null);
  const teams = TEAMS.slice(0, teamCount);
  const orphans = participants.filter((p) => !teams.some((t) => t.id === p.team));

  const column = (id: string, title: string, color: string, members: Participant[], droppable: boolean) => (
    <div
      key={id}
      onDragOver={droppable ? (e) => { e.preventDefault(); setOver(id); } : undefined}
      onDragLeave={() => setOver((o) => (o === id ? null : o))}
      onDrop={droppable ? (e) => {
        e.preventDefault();
        setOver(null);
        const pid = e.dataTransfer.getData('text/plain');
        if (pid) onMove(pid, id);
      } : undefined}
      className={`rounded-2xl border-2 p-2 min-h-[120px] transition-colors ${color} ${over === id ? 'ring-2 ring-brand-primary' : ''}`}
    >
      <div className="text-xs font-extrabold mb-2 px-1">{title} · {members.length}</div>
      <div className="space-y-1.5">
        {members.map((p) => (
          <div
            key={p.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-white border border-slate-200 cursor-grab active:cursor-grabbing select-none"
          >
            <span className="text-lg">{p.avatar}</span>
            <span className="text-sm font-bold truncate">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-1">
      {teams.map((t) => column(t.id, `${t.badge} ${t.id}`, t.color, participants.filter((p) => p.team === t.id), true))}
      {orphans.length > 0 && column('_none', 'Unassigned', 'bg-slate-50 border-slate-300', orphans, false)}
    </div>
  );
};
