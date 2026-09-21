import React, { useState } from 'react';
import { ReflectionSubmission } from '../../types/game';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { fireCelebrationConfetti } from '../../utils/confetti';
import { sound } from '../../utils/audio';
import { Sparkles, Heart, Rocket, Users, Share2, Check } from 'lucide-react';

interface ReflectionWallViewProps {
  reflections: ReflectionSubmission[];
  onEndWorkshop?: () => void;
}

export const ReflectionWallView: React.FC<ReflectionWallViewProps> = ({
  reflections,
  onEndWorkshop,
}) => {
  const [celebrating, setCelebrating] = useState(false);

  const handleLaunchFinale = () => {
    setCelebrating(true);
    sound.playCelebration();
    fireCelebrationConfetti();
    // Continuous confetti burst
    setTimeout(() => fireCelebrationConfetti(), 1200);
    setTimeout(() => fireCelebrationConfetti(), 2400);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 md:p-10 max-w-7xl mx-auto pb-24 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-2xl shadow-lg shadow-orange-500/20 font-black">
            🎯
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white font-display">
                B2B Commitment Wall
              </h1>
              <Badge variant="orange" size="sm">
                FINAL REFLECTION
              </Badge>
            </div>
            <p className="text-xs md:text-sm text-slate-400">
              One specific behavior each instructor commits to practicing starting tomorrow
            </p>
          </div>
        </div>

        {/* Finale Action Button */}
        <div className="flex items-center gap-3">
          <Badge variant="purple" size="md" icon={<Users className="w-4 h-4" />}>
            {reflections.length} Commitments Live
          </Badge>

          <Button
            variant="orange"
            size="lg"
            icon={<Rocket className="w-5 h-5" />}
            onClick={handleLaunchFinale}
            className="shadow-2xl shadow-orange-500/30 hover:scale-105"
          >
            READY. SET. GO. 🚀
          </Button>
        </div>
      </div>

      {/* Main Grid: Live Masonry Wall */}
      <div className="my-8 flex-1">
        {reflections.length === 0 ? (
          <div className="h-96 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-800 p-8 text-center bg-slate-900/40">
            <div className="text-5xl mb-3 animate-bounce">✍️</div>
            <h3 className="text-lg font-bold text-white mb-1">
              Awaiting Instructor Commitments...
            </h3>
            <p className="text-sm text-slate-400 max-w-md">
              Instructors are currently typing their personal behavioral pledges on their phones. Pledges will appear here in real time!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reflections.map((item) => (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-800 hover:border-orange-500/60 transition-all shadow-xl flex flex-col justify-between gap-4 animate-slide-up"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{item.participantAvatar}</span>
                      <div>
                        <div className="text-sm font-bold text-slate-100">
                          {item.participantName}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {item.team}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-orange-400 font-mono font-bold">
                      #B2BReady
                    </span>
                  </div>

                  <p className="text-base font-semibold text-slate-200 leading-relaxed italic">
                    "{item.behaviorText}"
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Pledged live</span>
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500/30" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Celebratory Banner on finale */}
      {celebrating && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-500 text-slate-950 font-black shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-bounce-short">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌟</span>
            <div>
              <h2 className="text-2xl font-black font-display tracking-tight">
                WELCOME TO THE iSCHOOL B2B INSTRUCTOR TEAM!
              </h2>
              <p className="text-sm font-semibold opacity-90">
                You are now prepared to adapt, communicate, own mistakes, and deliver world-class learning experiences!
              </p>
            </div>
          </div>
          {onEndWorkshop && (
            <Button variant="secondary" size="md" onClick={onEndWorkshop}>
              Wrap Up Session
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
