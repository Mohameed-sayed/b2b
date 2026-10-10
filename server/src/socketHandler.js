import { gameEngine, ROOM_STATES, TEAMS, formatClientRoom, formatPlayerRoom, sanitizeQuestion, sanitizeLeaderboards } from './gameEngine.js';
import { db } from './storage/db.js';

// Active question interval timers per room: roomCode -> timerId
const roomTimers = new Map();

const REVEALED_STATES = new Set([ROOM_STATES.ANSWER_REVEALED, ROOM_STATES.DEBRIEF, ROOM_STATES.LEADERBOARD]);

// Host gets full data; players get a version without answers/correctness.
function emitSplit(io, code, event, hostPayload, playerPayload) {
  io.to(`${code}:host`).emit(event, hostPayload);
  io.to(code).except(`${code}:host`).emit(event, playerPayload);
}

function emitQuestion(io, code, event, payload) {
  emitSplit(io, code, event, payload, { ...payload, question: sanitizeQuestion(payload.question) });
}

function broadcastRoom(io, room) {
  emitSplit(io, room.code, 'room:updated',
    { room: formatClientRoom(room, room.hostSocketId) },
    { room: formatPlayerRoom(room) });
}

// Coalesce bursts (e.g. 100 joins) into one host room:updated per 250ms.
const hostUpdateTimers = new Map();
function hostRoomUpdate(io, room) {
  if (hostUpdateTimers.has(room.code)) return;
  hostUpdateTimers.set(room.code, setTimeout(() => {
    hostUpdateTimers.delete(room.code);
    io.to(`${room.code}:host`).emit('room:updated', { room: formatClientRoom(room, room.hostSocketId) });
  }, 250));
}

function startRoomTimer(io, roomCode, timeLimit) {
  stopRoomTimer(roomCode);
  let remaining = timeLimit;
  
  const room = gameEngine.getRoom(roomCode);
  if (room) room.currentTimeRemaining = remaining;

  // Broadcast initial tick
  io.to(roomCode).emit('question:tick', { timeRemaining: remaining });

  const timerId = setInterval(() => {
    remaining -= 1;
    if (remaining < 0) remaining = 0;

    if (room) room.currentTimeRemaining = remaining;

    io.to(roomCode).emit('question:tick', { timeRemaining: remaining });

    if (remaining <= 0) {
      stopRoomTimer(roomCode);
      
      // AUTO REVEAL PLAYERS ANSWERS
      try {
        console.log(`⏱️ [AUTO REVEAL PLAYERS ANSWERS] Timer ended for Room: ${roomCode}`);
        const { room: updatedRoom, question, distribution } = gameEngine.revealPlayersAnswers(roomCode);
        
        const optionsMap = distribution.options || {};
        const stats = (question.options || []).map(opt => {
          const entry = optionsMap[opt.id] || { count: 0, percentage: 0, participants: [] };
          return {
            optionId: opt.id,
            text: opt.text,
            count: entry.count || 0,
            percentage: entry.percentage || 0,
            isCorrect: false,
            participants: entry.participants || []
          };
        });

        io.to(`${roomCode}:host`).emit('room:updated', { room: formatClientRoom(updatedRoom, updatedRoom.hostSocketId) });

        io.to(roomCode).emit('players-answers:revealed', {
          correctAnswer: null,
          explanation: '',
          distributions: optionsMap,
          stats,
          totalSubmitted: distribution.totalSubmitted,
          totalParticipants: distribution.totalParticipants
        });
      } catch (err) {
        console.error('Auto reveal error:', err);
      }
    }
  }, 1000);

  roomTimers.set(roomCode, timerId);
}

