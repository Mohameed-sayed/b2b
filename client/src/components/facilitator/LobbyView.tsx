import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Game, Participant } from '../../types/game';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Users, Play, Copy, Check, Sparkles, BookOpen, Layers, RotateCcw } from 'lucide-react';

interface LobbyViewProps {
  roomCode: string;
  networkIp: string;
  participants: Participant[];
  games: Game[];
  selectedGameId: string;
  teamMode: boolean;
  onSelectGame: (gameId: string) => void;
  onStartGame: () => void;
  onToggleTeamMode: () => void;
  onResetRoom?: () => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  roomCode,
  networkIp,
  participants,
  games,
  selectedGameId,
  teamMode,
  onSelectGame,
  onStartGame,
  onToggleTeamMode,
  onResetRoom,
}) => {
  const [copied, setCopied] = useState(false);

  // Construct join URL
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  let joinUrl: string;

  if (isLocal) {
    const port = window.location.port ? `:${window.location.port}` : '';
    const host = networkIp && !networkIp.startsWith('10.') ? networkIp : window.location.hostname;
    joinUrl = `${window.location.protocol}//${host}${port}/join/${roomCode}`;
  } else {
    // In production, ensure HTTPS domain so iOS Safari, Camera scan, WebSockets & Clipboard work 100%
    if (window.location.hostname === '46.101.213.8') {
      joinUrl = `https://46.101.213.8.sslip.io/join/${roomCode}`;
    } else {
      joinUrl = `${window.location.origin}/join/${roomCode}`;
    }
  }

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(joinUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = joinUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const selectedGame = games.find((g) => g.id === selectedGameId) || games[0];

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto pb-24">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-4">
          <img src="/logo-primary.svg" alt="iSchool Logo" className="h-10 object-contain" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-brand-dark font-display">
                B2B Onboarding
              </h1>
              <Badge variant="orange" size="sm">
                LIVE
              </Badge>
            </div>
            <p className="text-sm text-brand-secondary">
              Interactive Workplace Competencies & Reliability Simulator
            </p>
          </div>
        </div>

        {/* Start Game Action */}
        <div className="flex items-center gap-4">
          <div className="text-right hidden md:block">
            <div className="text-xs font-bold text-brand-secondary uppercase tracking-wider">
              {participants.length} Instructors Joined
            </div>
            <div className="text-xs text-brand-secondary">Ready when you are</div>
          </div>
          <Button
            variant="orange"
            size="xl"
            icon={<Play className="w-6 h-6 fill-current" />}
            onClick={onStartGame}
            disabled={participants.length === 0}
            className="shadow-2xl hover:scale-105 transition-all"
          >
            START GAME
          </Button>
        </div>
      </header>

      {/* Main Content Grid: QR & Join instructions on Left, Players & Game Selector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 my-8 items-start">
        {/* Left Column: QR Code & Room Code Card (Widescreen screen-share anchor) */}
        <div className="lg:col-span-5 flex flex-col items-center bg-brand-white border-2 border-slate-300/80 rounded-3xl p-8 shadow-2xl text-center backdrop-blur-md relative overflow-hidden">
          {/* Subtle decorative glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />

          <Badge variant="primary" size="md" className="mb-4">
            📱 SCAN TO JOIN ON PHONE
          </Badge>

          {/* Real QR Code */}
          <div className="p-4 bg-white rounded-3xl shadow-2xl border-4 border-slate-200 transition-transform duration-300 hover:scale-105">
            <QRCodeSVG
              value={joinUrl}
              size={220}
              level="H"
              includeMargin={false}
            />
          </div>

          {/* Room Code */}
          <div className="mt-6 space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-brand-secondary">
              OR ENTER ROOM CODE:
            </span>
            <div className="text-4xl md:text-5xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-yellow-400 tracking-wider">
              {roomCode}
            </div>
          </div>

          {onResetRoom && (
            <button
              onClick={onResetRoom}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary hover:text-orange-500 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-orange-300 bg-slate-50 hover:bg-orange-50/50 transition-all shadow-sm"
              title="Generate a brand new room code and clear participant list"
            >
              <RotateCcw className="w-3.5 h-3.5 text-orange-500" />
              <span>Reset / New Room</span>
            </button>
          )}

          {/* Join Link & Copy */}
          <div className="mt-6 w-full flex items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-brand-light border border-slate-200 text-xs font-mono text-brand-dark">
            <span className="truncate">{joinUrl}</span>
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-700 text-brand-dark hover:text-brand-dark transition-colors shrink-0"
              title="Copy Join Link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-4 text-xs text-brand-secondary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Zero app installation required. Works on any mobile browser.</span>
          </div>
        </div>

        {/* Right Column: Participant Lobby Grid & Game Selector */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Game Selector Row */}
          <div className="bg-brand-white border border-slate-200 rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-orange-400" />
                <h2 className="text-base font-bold text-brand-dark uppercase tracking-wider">
                  Select Workshop Scenario
                </h2>
              </div>
              <Badge variant="purple" size="sm">
                {games.length} Interactive Modules
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
              {games.map((g) => {
                const isSelected = g.id === selectedGameId;
                return (
                  <button
                    key={g.id}
                    onClick={() => onSelectGame(g.id)}
                    className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2 ${isSelected ? 'border-brand-accent bg-brand-accent/15 shadow-lg shadow-brand-accent/10' : 'border-slate-200 bg-brand-light/60 hover:border-slate-300 hover:bg-slate-850'}`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-xs font-bold text-orange-400 font-mono">
                          {g.category}
                        </span>
                        <span className="text-xs text-brand-secondary">
                          {g.questions.length} Qs
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-brand-dark line-clamp-1">
                        {g.title}
                      </h3>
                      <p className="text-xs text-brand-secondary line-clamp-1 mt-0.5">
                        {g.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Participant Real-Time Lobby Wall */}
          <div className="bg-brand-white border border-slate-200 rounded-3xl p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                <h2 className="text-base font-bold text-brand-dark uppercase tracking-wider">
                  Instructors in Lobby ({participants.length})
                </h2>
              </div>
              <button
                onClick={onToggleTeamMode}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all ${teamMode ? 'bg-purple-600/30 border-purple-500 text-purple-300' : 'bg-slate-100 border-slate-300 text-brand-secondary hover:text-brand-dark'}`}
              >
                {teamMode ? '👥 Team Competition ON' : '👤 Individual Mode'}
              </button>
            </div>

            {participants.length === 0 ? (
              <div className="flex-1 min-h-[160px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200/80 text-center p-6">
                <div className="w-12 h-12 rounded-full bg-slate-100/60 flex items-center justify-center text-xl mb-3 animate-pulse">
                  ⏳
                </div>
                <h4 className="text-sm font-bold text-brand-dark">
                  Waiting for instructors to scan QR code...
                </h4>
                <p className="text-xs text-brand-secondary mt-1 max-w-sm">
                  Show the QR code on your shared screen. As participants enter their name, they will appear here instantly!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-64 overflow-y-auto pr-1">
                {participants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-brand-light/80 border border-slate-200 animate-fade-in"
                  >
                    <span className="text-2xl select-none">{p.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-brand-dark truncate">
                        {p.name}
                      </div>
                      <div className="text-[10px] text-brand-secondary truncate">
                        {p.team}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

