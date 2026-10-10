import React, { useState, useEffect } from 'react';
import { FacilitatorView } from './components/facilitator/FacilitatorView';
import { ParticipantView } from './components/participant/ParticipantView';
import { AdminEditor } from './components/admin/AdminEditor';
import { socketService } from './services/socket';
import { Monitor, Smartphone, Settings, Wifi, WifiOff } from 'lucide-react';
import { LoadingSplash } from './components/common/LoadingSplash';

type AppMode = 'host' | 'participant' | 'admin';

// Resolved synchronously: rendering host mode even for one frame on a /join page
// mounts FacilitatorView, which fires room:create from the player's phone.
function parseRoute(): { mode: AppMode; code: string } {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  // Check if URL has /join/:code or #/join/:code
  const joinMatch = path.match(/\/join\/([a-z0-9]+)/) || hash.match(/#\/join\/([a-z0-9]+)/);
  if (joinMatch) return { mode: 'participant', code: joinMatch[1].toUpperCase() };

  if (path.startsWith('/join') || hash.startsWith('#/join') || path.startsWith('/play') || hash.startsWith('#/play')) {
    return { mode: 'participant', code: '' };
  }
  if (path.startsWith('/admin') || hash.startsWith('#/admin')) return { mode: 'admin', code: '' };
  if (path.startsWith('/host') || hash.startsWith('#/host')) return { mode: 'host', code: '' };

  // On mobile devices, default to participant mode so joining on phones never mounts facilitator host
  const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  // Default to host mode for desktop presentation screens
  return { mode: isMobile ? 'participant' : 'host', code: '' };
}

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(() => parseRoute().mode);
  const [joinCode, setJoinCode] = useState<string>(() => parseRoute().code);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Re-parse on back/forward and hash changes
  useEffect(() => {
    const onRoute = () => {
      const r = parseRoute();
      setMode(r.mode);
      if (r.code) setJoinCode(r.code);
    };

    window.addEventListener('popstate', onRoute);
    window.addEventListener('hashchange', onRoute);

    return () => {
      window.removeEventListener('popstate', onRoute);
      window.removeEventListener('hashchange', onRoute);
    };
  }, []);

  // Monitor socket connection status
  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleDisconnect);
    };
  }, []);

  const switchMode = (newMode: AppMode) => {
    setMode(newMode);
    if (newMode === 'host') {
      window.history.pushState({}, '', '/');
    } else if (newMode === 'participant') {
      window.history.pushState({}, '', joinCode ? `/join/${joinCode}` : '/join');
    } else if (newMode === 'admin') {
      window.history.pushState({}, '', '/admin');
    }
  };

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark selection:bg-brand-accent selection:text-brand-dark">
      {showSplash && <LoadingSplash onComplete={() => setShowSplash(false)} />}
      
      {/* Top Floating App Bar: View Switcher (Only shown on Facilitator & Admin screens) */}
      {mode !== 'participant' && (
        <nav className="fixed top-3 right-4 z-50 flex items-center gap-2 bg-brand-white backdrop-blur-md border border-slate-200 p-1.5 rounded-2xl shadow-2xl text-xs">
          {/* Connection Status indicator */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-[11px] font-bold ${isConnected ? 'text-emerald-400 bg-green-600/10' : 'text-brand-secondary bg-slate-100'}`}
            title={isConnected ? 'Connected to live workshop server' : 'Running in local preview mode'}
          >
            {isConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">LIVE SYNC</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="hidden sm:inline">PREVIEW</span>
              </>
            )}
          </div>

          {/* Host Mode Button */}
          <button
            onClick={() => switchMode('host')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${mode === 'host' ? 'bg-brand-accent text-brand-dark shadow-md' : 'text-brand-secondary hover:text-brand-dark hover:bg-slate-100'}`}
            title="Facilitator screen-share view"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Host Screen</span>
          </button>

          {/* Participant Mode Button */}
          <button
            onClick={() => switchMode('participant')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all text-brand-secondary hover:text-brand-dark hover:bg-slate-100"
            title="Mobile participant web view"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Player Screen</span>
          </button>

          {/* Admin Mode Button */}
          <button
            onClick={() => switchMode('admin')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all ${mode === 'admin' ? 'bg-purple-600 text-brand-dark shadow-md' : 'text-brand-secondary hover:text-brand-dark hover:bg-slate-100'}`}
            title="Workshop content editor"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Content Admin</span>
          </button>
        </nav>
      )}

      {/* Main View Router */}
      <main>
        {mode === 'host' && <FacilitatorView initialRoomCode={joinCode} />}
        {mode === 'participant' && <ParticipantView initialCode={joinCode} />}
        {mode === 'admin' && <AdminEditor onBackToHost={() => switchMode('host')} />}
      </main>
    </div>
  );
};

export default App;

