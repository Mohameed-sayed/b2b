import React, { useState, useEffect } from 'react';
import { Question } from '../../types/game';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { sound } from '../../utils/audio';
import {
  AlertTriangle,
  Clock,
  Unlock,
  Lock,
  Users,
  Eye,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

interface EscapeRoomViewProps {
  question: Question;
  timeRemaining: number;
  isPaused: boolean;
  onRevealAnswer: () => void;
}

const clues = [
  {
    id: 1,
    title: 'CLUE 1: THE SICK CALL',
    content: 'At 8:15 AM, the lead instructor calls in sick with acute food poisoning. The session at Flagship Partner School begins at 9:00 AM sharp (45 mins away).',
    urgency: 'HIGH',
    icon: '🤢',
  },
  {
    id: 2,
    title: 'CLUE 2: STUDENT PROFILE',
    content: 'Class has 24 Grade 6 students eager for Robotics. They are paying premium B2B tuition and parents are watching.',
    urgency: 'MEDIUM',
    icon: '🤖',
  },
  {
    id: 3,
    title: 'CLUE 3: ASSETS LOCKED',
    content: 'School lab has internet, but robotics kits are locked in a steel cabinet. The lab manager is not picking up phone calls.',
    urgency: 'HIGH',
    icon: '🔐',
  },
  {
    id: 4,
    title: 'CLUE 4: YOUR PERSONAL CONSTRAINT',
    content: 'You have a mandatory client kickoff meeting at 10:00 AM that cannot be rescheduled without account penalty.',
    urgency: 'CRITICAL',
    icon: '⏰',
  },
  {
    id: 5,
    title: 'CLUE 5: THE HIDDEN RESOURCE',
    content: 'Teammate Nour is totally free until 11:00 AM, lives only 10 minutes away from the school, and has taught Grade 6 robotics before!',
    urgency: 'OPPORTUNITY',
    icon: '⚡',
  },
];

export const EscapeRoomView: React.FC<EscapeRoomViewProps> = ({
  question,
  timeRemaining,
  isPaused,
  onRevealAnswer,
}) => {
  const [activeClueIndex, setActiveClueIndex] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(1);

  // Progressive unlock helper
  const unlockNextClue = () => {
    if (unlockedCount < clues.length) {
      sound.playPop();
      setUnlockedCount((prev) => prev + 1);
      setActiveClueIndex(unlockedCount);
    }
  };

  const unlockAll = () => {
    sound.playPop();
    setUnlockedCount(clues.length);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Crisis Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-red-600/30 via-orange-600/20 to-slate-900 border-2 border-red-500/50 flex flex-wrap items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center animate-pulse">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-red-400 uppercase tracking-widest">
                CRISIS EMERGENCY SIMULATION
              </span>
              <Badge variant="danger" size="sm">
                GAME 7
              </Badge>
            </div>
            <h2 className="text-xl font-black text-white">
              The 45-Minute Emergency: Operation Salvage
            </h2>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-red-500/40">
          <Clock className="w-5 h-5 text-red-400 animate-spin" />
          <div className="font-mono text-2xl font-black text-red-400">
            {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Progressive Clue Tabs */}
      <div className="my-6">
        <div className="flex items-center justify-between pb-3">
          <div className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Unlock className="w-4 h-4 text-orange-400" />
            <span>
              EMERGENCY BRIEFING DOSSIER ({unlockedCount}/{clues.length} CLUES UNLOCKED)
            </span>
          </div>

          <div className="flex gap-2">
            {unlockedCount < clues.length && (
              <Button variant="secondary" size="sm" onClick={unlockNextClue}>
                Unlock Next Clue (+1)
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={unlockAll}>
              Reveal All Clues
            </Button>
          </div>
        </div>

        {/* Clue Tab Selector */}
        <div className="grid grid-cols-5 gap-2">
          {clues.map((clue, idx) => {
            const isUnlocked = idx < unlockedCount;
            const isActive = idx === activeClueIndex;
            return (
              <button
                key={clue.id}
                onClick={() => isUnlocked && setActiveClueIndex(idx)}
                disabled={!isUnlocked}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[70px] ${!isUnlocked ? 'border-slate-800 bg-slate-950/40 opacity-40 cursor-not-allowed' : isActive ? 'border-orange-500 bg-orange-500/15 shadow-lg shadow-orange-500/10' : 'border-slate-800 bg-slate-900/80 hover:bg-slate-850'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base">{clue.icon}</span>
                  {isUnlocked ? (
                    <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
                <div className="text-[11px] font-bold text-slate-200 truncate mt-1">
                  Clue #{clue.id}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Clue Detail Card */}
      <div className="p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-700 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{clues[activeClueIndex].icon}</span>
            <h3 className="text-xl font-black text-white">
              {clues[activeClueIndex].title}
            </h3>
          </div>
          <Badge
            variant={
              clues[activeClueIndex].urgency === 'CRITICAL'
                ? 'danger'
                : clues[activeClueIndex].urgency === 'OPPORTUNITY'
                ? 'success'
                : 'warning'
            }
            size="sm"
          >
            {clues[activeClueIndex].urgency}
          </Badge>
        </div>

        <p className="text-lg md:text-xl text-slate-100 font-medium leading-relaxed">
          {clues[activeClueIndex].content}
        </p>
      </div>

      {/* Action Options Preview & Facilitator Reveal Button */}
      <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-400 flex items-center gap-2">
          <Users className="w-4 h-4 text-blue-400" />
          <span>Instructors are deliberating with their teams on the best coordinated action!</span>
        </div>

        <Button
          variant="orange"
          size="lg"
          icon={<Eye className="w-5 h-5" />}
          onClick={onRevealAnswer}
        >
          REVEAL OPTIMAL PROTOCOL
        </Button>
      </div>
    </div>
  );
};
