import React from 'react';
import { Button } from '../common/Button';
import { sound } from '../../utils/audio';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Users,
  User,
  Sliders,
  Maximize,
  Minimize,
  ChevronRight,
  Eye,
  Trophy,
} from 'lucide-react';
import { RoomStatus } from '../../types/game';

interface FacilitatorControlsBarProps {
  roomCode: string;
  status: RoomStatus;
  isPaused: boolean;
  teamMode: boolean;
  isMuted: boolean;
  onToggleSound: () => void;
  onTogglePause: () => void;
  onToggleTeamMode: () => void;
  onOpenPointsModal: () => void;
  onRevealAnswer?: () => void;
  onShowLeaderboard?: () => void;
  onNextQuestion?: () => void;
  isLastQuestion?: boolean;
}

export const FacilitatorControlsBar: React.FC<FacilitatorControlsBarProps> = ({
  roomCode,
  status,
  isPaused,
  teamMode,
  isMuted,
  onToggleSound,
  onTogglePause,
  onToggleTeamMode,
  onOpenPointsModal,
  onRevealAnswer,
  onShowLeaderboard,
  onNextQuestion,
  isLastQuestion,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Room Info & Quick Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ROOM:</span>
            <span className="text-orange-400 font-black text-sm">{roomCode}</span>
          </div>

          <button
            onClick={onTogglePause}
            className={`p-2.5 rounded-xl border transition-all ${isPaused ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}`}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.toggleMute();
              onToggleSound();
            }}
            className={`p-2.5 rounded-xl border transition-all ${isMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800'}`}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleTeamMode}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${teamMode ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Toggle Individual vs Team scoring mode"
          >
            {teamMode ? <Users className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-slate-400" />}
            <span className="hidden sm:inline">{teamMode ? 'TEAM MODE' : 'INDIVIDUAL'}</span>
          </button>

          <button
            onClick={onOpenPointsModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-bold transition-all"
            title="Adjust Points"
          >
            <Sliders className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">ADJUST PTS</span>
          </button>
        </div>

        {/* Center/Right: Primary Action Buttons based on current state */}
        <div className="flex items-center gap-3">
          {status === 'question' && onRevealAnswer && (
            <Button
              variant="orange"
              size="md"
              icon={<Eye className="w-4 h-4" />}
              onClick={onRevealAnswer}
              className="animate-bounce-short"
            >
              REVEAL ANSWER
            </Button>
          )}

          {status === 'revealing' && onShowLeaderboard && (
            <Button
              variant="primary"
              size="md"
              icon={<Trophy className="w-4 h-4" />}
              onClick={onShowLeaderboard}
            >
              SHOW LEADERBOARD
            </Button>
          )}

          {status === 'leaderboard' && onNextQuestion && (
            <Button
              variant="orange"
              size="md"
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
              onClick={onNextQuestion}
            >
              {isLastQuestion ? 'FINAL REFLECTIONS 🚀' : 'NEXT QUESTION'}
            </Button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </footer>
  );
};
