import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Game, Room, Participant, OptionDistributionStats, ReflectionSubmission, RoomStatus } from '../../types/game';
import { socketService } from '../../services/socket';
import { sound } from '../../utils/audio';
import { LobbyView } from './LobbyView';
import { QuestionView } from './QuestionView';
import { AnswerRevealView } from './AnswerRevealView';
import { LeaderboardView } from './LeaderboardView';
import { EscapeRoomView } from './EscapeRoomView';
import { ReflectionWallView } from './ReflectionWallView';
import { FacilitatorControlsBar } from './FacilitatorControlsBar';
import { PointsAdjustModal } from './PointsAdjustModal';
import { FloatingReactions } from './FloatingReactions';

interface FacilitatorViewProps {
  initialRoomCode?: string;
}

export const FacilitatorView: React.FC<FacilitatorViewProps> = ({ initialRoomCode }) => {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(true);
  const [roomCode, setRoomCode] = useState<string>(initialRoomCode || '');
  const [networkIp, setNetworkIp] = useState<string>('');
  const [status, setStatus] = useState<RoomStatus>('lobby');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [teamMode, setTeamMode] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answeredCount, setAnsweredCount] = useState<number>(0);
  const [revealStats, setRevealStats] = useState<OptionDistributionStats[]>([]);
  const [reflections, setReflections] = useState<ReflectionSubmission[]>([]);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState<boolean>(false);

  const localTimerRef = useRef<number | null>(null);

  // Current active game and question
  const currentGame = games.find((g) => g.id === selectedGameId) || games[0];
  const currentQuestion = currentGame?.questions?.[currentQuestionIndex] || currentGame?.questions?.[0];

  // Helper to generate local 5-char code if offline
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'B2B';
    for (let i = 0; i < 2; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Helper to normalize room status safely
  const normalizeStatus = useCallback((s: any, gameId?: string): RoomStatus => {
    if (!s) return 'lobby';
    const str = String(s).toLowerCase();
    const activeGame = gameId || selectedGameId;
    if (str === 'question_active' || str === 'question') {
      if (activeGame === 'game-7') return 'escape-room';
      if (activeGame === 'game-8') return 'reflection-wall';
      return 'question';
    }
    if (str === 'answer_revealed' || str === 'debrief' || str === 'revealing') {
      return 'revealing';
    }
    if (str === 'leaderboard' || str === 'completed') {
      return 'leaderboard';
    }
    if (str === 'reflection' || str === 'reflection-wall') {
      return 'reflection-wall';
    }
    if (str === 'escape-room' || str === 'escape_room') {
      return 'escape-room';
    }
    if (str === 'lobby') {
      return 'lobby';
    }
    return 'question';
  }, [selectedGameId]);

  // Fetch latest games from the server
  useEffect(() => {
    fetch(`${socketService.getBackendUrl()}/api/games`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.games && data.games.length > 0) {
          setGames(data.games);
          setSelectedGameId(prev => {
            if (!prev || !data.games.some((g: Game) => g.id === prev)) {
              return data.games[0].id;
            }
            return prev;
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load games from server:', err);
      })
      .finally(() => {
        setIsLoadingGames(false);
      });
  }, []);

  // Connect socket, fetch network IP, and manage host lifecycle
  useEffect(() => {
    const socket = socketService.connect();

    // Fetch real IP for QR code
    socketService.fetchNetworkIp().then((ip) => {
      setNetworkIp(ip);
    });

    const savedHost = socketService.getHostSession();
    const codeToUse = initialRoomCode || savedHost?.roomCode || generateRandomCode();
    setRoomCode(codeToUse);

    const initOrReconnect = () => {
      const activeSession = socketService.getHostSession();
      if (activeSession && (activeSession.roomCode === codeToUse || !initialRoomCode)) {
        console.log('[Host] Attempting host reconnect for room:', activeSession.roomCode);
        socket.emit('host:reconnect', {
          code: activeSession.roomCode,
          roomCode: activeSession.roomCode,
          hostToken: activeSession.hostToken || ''
        }, (res: any) => {
          if (res?.success && res.room) {
            console.log('[Host] Reconnected successfully to room:', res.room.code);
            setRoomCode(res.room.code);
            setStatus(normalizeStatus(res.room.status, res.selectedGameId || res.room.currentGameId));
            if (res.selectedGameId) setSelectedGameId(res.selectedGameId);
            if (res.room.currentQuestionIndex !== undefined) setCurrentQuestionIndex(res.room.currentQuestionIndex);
            if (res.room.isPaused !== undefined) setIsPaused(res.room.isPaused);
            if (res.room.timeRemaining !== undefined) setTimeRemaining(res.room.timeRemaining);
            if (res.room.participants) {
              const pVal = res.room.participants;
              setParticipants(Array.isArray(pVal) ? pVal : Object.values(pVal));
            }
            return;
          }
          // If reconnect failed, create fresh room
          createNewRoom();
        });
      } else {
        createNewRoom();
      }
    };

    const createNewRoom = () => {
      socket.emit('room:create', { code: codeToUse, gameId: selectedGameId, teamMode }, (res: any) => {
        if (res && res.code) {
          setRoomCode(res.code);
          if (res.hostToken) {
            socketService.saveHostSession(res.code, res.hostToken);
          }
        }
      });
    };

    if (socket.connected) {
      initOrReconnect();
    } else {
      socket.once('connect', initOrReconnect);
    }

    // Auto-reconnect host whenever socket reconnects in the background
    const onSocketReconnect = () => {
      console.log('[Host] Socket reconnected, re-registering host...');
      const session = socketService.getHostSession();
      if (session?.roomCode) {
        socket.emit('host:reconnect', {
          code: session.roomCode,
          roomCode: session.roomCode,
          hostToken: session.hostToken || ''
        });
      }
    };
    socket.on('connect', onSocketReconnect);

    // Socket Event Listeners
    const onRoomCreated = (data: any) => {
      if (data.room) {
        setRoomCode(data.room.code);
        setStatus(normalizeStatus(data.room.status, data.room.currentGameId));
      }
    };

    const onParticipantJoined = (data: any) => {
      sound.playPop();
      setParticipants((prev) => {
        const pData = { ...data.participant, isOnline: true };
        const exists = prev.some((p) => p.id === pData.id);
        if (exists) {
          return prev.map((p) => (p.id === pData.id ? pData : p));
        }
        return [...prev, pData];
      });
    };

    const onParticipantReconnected = (data: any) => {
      sound.playPop();
      setParticipants((prev) => {
        const pData = { ...data.participant, isOnline: true };
        const exists = prev.some((p) => p.id === pData.id);
        if (exists) {
          return prev.map((p) => (p.id === pData.id ? pData : p));
        }
        return [...prev, pData];
      });
    };

    // Soft-mark participant offline rather than deleting them
    const onParticipantOffline = (data: any) => {
      setParticipants((prev) =>
        prev.map((p) => (p.id === data.participantId ? { ...p, isOnline: false } : p))
      );
    };

    const onQuestionStarted = (data: any) => {
      sound.playStartChime();
      setCurrentQuestionIndex(data.index);
      setTimeRemaining(data.timeLimit);
      setAnsweredCount(0);
      setIsPaused(false);
      if (selectedGameId === 'game-7') {
        setStatus('escape-room');
      } else if (selectedGameId === 'game-8' || data.question?.type === 'reflection') {
        setStatus('reflection-wall');
      } else {
        setStatus('question');
      }
    };

    const onQuestionTick = (data: any) => {
      setTimeRemaining(data.timeRemaining);
    };

    const onQuestionAnswered = (data: any) => {
      sound.playPop();
      setAnsweredCount(data.answeredCount);
    };

    const onQuestionRevealed = (data: any) => {
      setRevealStats(data.stats || []);
      setStatus('revealing');
    };

    const onPlayersAnswersRevealed = (data: any) => {
      setRevealStats(data.stats || []);
      setStatus('answers-displayed');
    };

    const onLeaderboardUpdated = (data: any) => {
      if (data.participants) {
        setParticipants(data.participants);
      }
      setStatus('leaderboard');
    };

    const onReflectionAdded = (data: any) => {
      sound.playPop();
      setReflections((prev) => [data.reflection, ...prev]);
    };

    const onRoomUpdated = (data: any) => {
      if (data.room) {
        if (data.room.status) setStatus(normalizeStatus(data.room.status, data.room.currentGameId));
        if (data.room.isPaused !== undefined) setIsPaused(data.room.isPaused);
        if (data.room.timeRemaining !== undefined && data.room.isPaused) setTimeRemaining(data.room.timeRemaining);
        if (data.room.teamMode !== undefined) setTeamMode(data.room.teamMode);
        if (data.room.participants) {
          const participantsValue = data.room.participants;
          setParticipants(
            Array.isArray(participantsValue)
              ? participantsValue
              : Object.values(participantsValue)
          );
        }
      }
    };

    socket.on('room:created', onRoomCreated);
    socket.on('room:participant-joined', onParticipantJoined);
    socket.on('room:participant-reconnected', onParticipantReconnected);
    socket.on('room:participant-offline', onParticipantOffline);
    socket.on('room:participant-left', onParticipantOffline);
    socket.on('question:started', onQuestionStarted);
    socket.on('question:tick', onQuestionTick);
    socket.on('question:answered', onQuestionAnswered);
    socket.on('question:revealed', onQuestionRevealed);
    socket.on('players-answers:revealed', onPlayersAnswersRevealed);
    socket.on('leaderboard:updated', onLeaderboardUpdated);
    socket.on('reflection:added', onReflectionAdded);
    socket.on('room:updated', onRoomUpdated);

    return () => {
      socket.off('connect', onSocketReconnect);
      socket.off('room:created', onRoomCreated);
      socket.off('room:participant-joined', onParticipantJoined);
      socket.off('room:participant-reconnected', onParticipantReconnected);
      socket.off('room:participant-offline', onParticipantOffline);
      socket.off('room:participant-left', onParticipantOffline);
      socket.off('question:started', onQuestionStarted);
      socket.off('question:tick', onQuestionTick);
      socket.off('question:answered', onQuestionAnswered);
      socket.off('question:revealed', onQuestionRevealed);
      socket.off('players-answers:revealed', onPlayersAnswersRevealed);
      socket.off('leaderboard:updated', onLeaderboardUpdated);
      socket.off('reflection:added', onReflectionAdded);
      socket.off('room:updated', onRoomUpdated);
    };
  }, [initialRoomCode]);

  // Local fallback timer — only used in offline/standalone mode.
  // When connected, the server drives the countdown via 'question:tick' events.
  useEffect(() => {
    if (status === 'question' && !isPaused && timeRemaining > 0 && !socketService.isConnected()) {
      localTimerRef.current = window.setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(localTimerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
      }
    }

    return () => {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    };
  }, [status, isPaused, timeRemaining]);

  // Facilitator Actions
  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setCurrentQuestionIndex(0);
    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:select', { code: roomCode, gameId });
    }
  };

  const handleStartGame = () => {
    sound.playStartChime();
    setCurrentQuestionIndex(0);
    setTimeRemaining(currentQuestion.timeLimit);
    setAnsweredCount(0);

    const isEscapeRoom = currentGame.id === 'game-7';
    const isReflection = currentGame.id === 'game-8' || currentQuestion.type === 'reflection';

    if (isEscapeRoom) {
      setStatus('escape-room');
    } else if (isReflection) {
      setStatus('reflection-wall');
    } else {
      setStatus('question');
    }

    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:start', { code: roomCode });
    }
  };

  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:pause-toggle', { code: roomCode });
    }
  };

  const handleToggleTeamMode = () => {
    setTeamMode((prev) => !prev);
    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:toggle-team-mode', { code: roomCode });
    }
  };

  const handleRevealPlayersAnswers = () => {
    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:reveal-players-answers', { code: roomCode });
    }
  };

  const handleRevealAnswer = () => {
    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:reveal-answer', { code: roomCode });
    }
  };

  const handleShowLeaderboard = () => {
    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:show-leaderboard', { code: roomCode });
    }
  };

  const handleNextQuestion = () => {
    const nextIdx = currentQuestionIndex + 1;
    const socket = socketService.getSocket();

    if (nextIdx < currentGame.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      const nextQ = currentGame.questions[nextIdx];
      setTimeRemaining(nextQ.timeLimit);
      setAnsweredCount(0);

      if (currentGame.id === 'game-7') {
        setStatus('escape-room');
      } else if (currentGame.id === 'game-8' || nextQ.type === 'reflection') {
        setStatus('reflection-wall');
      } else {
        setStatus('question');
      }

      if (socket.connected) {
        socket.emit('game:next-question', { code: roomCode });
      }
    } else {
      // Go back to lobby to select the next game
      setStatus('lobby');
      if (socket.connected) {
        socket.emit('game:next-question', { code: roomCode });
      }
    }
  };

  const handleEndWorkshop = useCallback(() => {
    if (window.confirm('Are you sure you want to end this workshop? This will clear the room, reset all participant sessions, and return to a fresh lobby.')) {
      const socket = socketService.getSocket();
      if (socket.connected && roomCode) {
        socket.emit('room:end', { code: roomCode });
      }
      socketService.clearHostSession();
      setStatus('lobby');
      setParticipants([]);
      setReflections([]);
      setRevealStats([]);
      setCurrentQuestionIndex(0);
      setAnsweredCount(0);

      const newCode = generateRandomCode();
      setRoomCode(newCode);
      socket.emit('room:create', { code: newCode, gameId: selectedGameId, teamMode, forceNew: true }, (res: any) => {
        if (res && res.code) {
          setRoomCode(res.code);
          if (res.hostToken) {
            socketService.saveHostSession(res.code, res.hostToken);
          }
        }
      });
    }
  }, [roomCode, selectedGameId, teamMode]);

  const handleResetRoom = useCallback(() => {
    if (window.confirm('Start a fresh session with a new room code? Current participants will need to re-join.')) {
      const socket = socketService.getSocket();
      if (socket.connected && roomCode) {
        socket.emit('room:end', { code: roomCode });
      }
      socketService.clearHostSession();
      setStatus('lobby');
      setParticipants([]);
      setReflections([]);
      setRevealStats([]);
      setCurrentQuestionIndex(0);
      setAnsweredCount(0);

      const newCode = generateRandomCode();
      setRoomCode(newCode);
      socket.emit('room:create', { code: newCode, gameId: selectedGameId, teamMode, forceNew: true }, (res: any) => {
        if (res && res.code) {
          setRoomCode(res.code);
          if (res.hostToken) {
            socketService.saveHostSession(res.code, res.hostToken);
          }
        }
      });
    }
  }, [roomCode, selectedGameId, teamMode]);

  const handleAdjustPoints = (targetId: string, isTeam: boolean, delta: number) => {
    sound.playPop();
    setParticipants((prev) =>
      prev.map((p) => {
        if (isTeam && p.team === targetId) {
          return { ...p, score: Math.max(0, p.score + delta) };
        }
        if (!isTeam && p.id === targetId) {
          return { ...p, score: Math.max(0, p.score + delta) };
        }
        return p;
      })
    );

    const socket = socketService.getSocket();
    if (socket.connected) {
      socket.emit('game:adjust-points', {
        code: roomCode,
        targetId,
        isTeam,
        pointsDelta: delta,
      });
    }
  };

  // Keyboard shortcut listener: Space to Reveal/Next
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Avoid firing if inside an input/textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (status === 'question' || status === 'escape-room' || (status as string) === 'question_active') {
          handleRevealPlayersAnswers();
        } else if (status === 'answers-displayed' || (status as string) === 'answers_displayed') {
          handleRevealAnswer();
        } else if (status === 'revealing' || (status as string) === 'answer_revealed' || (status as string) === 'debrief') {
          handleShowLeaderboard();
        } else if (status === 'leaderboard' || (status as string) === 'completed') {
          handleNextQuestion();
        }
      }
    },
    [status, currentQuestionIndex, currentGame]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoadingGames || !currentGame) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-semibold text-base">Loading workshop games from server...</p>
      </div>
    );
  }

  const isLastQuestion = currentQuestionIndex >= (currentGame?.questions?.length || 0) - 1;

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark font-sans selection:bg-brand-accent selection:text-brand-dark relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,107,0,0.08),rgba(255,255,255,0))]" />

      {/* Render Active View */}
      {status === 'lobby' && (
        <LobbyView
          roomCode={roomCode}
          networkIp={networkIp}
          participants={participants}
          games={games}
          selectedGameId={selectedGameId}
          teamMode={teamMode}
          onSelectGame={handleSelectGame}
          onStartGame={handleStartGame}
          onToggleTeamMode={handleToggleTeamMode}
          onResetRoom={handleResetRoom}
        />
      )}

      {status === 'escape-room' && (
        <EscapeRoomView
          question={currentQuestion}
          timeRemaining={timeRemaining}
          isPaused={isPaused}
          onRevealAnswer={handleRevealAnswer}
        />
      )}

      {status === 'reflection-wall' && (
        <ReflectionWallView
          reflections={reflections}
          onEndWorkshop={handleEndWorkshop}
        />
      )}

      {(status === 'question' || (status as string) === 'question_active') && (
        <QuestionView
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={currentGame.questions.length}
          timeRemaining={timeRemaining}
          isPaused={isPaused}
          participants={participants}
          answeredCount={answeredCount}
          onRevealAnswer={handleRevealAnswer}
        />
      )}

      {(status === 'answers-displayed' || (status as string) === 'answers_displayed' || status === 'revealing' || (status as string) === 'answer_revealed' || (status as string) === 'debrief') && (
        <AnswerRevealView
          question={currentQuestion}
          stats={revealStats}
          totalAnswers={answeredCount || participants.length}
          onShowLeaderboard={handleShowLeaderboard}
        />
      )}

      {(status === 'leaderboard' || (status as string) === 'completed') && (
        <LeaderboardView
          participants={participants}
          teamMode={teamMode}
          isLastQuestion={isLastQuestion}
          onNextQuestion={handleNextQuestion}
        />
      )}

      {/* Robust Fallback View: Guarantees no white screen even if status is unexpected */}
      {status !== 'lobby' &&
       status !== 'escape-room' &&
       status !== 'reflection-wall' &&
       status !== 'question' &&
       (status as string) !== 'question_active' &&
       status !== 'revealing' &&
       (status as string) !== 'answer_revealed' &&
       (status as string) !== 'debrief' &&
       status !== 'leaderboard' &&
       (status as string) !== 'completed' && (
        <QuestionView
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={currentGame.questions.length}
          timeRemaining={timeRemaining}
          isPaused={isPaused}
          participants={participants}
          answeredCount={answeredCount}
          onRevealAnswer={handleRevealAnswer}
        />
      )}

      {/* Facilitator Controls Dock */}
      {status !== 'lobby' && (
        <FacilitatorControlsBar
          roomCode={roomCode}
          status={status}
          isPaused={isPaused}
          teamMode={teamMode}
          isMuted={isMuted}
          onToggleSound={() => setIsMuted((m) => !m)}
          onTogglePause={handleTogglePause}
          onToggleTeamMode={handleToggleTeamMode}
          onOpenPointsModal={() => setIsPointsModalOpen(true)}
          onRevealPlayersAnswers={status === 'question' || status === 'escape-room' || (status as string) === 'question_active' ? handleRevealPlayersAnswers : undefined}
          onRevealAnswer={status === 'answers-displayed' || (status as string) === 'answers_displayed' ? handleRevealAnswer : undefined}
          onShowLeaderboard={status === 'revealing' || (status as string) === 'answer_revealed' || (status as string) === 'debrief' ? handleShowLeaderboard : undefined}
          onNextQuestion={status === 'leaderboard' || (status as string) === 'completed' || status === 'revealing' || (status as string) === 'answer_revealed' || (status as string) === 'debrief' ? handleNextQuestion : undefined}
          onEndWorkshop={handleEndWorkshop}
          isLastQuestion={isLastQuestion}
        />
      )}

      {/* Points Adjustment Modal */}
      <PointsAdjustModal
        isOpen={isPointsModalOpen}
        onClose={() => setIsPointsModalOpen(false)}
        participants={participants}
        teamMode={teamMode}
        onAdjustPoints={handleAdjustPoints}
      />

      {/* Live Room Reactions */}
      <FloatingReactions />
    </div>
  );
};

