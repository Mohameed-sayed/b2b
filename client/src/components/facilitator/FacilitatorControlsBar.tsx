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
  Power,
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
  onEndWorkshop?: () => void;
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
  onEndWorkshop,
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
    <footer className="fixed bottom-0 left-0 right-0 z-40 bg-brand-light/95 backdrop-blur-md border-t border-slate-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Room Info & Quick Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-brand-white border border-slate-300/80 px-3 py-1.5 rounded-xl font-mono text-xs font-bold text-brand-dark">
            <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" />
            <span>ROOM:</span>
            <span className="text-orange-400 font-black text-sm">{roomCode}</span>
          </div>

          <button
            onClick={onTogglePause}
            className={`p-2.5 rounded-xl border transition-all ${isPaused ? 'bg-brand-accent/20 border-brand-accent/40 text-amber-400' : 'bg-brand-white border-slate-300 text-brand-dark hover:text-brand-dark hover:bg-slate-100'}`}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-current" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              sound.toggleMute();
              onToggleSound();
            }}
            className={`p-2.5 rounded-xl border transition-all ${isMuted ? 'bg-red-600/20 border-red-600/40 text-rose-400' : 'bg-brand-white border-slate-300 text-brand-dark hover:text-brand-dark hover:bg-slate-100'}`}
            title={isMuted ? 'Unmute Sound FX' : 'Mute Sound FX'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onToggleTeamMode}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${teamMode ? 'bg-purple-600/20 border-purple-500/40 text-purple-300' : 'bg-brand-white border-slate-300 text-brand-secondary hover:text-brand-dark hover:bg-slate-100'}`}
            title="Toggle Individual vs Team scoring mode"
          >
            {teamMode ? <Users className="w-4 h-4 text-purple-400" /> : <User className="w-4 h-4 text-brand-secondary" />}
            <span className="hidden sm:inline">{teamMode ? 'TEAM MODE' : 'INDIVIDUAL'}</span>
          </button>

          <button
            onClick={onOpenPointsModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-brand-white text-brand-dark hover:text-brand-dark hover:bg-slate-100 text-xs font-bold transition-all"
            title="Adjust Points"
          >
            <Sliders className="w-4 h-4 text-orange-400" />
            <span className="hidden sm:inline">ADJUST PTS</span>
          </button>
        </div>

        {/* Center/Right: Primary Action Buttons based on current state */}
        <div className="flex items-center gap-3">
          {(status === 'question' || status === 'escape-room' || (status as string) === 'question_active') && onRevealAnswer && (
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

          {(status === 'revealing' || (status as string) === 'answer_revealed' || (status as string) === 'debrief') && onShowLeaderboard && (
            <Button
              variant="primary"
              size="md"
              icon={<Trophy className="w-4 h-4" />}
              onClick={onShowLeaderboard}
            >
              SHOW LEADERBOARD
            </Button>
          )}

          {(status === 'leaderboard' || (status as string) === 'completed') && onNextQuestion && (
            <Button
              variant="orange"
              size="md"
              icon={<ChevronRight className="w-4 h-4" />}
              iconPosition="right"
              onClick={onNextQuestion}
            >
              {isLastQuestion ? 'BACK TO LOBBY' : 'NEXT QUESTION'}
            </Button>
          )}

          {/* End Workshop Session Button */}
          {onEndWorkshop && (
            <button
              onClick={onEndWorkshop}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 text-xs font-bold transition-all shadow-sm"
              title="End Workshop and clear session"
            >
              <Power className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden md:inline">END SESSION</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-slate-300 bg-brand-white text-brand-dark hover:text-brand-dark hover:bg-slate-100 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </footer>
  );
};