function stopRoomTimer(roomCode) {
  if (roomTimers.has(roomCode)) {
    clearInterval(roomTimers.get(roomCode));
    roomTimers.delete(roomCode);
  }
}

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    socket.roomCode = null;
    socket.participantId = null;
    socket.isHost = false;

    // Host-only events: socket must have created/reconnected as host of this room.
    const authHost = (code, cb) => {
      if (socket.isHost && socket.roomCode === code) return true;
      if (typeof cb === 'function') cb({ success: false, error: 'Not authorized' });
      return false;
    };

    // ==========================================
    // ROOM CREATION (Supports room:create & host:create_room)
    // ==========================================
    const handleCreateRoom = async ({ gameId, mode, teamMode, code, customCode, forceNew, hostToken } = {}, callback) => {
      try {
        // An existing room may only be (re)claimed by its host, or when it has no host and no players.
        const existing = gameEngine.getActiveRoom();
        if (existing && !(
          (hostToken && gameEngine.validateHost(existing.code, hostToken)) ||
          (socket.isHost && socket.roomCode === existing.code) ||
          !existing.hostSocketId
        )) {
          throw new Error('A workshop is already running');
        }
        const isTeam = teamMode === true || mode === 'team';
        const room = gameEngine.createRoom({
          gameId,
          mode: isTeam ? 'team' : 'individual',
          hostSocketId: socket.id,
          code: code || customCode,
          forceNew: !!forceNew
        });

        socket.roomCode = room.code;
        socket.isHost = true;
        socket.join(room.code);
        socket.join(`${room.code}:host`);

        const fullRoom = gameEngine.getFullRoomForHost(room.code);

        // Format room object matching client Room interface
        const clientRoom = formatClientRoom(room, socket.id);

        const response = {
          success: true,
          code: room.code,
          roomCode: room.code,
          hostToken: room.hostToken,
          room: clientRoom
        };

        console.log(`✅ [ROOM CREATED/ATTACHED] Code: ${room.code} by Host Socket: ${socket.id}`);

        socket.emit('room:created', { room: clientRoom });

        if (typeof callback === 'function') callback(response);
      } catch (err) {
        console.error('Create room error:', err);
        const errResponse = { success: false, error: err.message };
        socket.emit('error', errResponse);
        socket.emit('room:error', { message: err.message });
        if (typeof callback === 'function') callback(errResponse);
      }
    };

    socket.on('room:create', handleCreateRoom);

    // ==========================================
    // PARTICIPANT JOIN (Supports room:join & participant:join)
    // ==========================================
    const handleJoin = ({ code, roomCode, name, avatar, team, participantId }, callback) => {
      let targetCode = (code || roomCode || '').toUpperCase().trim();
      console.log(`📥 [JOIN ATTEMPT] Room: "${targetCode}", Name: "${name}", Socket: ${socket.id}`);

      try {
        let room = targetCode ? gameEngine.getRoom(targetCode) : null;
        if (!room) {
          const active = gameEngine.getActiveRoom();
          if (active) {
            console.log(`ℹ️ [JOIN FALLBACK] Target room "${targetCode}" not found, routing to active room "${active.code}"`);
            targetCode = active.code;
            room = active;
          } else {
            throw new Error(targetCode ? `Room "${targetCode}" not found. Please check the room code.` : 'No active workshop room found. Please wait for the facilitator to start.');
          }
        }

        const prior = participantId ? room.participants?.[participantId] : null;
        if (prior?.socketId && prior.socketId !== socket.id && io.sockets.sockets.has(prior.socketId)) {
          throw new Error('That player is already connected');
        }

        const { participant, isReconnect, room: updatedRoom } = gameEngine.joinParticipant({
          roomCode: targetCode,
          name,
          avatar,
          participantId,
          socketId: socket.id
        });

        // Set team if provided
        if (team) {
          participant.team = team;
          updatedRoom.participants[participant.id].team = team;
          gameEngine.saveRoomToDb(updatedRoom);
        }

        socket.roomCode = targetCode;
        socket.participantId = participant.id;
        socket.isHost = false;
        socket.join(targetCode);

        // Format room object matching client Room interface
        const clientRoom = formatPlayerRoom(updatedRoom);

        const response = {
          success: true,
          participant,
          isReconnect,
          room: clientRoom
        };

        console.log(`🎉 [JOIN SUCCESS] Participant: ${participant.name} (${participant.id}) in Room: ${targetCode}`);

        // Direct response to the participant socket
        socket.emit('room:joined', { participant, room: clientRoom });

        // Only the host tracks the roster
        io.to(`${targetCode}:host`).emit('room:participant-joined', {
          participant,
          count: Object.values(updatedRoom.participants).length
        });
        hostRoomUpdate(io, updatedRoom);

        if (typeof callback === 'function') {
          callback(response);
        }
      } catch (err) {
        console.error(`❌ [JOIN ERROR] Room: "${targetCode}":`, err.message);
        const errResp = { success: false, error: err.message, message: err.message };
        socket.emit('room:error', { message: err.message });
        if (typeof callback === 'function') {
          callback(errResp);
        }
      }
    };

    socket.on('room:join', handleJoin);

    // ==========================================
    // RECONNECT (Supports room:reconnect & host:reconnect)
    // ==========================================
    socket.on('room:reconnect', ({ code, roomCode, participantId }, callback) => {
      const targetCode = (code || roomCode || '').toUpperCase().trim();
      console.log(`🔄 [RECONNECT ATTEMPT] Room: ${targetCode}, PID: ${participantId}, Socket: ${socket.id}`);
      try {
        const room = gameEngine.getRoom(targetCode);
        if (!room || !room.participants || !room.participants[participantId]) {
          const resp = { success: false, error: 'Session expired or not found' };
          if (typeof callback === 'function') callback(resp);
          return;
        }

        const participant = room.participants[participantId];
        if (participant.socketId && participant.socketId !== socket.id && io.sockets.sockets.has(participant.socketId)) {
          if (typeof callback === 'function') callback({ success: false, error: 'That player is already connected' });
          return;
        }
        participant.socketId = socket.id;
        participant.isOnline = true;
        participant.lastActive = Date.now();
        gameEngine.saveRoomToDb(room);

        socket.roomCode = targetCode;
        socket.participantId = participant.id;
        socket.join(targetCode);

        const clientRoom = formatPlayerRoom(room);

        let currentQuestion = gameEngine.getCurrentQuestion(room);
        if (!REVEALED_STATES.has(room.state)) currentQuestion = sanitizeQuestion(currentQuestion);

        // Case B: Late Joiner Reconnect
        // If the participant joined AFTER the current question started,
        // they must remain in the waiting room until the host advances.
        if (room.questionStartTime && participant.joinedAt > room.questionStartTime) {
          clientRoom.status = 'waiting';
          currentQuestion = null;
        }

        const response = {
          success: true,
          participant,
          room: clientRoom,
          currentQuestion,
          questionIndex: room.currentQuestionIndex,
          totalQuestions: room.game?.questions?.length || 1,
          timeRemaining: room.currentTimeRemaining !== undefined ? room.currentTimeRemaining : (room.questionTimeLimit || 30)
        };

        console.log(`✅ [RECONNECTED] ${participant.name} back in ${targetCode}`);
        if (typeof callback === 'function') callback(response);

        // Broadcast to host and room that participant is back online!
        io.to(`${targetCode}:host`).emit('room:participant-reconnected', {
          participant: clientRoom.participants[participant.id],
          count: Object.values(room.participants).filter(p => p.isOnline).length
        });
        hostRoomUpdate(io, room);
      } catch (err) {
        console.error('Reconnect error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    socket.on('host:reconnect', ({ code, roomCode, hostToken }, callback) => {
      try {
        const targetCode = (code || roomCode || '').toUpperCase().trim();
        console.log(`👑 [HOST RECONNECT ATTEMPT] Room: ${targetCode}, Socket: ${socket.id}`);
        const room = gameEngine.getRoom(targetCode);
        if (!room) {
          const resp = { success: false, error: 'Room expired or not found' };
          socket.emit('error', resp);
          if (typeof callback === 'function') callback(resp);
          return;
        }

        const valid = gameEngine.validateHost(targetCode, hostToken);
        if (!valid) {
          const resp = { success: false, error: 'Invalid host credentials or room expired' };
          socket.emit('error', resp);
          if (typeof callback === 'function') callback(resp);
          return;
        }

        socket.roomCode = targetCode;
        socket.isHost = true;
        gameEngine.updateHostSocket(targetCode, socket.id, hostToken);
        socket.join(targetCode);
        socket.join(`${targetCode}:host`);

        const fullRoom = gameEngine.getFullRoomForHost(targetCode);
        const clientRoom = formatClientRoom(fullRoom, socket.id);

        const currentQuestion = gameEngine.getCurrentQuestion(fullRoom);

        const response = {
          success: true,
          code: fullRoom.code,
          roomCode: fullRoom.code,
          hostToken: fullRoom.hostToken,
          room: clientRoom,
          fullRoom,
          currentQuestion,
          selectedGameId: fullRoom.gameId
        };

        console.log(`👑 [HOST RECONNECTED] Room: ${targetCode} to Socket: ${socket.id}`);
        socket.emit('room:updated', { room: clientRoom });
        if (typeof callback === 'function') callback(response);
      } catch (err) {
        console.error('host:reconnect error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // ==========================================
    // GAME SELECTION
    // ==========================================
    socket.on('game:select', ({ code, gameId }) => {
      const targetCode = (code || '').toUpperCase().trim();
      if (!authHost(targetCode)) return;
      const room = gameEngine.getRoom(targetCode);
      if (!room) return;
      const games = db.getGames ? db.getGames() : [];
      const selected = games.find(g => g.id === gameId);
      if (selected) {
        room.gameId = selected.id;
        room.game = selected;
        room.currentQuestionIndex = 0;
        gameEngine.saveRoomToDb(room);
        console.log(`🎮 Room ${targetCode} selected game: ${selected.title}`);
      }
    });

    // ==========================================
    // START GAME (Supports game:start & host:start_game)
    // ==========================================
    const handleStartGame = ({ code, roomCode, hostToken }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`🚀 [START GAME] Room: ${targetCode}`);
      if (!authHost(targetCode, callback)) return;
      try {
        const room = gameEngine.startGame(targetCode);
        const rawQuestion = gameEngine.getCurrentQuestion(room);

        // Start server countdown timer tick
        startRoomTimer(io, targetCode, room.questionTimeLimit || rawQuestion.timeLimit || 30);

        // Broadcast to all participants & host
        emitQuestion(io, targetCode, 'question:started', {
          question: rawQuestion,
          timeLimit: room.questionTimeLimit || rawQuestion.timeLimit || 30,
          index: room.currentQuestionIndex,
          total: room.game.questions.length
        });

        if (typeof callback === 'function') callback({ success: true, room });
      } catch (err) {
        console.error('Start game error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:start', handleStartGame);

    // ==========================================
    // SUBMIT ANSWER (Supports game:submit-answer & participant:submit_answer)
    // ==========================================
    const handleSubmitAnswer = ({ roomCode, code, answer, optionId } = {}, callback) => {
      const targetCode = (roomCode || code || socket.roomCode || '').toUpperCase().trim();
      const pid = socket.participantId; // never trust client-supplied id
      const optId = optionId || answer;

      console.log(`📝 [ANSWER SUBMITTED] Room: ${targetCode}, PID: ${pid}, Choice: ${optId}`);

      try {
        const result = gameEngine.submitAnswer({
          roomCode: targetCode,
          participantId: pid,
          optionId: optId
        });

        const room = gameEngine.getRoom(targetCode);
        const answeredCount = Object.keys(room?.answers?.[room.currentQuestionIndex] || {}).length;
        const totalParticipants = Object.keys(room?.participants || {}).length;

        // Broadcast answered update to host
        io.to(`${targetCode}:host`).emit('question:answered', {
          participantId: pid,
          answeredCount,
          totalParticipants
        });


        const response = {
          success: true,
          optionId: optId,
          alreadyAnswered: result.alreadyAnswered || false,
          answer: result.answer
        };

        if (typeof callback === 'function') callback(response);
      } catch (err) {
        console.error('Submit answer error:', err);
        const errResp = { success: false, error: err.message };
        if (typeof callback === 'function') callback(errResp);
      }
    };

    socket.on('game:submit-answer', handleSubmitAnswer);

    // ==========================================
    // REVEAL PLAYERS ANSWERS
    // ==========================================
    const handleRevealPlayersAnswers = ({ code, roomCode }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`👁️ [REVEAL PLAYERS ANSWERS] Room: ${targetCode}`);
      if (!authHost(targetCode, callback)) return;
      stopRoomTimer(targetCode);

      try {
        const { room, question, distribution, leaderboards } = gameEngine.revealPlayersAnswers(targetCode);

        // distribution = { options: {A:{count,percentage,participants,...}, ...}, totalSubmitted, totalParticipants }
        const optionsMap = distribution.options || {};
        const stats = (question.options || []).map(opt => {
          const entry = optionsMap[opt.id] || { count: 0, percentage: 0, participants: [] };
          return {
            optionId: opt.id,
            text: opt.text,
            count: entry.count || 0,
            percentage: entry.percentage || 0,
            isCorrect: false, // hide correct answer for now
            participants: entry.participants || []
          };
        });

        // 1. Alert Facilitator
        socket.emit('room:updated', { room: formatClientRoom(room, room.hostSocketId) });

        // 2. Broadcast reveal
        const revealPayload = {
          correctAnswer: null, // intentionally hide correct answer
          explanation: '', // hide explanation
          distributions: optionsMap,
          stats,
          learningObjective: '',
          discussionQuestion: '',
          leaderboards
        };
        // players get leaderboards without per-question correctness
        emitSplit(io, targetCode, 'players-answers:revealed', revealPayload,
          { ...revealPayload, leaderboards: sanitizeLeaderboards(leaderboards) });

        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        console.error('Error revealing players answers:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:reveal-players-answers', handleRevealPlayersAnswers);

    // ==========================================
    // REVEAL ANSWER (Supports game:reveal-answer & host:reveal_answer)
    // ==========================================
    const handleRevealAnswer = ({ code, roomCode }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`🔍 [REVEAL ANSWER] Room: ${targetCode}`);
      if (!authHost(targetCode, callback)) return;
      stopRoomTimer(targetCode);

      try {
        const { room, question, distribution, leaderboards } = gameEngine.revealAnswer(targetCode);

        // distribution = { options: {A:{count,percentage,...}, ...}, totalSubmitted, totalParticipants }
        const optionsMap = distribution.options || {};
        const stats = (question.options || []).map(opt => {
          const entry = optionsMap[opt.id] || { count: 0, percentage: 0, participants: [] };
          return {
            optionId: opt.id,
            text: opt.text,
            count: entry.count || 0,
            percentage: entry.percentage || 0,
            isCorrect: opt.id === (question.correctAnswer || ''),
            participants: entry.participants || []
          };
        });

        const payload = {
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          learningObjective: question.learningObjective,
          discussionQuestion: question.discussionQuestion,
          distributions: optionsMap,
          stats,
          leaderboards
        };

        // Emit individual score updates to each participant first so their state is set
        for (const [pid, p] of Object.entries(room.participants)) {
          const userAns = room.answers?.[room.currentQuestionIndex]?.[pid];
          const isCorrect = userAns ? !!userAns.isCorrect : false;
          const pts = userAns ? (userAns.pointsEarned ?? userAns.pointsAwarded ?? 0) : 0;

          const scorePayload = {
            participantId: pid,
            isCorrect,
            pointsAwarded: pts,
            totalScore: p.score,
            streak: p.streak,
            explanation: question.explanation
          };

          if (p.socketId) {
            io.to(p.socketId).emit('participant:score-updated', scorePayload);
          }
        }

        io.to(targetCode).emit('question:revealed', payload);

        if (typeof callback === 'function') callback({ success: true, stats, leaderboards });
      } catch (err) {
        console.error('Reveal answer error:', err.message, err.stack);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:reveal-answer', handleRevealAnswer);

    // ==========================================
    // SHOW LEADERBOARD (Supports game:show-leaderboard & host:show_leaderboard)
    // ==========================================
    const handleShowLeaderboard = ({ code, roomCode }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`🏆 [SHOW LEADERBOARD] Room: ${targetCode}`);
      if (!authHost(targetCode, callback)) return;
      try {
        const { room, leaderboards } = gameEngine.showLeaderboard(targetCode);

        const isTeam = room.mode === 'team';
        const teamScores = {};
        for (const t of leaderboards.team) {
          teamScores[t.team] = t.totalScore;
        }

        const payload = {
          participants: leaderboards.individual,
          teamScores,
          individualLeaderboard: leaderboards.individual,
          teamLeaderboard: leaderboards.team,
          mode: room.mode,
          teamMode: isTeam
        };

        io.to(targetCode).emit('leaderboard:updated', payload);
        broadcastRoom(io, room);

        if (typeof callback === 'function') callback({ success: true, leaderboards, teamMode: isTeam, mode: room.mode });
      } catch (err) {
        console.error('Show leaderboard error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:show-leaderboard', handleShowLeaderboard);

    // ==========================================
    // NEXT QUESTION (Supports game:next-question & host:next_question)
    // ==========================================
    const handleNextQuestion = ({ code, roomCode } = {}, callback) => {
      let targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      if (!targetCode) {
        const active = gameEngine.getActiveRoom();
        if (active) targetCode = active.code;
      }
      console.log(`⏩ [NEXT QUESTION] Room: ${targetCode}`);
      if (!authHost(targetCode, callback)) return;
      try {
        const result = gameEngine.nextQuestion(targetCode);
        const room = result.room;

        if (result.finished) {
          io.to(targetCode).emit('game:completed', {
            leaderboards: result.leaderboards,
            message: 'Workshop completed! Incredible work, instructors! 🚀'
          });
          if (typeof callback === 'function') callback({ success: true, finished: true });
          return;
        }

        const question = result.question;

        if (question.type === 'reflection' || room.state === ROOM_STATES.REFLECTION) {
          emitQuestion(io, targetCode, 'reflection:active', {
            question,
            questionIndex: result.questionIndex,
            totalQuestions: result.totalQuestions
          });
          emitQuestion(io, targetCode, 'question:started', {
            question,
            timeLimit: question.timeLimit || 90,
            index: result.questionIndex,
            total: result.totalQuestions
          });
        } else {
          startRoomTimer(io, targetCode, room.questionTimeLimit || question.timeLimit || 30);

          emitQuestion(io, targetCode, 'question:started', {
            question,
            timeLimit: room.questionTimeLimit || question.timeLimit || 30,
            index: result.questionIndex,
            total: result.totalQuestions
          });

        }

        if (typeof callback === 'function') callback({ success: true, finished: false });
      } catch (err) {
        console.error('Next question error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:next-question', handleNextQuestion);

    // ==========================================
    // SUBMIT REFLECTION (Supports reflection:submit & participant:submit_reflection)
    // ==========================================
    let lastReflectionAt = 0;
    const handleSubmitReflection = ({ roomCode, code, behaviorText, text, category }, callback) => {
      if (Date.now() - lastReflectionAt < 1000) return callback?.({ success: false, error: 'Too fast' });
      lastReflectionAt = Date.now();
      const targetCode = (roomCode || code || socket.roomCode || '').toUpperCase().trim();
      const pid = socket.participantId;
      const refText = String(behaviorText || text || '').slice(0, 500);

      console.log(`💡 [REFLECTION SUBMITTED] Room: ${targetCode}, Text: "${refText}"`);

      try {
        const reflection = gameEngine.submitReflection({
          roomCode: targetCode,
          participantId: pid,
          text: refText,
          category: typeof category === 'string' ? category.slice(0, 30) : undefined
        });

        io.to(targetCode).emit('reflection:added', { reflection });

        if (typeof callback === 'function') callback({ success: true, reflection });
      } catch (err) {
        console.error('Submit reflection error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('reflection:submit', handleSubmitReflection);

    // ==========================================
    // PARTICIPANT REACTION
    // ==========================================
    let lastReactAt = 0;
    socket.on('participant:react', ({ emoji } = {}) => {
      const now = Date.now();
      if (now - lastReactAt < 300 || typeof emoji !== 'string' || !emoji || !socket.roomCode) return;
      lastReactAt = now;
      const name = gameEngine.getRoom(socket.roomCode)?.participants?.[socket.participantId]?.name || '';
      io.to(socket.roomCode).emit('room:reaction', { emoji: emoji.slice(0, 8), participantName: name });
    });

    // ==========================================
    // ADJUST POINTS & TOGGLE TEAM MODE
    // ==========================================
    socket.on('game:adjust-points', ({ code, targetId, isTeam, pointsDelta }) => {
      const targetCode = (code || socket.roomCode || '').toUpperCase().trim();
      if (!authHost(targetCode)) return;
      pointsDelta = Math.trunc(Number(pointsDelta));
      if (!Number.isFinite(pointsDelta) || Math.abs(pointsDelta) > 100000) return;
      try {
        const room = gameEngine.getRoom(targetCode);
        if (!room) return;

        if (isTeam) {
          for (const p of Object.values(room.participants)) {
            if (p.team === targetId) {
              p.score = Math.max(0, p.score + pointsDelta);
            }
          }
        } else {
          if (room.participants[targetId]) {
            room.participants[targetId].score = Math.max(0, room.participants[targetId].score + pointsDelta);
          }
        }
        gameEngine.saveRoomToDb(room);
        const leaderboards = gameEngine.getLeaderboards(targetCode);
        const teamScores = {};
        for (const t of leaderboards.team) {
          teamScores[t.team] = t.totalScore;
        }

        io.to(targetCode).emit('leaderboard:updated', {
          participants: leaderboards.individual,
          teamScores
        });
      } catch (err) {
        console.error('Adjust points error:', err);
      }
    });

    socket.on('game:toggle-team-mode', ({ code, teamMode, mode }) => {
      const targetCode = (code || socket.roomCode || '').toUpperCase().trim();
      if (!authHost(targetCode)) return;
      const room = gameEngine.getRoom(targetCode);
      if (room) {
        if (typeof teamMode === 'boolean') {
          room.mode = teamMode ? 'team' : 'individual';
        } else if (mode === 'individual' || mode === 'team') {
          room.mode = mode;
        } else {
          room.mode = room.mode === 'team' ? 'individual' : 'team';
        }
        gameEngine.saveRoomToDb(room);
        broadcastRoom(io, room);
      }
    });

    // ==========================================
    // SHUFFLE TEAMS (Balanced Partitioning)
    // ==========================================
    const handleShuffleTeams = ({ code, roomCode, teamCount }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`🔀 [SHUFFLE TEAMS] Room: ${targetCode}, Team Count: ${teamCount}`);
      if (!authHost(targetCode, callback)) return;
      try {
        const room = gameEngine.shuffleTeams(targetCode, teamCount);
        const clientRoom = formatClientRoom(room, room.hostSocketId);

        broadcastRoom(io, room);
        const shuffled = {
          teamCount: room.selectedTeamCount || teamCount || 4,
          participants: Object.values(room.participants)
        };
        emitSplit(io, targetCode, 'teams:shuffled', shuffled,
          { ...shuffled, participants: Object.values(formatPlayerRoom(room).participants) });

        if (typeof callback === 'function') {
          callback({ success: true, room: clientRoom });
        }
      } catch (err) {
        console.error('Shuffle teams error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: err.message });
        }
      }
    };

    socket.on('game:shuffle-teams', handleShuffleTeams);

    socket.on('team:move', ({ code, participantId, team } = {}) => {
      const targetCode = (code || socket.roomCode || '').toUpperCase().trim();
      if (!authHost(targetCode)) return;
      const room = gameEngine.getRoom(targetCode);
      const p = room?.participants?.[participantId];
      if (!p || !TEAMS.some((t) => t.name === team)) return;
      p.team = team;
      room.updatedAt = Date.now();
      gameEngine.saveRoomToDb(room);
      broadcastRoom(io, room);
    });

    socket.on('game:pause-toggle', ({ code }) => {
      const targetCode = (code || socket.roomCode || '').toUpperCase().trim();
      console.log(`⏸️ [PAUSE TOGGLED] Room: ${targetCode}`);
      if (!authHost(targetCode)) return;
      const room = gameEngine.getRoom(targetCode);
      if (!room) return;

      // Toggle paused state
      room.isPaused = !room.isPaused;
      room.updatedAt = Date.now();
      gameEngine.saveRoomToDb(room);

      if (room.isPaused) {
        stopRoomTimer(targetCode);
        console.log(`⏸️ Room ${targetCode} paused at ${room.currentTimeRemaining}s`);
      } else {
        // Resume timer with remaining time
        if ((room.state === ROOM_STATES.QUESTION_ACTIVE || room.state === ROOM_STATES.REFLECTION) && room.questionTimeLimit > 0) {
          const resumeTime = room.currentTimeRemaining !== undefined ? room.currentTimeRemaining : room.questionTimeLimit;
          if (resumeTime > 0) {
            startRoomTimer(io, targetCode, resumeTime);
          }
        }
        console.log(`▶ Room ${targetCode} resumed`);
      }

      broadcastRoom(io, room);
    });

    // ==========================================
    // END / RESET WORKSHOP (Single Room Engine)
    // ==========================================
    const handleEndRoom = ({ code, roomCode } = {}) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      if (!authHost(targetCode)) return;
      console.log(`🛑 [END WORKSHOP] Room: ${targetCode}`);
      stopRoomTimer(targetCode);
      io.to(targetCode).emit('room:ended', {
        message: 'The facilitator has ended this workshop. Thank you for participating!'
      });
      gameEngine.endRoom(targetCode);
    };

    socket.on('room:end', handleEndRoom);

    // ==========================================
    // DISCONNECT
    // ==========================================
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Client disconnected: ${socket.id} (${reason})`);
      try {
        const updatedRooms = gameEngine.handleDisconnect(socket.id);
        for (const item of updatedRooms) {
          if (item.participant) {
            const onlineCount = Object.values(item.room.participants).filter(p => p.isOnline).length;
            io.to(`${item.room.code}:host`).emit('room:participant-offline', {
              participantId: item.participant.id,
              count: onlineCount
            });
            hostRoomUpdate(io, item.room);
          }
        }
      } catch (err) {
        console.error('Disconnect cleanup error:', err);
      }
    });
  });
}
