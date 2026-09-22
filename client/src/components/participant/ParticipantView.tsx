import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Participant, Question, TeamName } from '../../types/game';
import { defaultGames } from '../../data/defaultGames';
import { socketService } from '../../services/socket';
import { ParticipantJoin } from './ParticipantJoin';
import { ParticipantWaiting } from './ParticipantWaiting';
import { ParticipantQuestion } from './ParticipantQuestion';
import { ParticipantAnswered } from './ParticipantAnswered';
import { ParticipantResult } from './ParticipantResult';
import { ParticipantLeaderboard } from './ParticipantLeaderboard';
import { ReconnectingScreen } from './ReconnectingScreen';

interface ParticipantViewProps {
  initialCode?: string;
}

type ParticipantSubState = 'join' | 'reconnecting' | 'waiting' | 'question' | 'answered' | 'result' | 'leaderboard';

export const ParticipantView: React.FC<ParticipantViewProps> = ({ initialCode = '' }) => {
  // ── Session detection: check for saved session before socket events ──
  // This runs synchronously before the socket useEffect so we can show
  // ReconnectingScreen immediately without a flash of the join form.
  const [pendingSession] = useState(() => {
    const s = socketService.getParticipantSession();
    if (!s) return null;
    // If URL has a specific room code, only restore if it matches
    if (initialCode && s.roomCode.toUpperCase() !== initialCode.toUpperCase()) return null;
    return s;
  });

  // Show reconnecting screen immediately if we have a pending session
  const [initialSubState] = useState<ParticipantSubState>(() =>
    pendingSession ? 'reconnecting' : 'join'
  );

  const [subState, setSubState] = useState<ParticipantSubState>(initialSubState);
  const [roomCode, setRoomCode] = useState<string>(initialCode);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(1);
  const [timeRemaining, setTimeRemaining] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [resultData, setResultData] = useState<{
    isCorrect: boolean;
    pointsAwarded: number;
    totalScore: number;
    streak: number;
    explanation?: string;
  }>({
    isCorrect: false,
    pointsAwarded: 0,
    totalScore: 0,
    streak: 0,
  });
  const [allParticipants, setAllParticipants] = useState<Participant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const localTimerRef = useRef<number | null>(null);
  // Keep refs so socket closures always have fresh data
  const participantRef = useRef<Participant | null>(null);
  useEffect(() => { participantRef.current = participant; }, [participant]);
  const roomCodeRef = useRef<string>(roomCode);
  useEffect(() => { roomCodeRef.current = roomCode; }, [roomCode]);

  // Initialize socket & attach ALL game event listeners
  useEffect(() => {
    const socket = socketService.connect();

    // ── Auto-reconnect participant whenever socket reconnects ──
    const onSocketConnect = () => {
      const p = participantRef.current;
      const code = roomCodeRef.current;
      if (p && code) {
        console.log('[Participant] Socket connected, re-authenticating:', p.name, p.id);
        socket.emit('room:reconnect', {
          code,
          roomCode: code,
          participantId: p.id,
        }, (res: any) => {
          if (res?.success && res.participant) {
            console.log('[Participant] Auto-reconnected successfully to room:', code);
            setParticipant(res.participant);
            const roomStatus: string = res.room?.status || 'lobby';
            if (roomStatus === 'leaderboard') {
              setSubState('leaderboard');
            } else if (roomStatus === 'revealing' || roomStatus === 'answer_revealed') {
              setSubState('result');
            } else if (roomStatus === 'question' || roomStatus === 'question_active') {
              if (res.currentQuestion) {
                setCurrentQuestion(res.currentQuestion);
                setQuestionIndex(res.questionIndex ?? 0);
                setTotalQuestions(res.totalQuestions ?? 1);
                setTimeRemaining(res.timeRemaining ?? 30);
                setSubState('question');
              }
            }
          }
        });
      }
    };
    socket.on('connect', onSocketConnect);

    // ── Attempt session reconnect ──────────────────────────────
    // pendingSession is captured in a useState initializer so it's stable.
    if (pendingSession) {
      setRoomCode(pendingSession.roomCode);

      const attemptReconnect = () => {
        let responded = false;
        const fallbackTimer = setTimeout(() => {
          if (!responded) {
            console.warn('[Reconnect] Server timeout');
            socketService.clearParticipantSession();
            setSubState('join');
          }
        }, 5000);

        socket.emit('room:reconnect', {
          code: pendingSession.roomCode,
          participantId: pendingSession.participantId,
        }, (res: any) => {
          responded = true;
          clearTimeout(fallbackTimer);
          if (res?.success && res.participant) {
            setParticipant(res.participant);
            // Re-save with full data (server may have updated avatar/team)
            socketService.saveParticipantSession(
              pendingSession.roomCode,
              res.participant.id,
              res.participant.name,
              res.participant.avatar || pendingSession.avatar,
              res.participant.team || pendingSession.team
            );
            // Restore correct subState based on room's current status
            const roomStatus: string = res.room?.status || 'lobby';
            if (roomStatus === 'leaderboard') {
              setSubState('leaderboard');
            } else if (roomStatus === 'revealing' || roomStatus === 'answer_revealed') {
              setSubState('result');
            } else if (roomStatus === 'question' || roomStatus === 'question_active' || roomStatus === 'escape-room' || roomStatus === 'reflection-wall') {
              if (res.currentQuestion) {
                setCurrentQuestion(res.currentQuestion);
                setQuestionIndex(res.questionIndex ?? 0);
                setTotalQuestions(res.totalQuestions ?? 1);
                setTimeRemaining(res.timeRemaining ?? 30);
                if (res.room?.isPaused !== undefined) setIsPaused(res.room.isPaused);
                setSubState('question');
              } else {
                setSubState('waiting');
              }
            } else {
              // For lobby / any other state: go to waiting.
              // The server will send question:started to push us into question view.
              setSubState('waiting');
            }
          } else {
            // Session expired or room gone — clear session and show join form
            console.warn('[Reconnect] Failed:', res?.error);
            socketService.clearParticipantSession();
            setSubState('join');
          }
        });
      };

      if (socket.connected) {
        attemptReconnect();
      } else {
        // Socket is still connecting — wait for it then try
        socket.once('connect', attemptReconnect);
        // Safety net: if we can't connect at all in 10s, show join form
        const failTimer = setTimeout(() => {
          socketService.clearParticipantSession();
          setSubState('join');
        }, 10000);
        socket.once('connect', () => clearTimeout(failTimer));
        socket.once('connect_error', () => {
          clearTimeout(failTimer);
          socketService.clearParticipantSession();
          setSubState('join');
        });
      }
    }

    // ── Join success (broadcast event from server) ─────────────
    const onRoomJoined = (data: any) => {
      setParticipant(data.participant);
      socketService.saveParticipantSession(
        data.room.code,
        data.participant.id,
        data.participant.name,
        data.participant.avatar,
        data.participant.team
      );
      if (data.room?.isPaused !== undefined) setIsPaused(data.room.isPaused);
      setSubState('waiting');
      setIsLoading(false);
    };

    const onRoomUpdated = (data: any) => {
      if (data.room?.isPaused !== undefined) {
        setIsPaused(data.room.isPaused);
      }
      if (data.room?.timeRemaining !== undefined && data.room.isPaused) {
        setTimeRemaining(data.room.timeRemaining);
      }
    };

    // ── New question received ──────────────────────────────────
    const onQuestionStarted = (data: any) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.index ?? 0);
      setTotalQuestions(data.total ?? 1);
      setTimeRemaining(data.timeLimit ?? 30);
      setIsPaused(false);
      setSelectedAnswer('');
      setResultData({
        isCorrect: false,
        pointsAwarded: 0,
        totalScore: participantRef.current?.score ?? 0,
        streak: 0,
        explanation: '',
      });
      setSubState('question');
    };

    // ── Server countdown tick ──────────────────────────────────
    const onQuestionTick = (data: any) => {
      setTimeRemaining(data.timeRemaining);
    };

    // ── Answer revealed: host clicked REVEAL ───────────────────
    // Server sends BOTH 'participant:score-updated' and 'question:revealed'
    const onQuestionRevealed = (data: any) => {
      setResultData(prev => ({
        ...prev,
        explanation: data.explanation ?? prev.explanation,
      }));
      setSubState(prev => (prev === 'answered' || prev === 'question') ? 'result' : prev);
    };

    // ── Individual score update ────────────────────────────────
    const onScoreUpdated = (data: any) => {
      // Only process score updates for THIS participant
      const myId = participantRef.current?.id;
      if (data.participantId && myId && data.participantId !== myId) return;

      setResultData({
        isCorrect: !!data.isCorrect,
        pointsAwarded: data.pointsAwarded ?? 0,
        totalScore: data.totalScore ?? 0,
        streak: data.streak ?? 0,
        explanation: data.explanation ?? '',
      });
      setParticipant(prev => prev ? { ...prev, score: data.totalScore, streak: data.streak } : prev);
      setSubState('result');
    };

    // ── Leaderboard update ─────────────────────────────────────
    const onLeaderboardUpdated = (data: any) => {
      const list: Participant[] = data.participants ?? [];
      setAllParticipants(list);
      const me = list.find(p => p.id === participantRef.current?.id);
      if (me) setParticipant(me);
      setSubState('leaderboard');
    };

    // ── Reflection active ──────────────────────────────────────
    const onReflectionActive = (data: any) => {
      if (data.question) {
        setCurrentQuestion(data.question);
        setQuestionIndex(data.questionIndex ?? 0);
        setTotalQuestions(data.totalQuestions ?? 1);
        setTimeRemaining(data.question.timeLimit ?? 90);
      }
      setSelectedAnswer('');
      setResultData({
        isCorrect: false,
        pointsAwarded: 0,
        totalScore: participantRef.current?.score ?? 0,
        streak: 0,
        explanation: '',
      });
      setSubState('question');
    };

    // ── Game completed ─────────────────────────────────────────
    const onGameCompleted = (data: any) => {
      if (data.leaderboards?.individual) {
        setAllParticipants(data.leaderboards.individual);
      }
      setSubState('leaderboard');
    };

    // ── Room ended by host ─────────────────────────────────────
    const onRoomEnded = (data: any) => {
      socketService.clearParticipantSession();
      setErrorMessage(data?.message || 'Workshop has ended. Thank you for participating!');
      setParticipant(null);
      setSubState('join');
    };

    // ── Errors ────────────────────────────────────────────────
    const onRoomError = (data: any) => {
      setErrorMessage(data.message || 'An error occurred.');
      setIsLoading(false);
    };

    socket.on('room:joined', onRoomJoined);
    socket.on('room:updated', onRoomUpdated);
    socket.on('question:started', onQuestionStarted);
    socket.on('question:tick', onQuestionTick);
    socket.on('question:revealed', onQuestionRevealed);
    socket.on('answer:revealed', onQuestionRevealed);          // server emits both names
    socket.on('participant:score-updated', onScoreUpdated);
    socket.on('leaderboard:updated', onLeaderboardUpdated);
    socket.on('reflection:active', onReflectionActive);
    socket.on('game:completed', onGameCompleted);
    socket.on('room:ended', onRoomEnded);
    socket.on('room:error', onRoomError);
    socket.on('error', onRoomError);

    return () => {
      socket.off('connect', onSocketConnect);
      socket.off('room:joined', onRoomJoined);
      socket.off('room:updated', onRoomUpdated);
      socket.off('question:started', onQuestionStarted);
      socket.off('question:tick', onQuestionTick);
      socket.off('question:revealed', onQuestionRevealed);
      socket.off('answer:revealed', onQuestionRevealed);
      socket.off('participant:score-updated', onScoreUpdated);
      socket.off('leaderboard:updated', onLeaderboardUpdated);
      socket.off('reflection:active', onReflectionActive);
      socket.off('game:completed', onGameCompleted);
      socket.off('room:ended', onRoomEnded);
      socket.off('room:error', onRoomError);
      socket.off('error', onRoomError);
    };
  }, [initialCode]);

  // Local fallback timer when disconnected (standalone demo)
  useEffect(() => {
    if (subState === 'question' && timeRemaining > 0 && !socketService.isConnected() && !isPaused) {
      localTimerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) { clearInterval(localTimerRef.current!); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (localTimerRef.current) clearInterval(localTimerRef.current);
    }
    return () => { if (localTimerRef.current) clearInterval(localTimerRef.current); };
  }, [subState, isPaused]);

  // ── Join Room Handler ──────────────────────────────────────────
  const handleJoin = useCallback((code: string, name: string, avatar: string, team: TeamName) => {
    setIsLoading(true);
    setErrorMessage('');
    const cleanCode = code.trim().toUpperCase();
    setRoomCode(cleanCode);

    const socket = socketService.getSocket();

    const doJoin = () => {
      const timer = setTimeout(() => {
        setIsLoading(false);
        setErrorMessage('Server took too long to respond. Check room code and try again.');
      }, 8000);

      socket.emit('room:join', { code: cleanCode, roomCode: cleanCode, name, avatar, team }, (res: any) => {
        clearTimeout(timer);
        setIsLoading(false);
        if (res && !res.success) {
          setErrorMessage(res.error || res.message || 'Failed to join. Please check the room code.');
        } else if (res?.participant) {
          setParticipant(res.participant);
          socketService.saveParticipantSession(
            cleanCode,
            res.participant.id,
            res.participant.name,
            res.participant.avatar,
            res.participant.team
          );
          setSubState('waiting');
        }
      });
    };

    if (socket.connected) {
      doJoin();
    } else {
      // Auto-connect and execute join as soon as handshake completes
      setErrorMessage('Connecting to workshop server...');
      socket.connect();
      const onConnectOnce = () => {
        clearTimeout(timeoutFail);
        setErrorMessage('');
        doJoin();
      };
      const timeoutFail = setTimeout(() => {
        socket.off('connect', onConnectOnce);
        setIsLoading(false);
        setErrorMessage('Unable to connect to server. Please check your connection and tap Join again.');
      }, 9000);
      socket.once('connect', onConnectOnce);
    }
  }, []);

  // Standalone mode auto-start removed for production resilience

  // ── Submit Answer ──────────────────────────────────────────────
  const handleSubmitAnswer = useCallback((answerId: string) => {
    setSelectedAnswer(answerId);
    setSubState('answered');

    const socket = socketService.getSocket();
    const p = participantRef.current;
    if (socket.connected && p && currentQuestion) {
      socket.emit('game:submit-answer', {
        participantId: p.id,
        roomCode,
        questionId: currentQuestion.id,
        answer: answerId,
        optionId: answerId, // server reads 'optionId || answer'
        timeRemaining,
        timeTaken: (currentQuestion.timeLimit || 30) - timeRemaining,
      });
    } else if (currentQuestion && p) {
      // Offline fallback
      const isCorrect = answerId === currentQuestion.correctAnswer;
      const pts = isCorrect ? currentQuestion.points : 0;
      setTimeout(() => {
        setResultData({
          isCorrect,
          pointsAwarded: pts,
          totalScore: p.score + pts,
          streak: isCorrect ? p.streak + 1 : 0,
          explanation: currentQuestion.explanation,
        });
        setParticipant({ ...p, score: p.score + pts, streak: isCorrect ? p.streak + 1 : 0 });
        setSubState('result');
      }, 1500);
    }
  }, [currentQuestion, roomCode, timeRemaining]); // timeRemaining must be in deps to avoid stale closure

  // ── Submit Reflection ──────────────────────────────────────────
  const handleSubmitReflection = useCallback((behaviorText: string) => {
    setSelectedAnswer(behaviorText);
    setSubState('answered');

    const socket = socketService.getSocket();
    const p = participantRef.current;
    if (socket.connected && p) {
      socket.emit('reflection:submit', {
        roomCode,
        participantId: p.id,
        behaviorText,
        text: behaviorText, // server reads 'text || behaviorText'
      });
      // After a brief moment show result
      setTimeout(() => {
        setResultData({
          isCorrect: true,
          pointsAwarded: 500,
          totalScore: (p.score || 0) + 500,
          streak: p.streak + 1,
          explanation: 'Thank you! Consistency is how professional reputations are built. 🚀',
        });
        setParticipant(prev => prev ? { ...prev, score: (prev.score || 0) + 500 } : prev);
        setSubState('result');
      }, 1200);
    } else if (p) {
      setTimeout(() => {
        setResultData({
          isCorrect: true,
          pointsAwarded: 500,
          totalScore: p.score + 500,
          streak: p.streak + 1,
          explanation: 'Commitment recorded!',
        });
        setParticipant({ ...p, score: p.score + 500 });
        setSubState('result');
      }, 1000);
    }
  }, [roomCode]);

  return (
    <div className="min-h-screen bg-brand-light text-brand-dark font-sans selection:bg-brand-accent selection:text-brand-dark">
      {/* Shown while attempting to restore a saved session after refresh/close */}
      {subState === 'reconnecting' && (
        <ReconnectingScreen
          name={pendingSession?.name || ''}
          avatar={pendingSession?.avatar || '🚀'}
          roomCode={pendingSession?.roomCode || roomCode}
          onGiveUp={() => {
            socketService.clearParticipantSession();
            // Pre-fill the code so user doesn't have to retype it
            if (pendingSession?.roomCode) setRoomCode(pendingSession.roomCode);
            setSubState('join');
          }}
        />
      )}

      {subState === 'join' && (
        <ParticipantJoin
          initialCode={roomCode}
          onJoin={handleJoin}
          isLoading={isLoading}
          errorMessage={errorMessage}
        />
      )}

      {subState === 'waiting' && participant && (
        <ParticipantWaiting
          roomCode={roomCode}
          participant={participant}
        />
      )}

      {subState === 'question' && currentQuestion && (
        <ParticipantQuestion
          key={currentQuestion.id}
          question={currentQuestion}
          questionIndex={questionIndex}
          totalQuestions={totalQuestions}
          timeRemaining={timeRemaining}
          isPaused={isPaused}
          onSubmitAnswer={handleSubmitAnswer}
          onSubmitReflection={handleSubmitReflection}
        />
      )}

      {subState === 'answered' && (
        <ParticipantAnswered selectedAnswer={selectedAnswer} />
      )}

      {subState === 'result' && (
        <ParticipantResult
          key={currentQuestion?.id || questionIndex}
          isCorrect={resultData.isCorrect}
          pointsAwarded={resultData.pointsAwarded}
          totalScore={resultData.totalScore}
          streak={resultData.streak}
          explanation={resultData.explanation}
        />
      )}

      {subState === 'leaderboard' && participant && (
        <ParticipantLeaderboard
          currentParticipant={participant}
          allParticipants={allParticipants.length > 0 ? allParticipants : [participant]}
        />
      )}
    </div>
  );
};

