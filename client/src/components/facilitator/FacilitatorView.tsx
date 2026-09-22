import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Game, Room, Participant, OptionDistributionStats, ReflectionSubmission, RoomStatus } from '../../types/game';
import { defaultGames } from '../../data/defaultGames';
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

interface FacilitatorViewProps {
  initialRoomCode?: string;
}

export const FacilitatorView: React.FC<FacilitatorViewProps> = ({ initialRoomCode }) => {
  const [games, setGames] = useState<Game[]>(defaultGames);
  const [selectedGameId, setSelectedGameId] = useState<string>(defaultGames[0].id);
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
  const currentQuestion = currentGame.questions[currentQuestionIndex] || currentGame.questions[0];

  // Helper to generate local 5-char code if offline
  const generateRandomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let res = 'B2B';
    for (let i = 0; i < 2; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  // Connect socket and fetch network IP
  useEffect(() => {
    const socket = socketService.connect();

    // Fetch real IP for QR code
    socketService.fetchNetworkIp().then((ip) => {
      setNetworkIp(ip);
    });

    // Create room or rejoin with deterministic code
    const codeToUse = initialRoomCode || generateRandomCode();
    setRoomCode(codeToUse);

    const initRoom = () => {
      socket.emit('room:create', { code: codeToUse, gameId: selectedGameId, teamMode }, (res: any) => {
        if (res && res.code) {
          setRoomCode(res.code);
        }
      });
    };

    if (socket.connected) {
      initRoom();
    } else {
      socket.once('connect', initRoom);
    }

    // Socket Event Listeners — named refs so we can properly remove them
    const onRoomCreated = (data: any) => {
      if (data.room) {
        setRoomCode(data.room.code);
        setStatus(data.room.status);
      }
    };

    const onParticipantJoined = (data: any) => {
      sound.playPop();
      setParticipants((prev) => {
        const exists = prev.some((p) => p.id === data.participant.id);
        if (exists) {
          return prev.map((p) => (p.id === data.participant.id ? data.participant : p));
        }
        return [...prev, data.participant];
      });
    };

    const onParticipantLeft = (data: any) => {
      setParticipants((prev) => prev.filter((p) => p.id !== data.participantId));
    };

    const onQuestionStarted = (data: any) => {
      sound.playStartChime();
      setCurrentQuestionIndex(data.index);
      setTimeRemaining(data.timeLimit);
      setAnsweredCount(0);
      setStatus('question');
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
        setStatus(data.room.status);
        setIsPaused(data.room.isPaused);
        setTeamMode(data.room.teamMode);
        if (data.room.participants) {
          // participants may be an object map (from server) or already an array
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
    socket.on('room:participant-left', onParticipantLeft);
    socket.on('question:started', onQuestionStarted);
    socket.on('question:tick', onQuestionTick);
    socket.on('question:answered', onQuestionAnswered);
    socket.on('question:revealed', onQuestionRevealed);
    socket.on('leaderboard:updated', onLeaderboardUpdated);
    socket.on('reflection:added', onReflectionAdded);
    socket.on('room:updated', onRoomUpdated);

    return () => {
      socket.off('room:created', onRoomCreated);
      socket.off('room:participant-joined', onParticipantJoined);
      socket.off('room:participant-left', onParticipantLeft);
      socket.off('question:started', onQuestionStarted);
      socket.off('question:tick', onQuestionTick);
      socket.off('question:answered', onQuestionAnswered);
      socket.off('question:revealed', onQuestionRevealed);
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

      const socket = socketService.getSocket();
      if (socket.connected) {
        socket.emit('game:next-question', { code: roomCode });
      }
    } else {
      // Go back to lobby to select the next game
      setStatus('lobby');
    }
  };

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
        if (status === 'question' || status === 'escape-room') {
          handleRevealAnswer();
        } else if (status === 'revealing') {
          handleShowLeaderboard();
        } else if (status === 'leaderboard') {
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

  const isLastQuestion = currentQuestionIndex >= currentGame.questions.length - 1;

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
          onEndWorkshop={() => setStatus('lobby')}
        />
      )}

      {status === 'question' && (
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

      {status === 'revealing' && (
        <AnswerRevealView
          question={currentQuestion}
          stats={revealStats}
          totalAnswers={answeredCount || participants.length}
          onShowLeaderboard={handleShowLeaderboard}
        />
      )}

      {status === 'leaderboard' && (
        <LeaderboardView
          participants={participants}
          teamMode={teamMode}
          isLastQuestion={isLastQuestion}
          onNextQuestion={handleNextQuestion}
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
          onRevealAnswer={status === 'question' || status === 'escape-room' ? handleRevealAnswer : undefined}
          onShowLeaderboard={status === 'revealing' ? handleShowLeaderboard : undefined}
          onNextQuestion={status === 'leaderboard' ? handleNextQuestion : undefined}
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
    </div>
  );
};

