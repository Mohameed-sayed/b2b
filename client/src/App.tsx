import React, { useState, useEffect } from 'react';
import { FacilitatorView } from './components/facilitator/FacilitatorView';
import { ParticipantView } from './components/participant/ParticipantView';
import { AdminEditor } from './components/admin/AdminEditor';
import { socketService } from './services/socket';
import { Monitor, Smartphone, Settings, Wifi, WifiOff } from 'lucide-react';

type AppMode = 'host' | 'participant' | 'admin';

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('host');
  const [joinCode, setJoinCode] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Parse path or hash on load and popstate
  useEffect(() => {
    const parseRoute = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      // Check if URL has /join/:code or #/join/:code
      const joinMatch = path.match(/\/join\/([a-z0-9]+)/) || hash.match(/#\/join\/([a-z0-9]+)/);
      if (joinMatch) {
        setMode('participant');
        setJoinCode(joinMatch[1].toUpperCase());
        return;
      }

      if (path.startsWith('/join') || hash.startsWith('#/join') || path.startsWith('/play') || hash.startsWith('#/play')) {
        setMode('participant');
        return;
      }

      if (path.startsWith('/admin') || hash.startsWith('#/admin')) {
        setMode('admin');
        return;
      }

      if (path.startsWith('/host') || hash.startsWith('#/host')) {
        setMode('host');
        return;
      }

      // On mobile devices, default to participant mode so joining on phones never mounts facilitator host
      const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        setMode('participant');
        return;
      }

      // Default to host mode for desktop presentation screens
      setMode('host');
    };

    parseRoute();
    window.addEventListener('popstate', parseRoute);
    window.addEventListener('hashchange', parseRoute);

    return () => {
      window.removeEventListener('popstate', parseRoute);
      window.removeEventListener('hashchange', parseRoute);
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

