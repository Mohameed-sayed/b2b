import React, { useState } from 'react';
import { Participant } from '../../types/game';
import { Button } from '../common/Button';
import { X, Award, Plus, Minus } from 'lucide-react';

interface PointsAdjustModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  teamMode: boolean;
  onAdjustPoints: (targetId: string, isTeam: boolean, delta: number) => void;
}

export const PointsAdjustModal: React.FC<PointsAdjustModalProps> = ({
  isOpen,
  onClose,
  participants,
  teamMode,
  onAdjustPoints
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>('');
  const [isTeamTarget, setIsTeamTarget] = useState<boolean>(teamMode);
  const [pointsInput, setPointsInput] = useState<number>(200);

  if (!isOpen) return null;

  const teams = ['Team Cairo', 'Team Alex', 'Team Giza', 'Team Delta'];

  const handleApply = (delta: number) => {
    if (!selectedTarget) return;
    onAdjustPoints(selectedTarget, isTeamTarget, delta);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Facilitator Points Adjustment</h3>
              <p className="text-xs text-slate-400">Award bonus points for great insights or participation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 py-4">
          {/* Toggle Target Type */}
          <div className="flex rounded-xl bg-slate-800/80 p-1 border border-slate-700/60">
            <button
              onClick={() => { setIsTeamTarget(false); setSelectedTarget(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isTeamTarget ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Individual Participant
            </button>
            <button
              onClick={() => { setIsTeamTarget(true); setSelectedTarget(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isTeamTarget ? 'bg-orange-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              Whole Team
            </button>
          </div>

          {/* Select Target */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select {isTeamTarget ? 'Team' : 'Participant'}
            </label>
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 focus:border-orange-500 focus:outline-none text-sm font-medium"
            >
              <option value="">-- Choose {isTeamTarget ? 'Team' : 'Participant'} --</option>
              {isTeamTarget ? (
                teams.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))
              ) : (
                participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar} {p.name} ({p.team} — {p.score} pts)
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Points Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Preset Amounts
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100, 250, 500, 1000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPointsInput(val)}
                  className={`py-2 text-sm font-bold rounded-lg border transition-all ${pointsInput === val ? 'border-orange-500 bg-orange-500/20 text-orange-400' : 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'}`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Custom Points
            </label>
            <input
              type="number"
              value={pointsInput}
              onChange={(e) => setPointsInput(Math.max(1, parseInt(e.target.value) || 0))}
              className="w-full rounded-xl bg-slate-950 border border-slate-700 px-4 py-2.5 text-slate-100 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t border-slate-800">
          <Button
            variant="danger"
            size="md"
            icon={<Minus className="w-4 h-4" />}
            onClick={() => handleApply(-pointsInput)}
            disabled={!selectedTarget}
            className="flex-1"
          >
            Deduct -{pointsInput}
          </Button>
          <Button
            variant="success"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => handleApply(pointsInput)}
            disabled={!selectedTarget}
            className="flex-1"
          >
            Award +{pointsInput}
          </Button>
        </div>
      </div>
    </div>
  );
};
