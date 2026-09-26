import { gameEngine, ROOM_STATES, toClientStatus, formatClientRoom } from './gameEngine.js';
import { db } from './storage/db.js';

// Active question interval timers per room: roomCode -> timerId
const roomTimers = new Map();

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

    // ==========================================
    // ROOM CREATION (Supports room:create & host:create_room)
    // ==========================================
    const handleCreateRoom = async ({ gameId, mode, teamMode, code, customCode, forceNew } = {}, callback) => {
      try {
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
        socket.emit('host:room_created', response);

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
    socket.on('host:create_room', handleCreateRoom);

    // ==========================================
    // GET ACTIVE ROOM (Single Room Query)
    // ==========================================
    socket.on('room:get-active', (callback) => {
      const active = gameEngine.getActiveRoom();
      const resp = active ? {
        success: true,
        hasActiveRoom: true,
        roomCode: active.code,
        gameId: active.gameId,
        status: active.state
      } : {
        success: true,
        hasActiveRoom: false,
        roomCode: null
      };
      if (typeof callback === 'function') callback(resp);
    });

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
        const clientRoom = formatClientRoom(updatedRoom);

        const response = {
          success: true,
          participant,
          isReconnect,
          room: clientRoom
        };

        console.log(`🎉 [JOIN SUCCESS] Participant: ${participant.name} (${participant.id}) in Room: ${targetCode}`);

        // Direct response to the participant socket
        socket.emit('room:joined', { participant, room: clientRoom });
        socket.emit('participant:join_success', response);

        // Broadcast to all sockets in the room (including host)
        io.to(targetCode).emit('room:participant-joined', {
          participant,
          count: Object.values(updatedRoom.participants).length
        });

        io.to(targetCode).emit('participant:joined', {
          participant,
          isReconnect,
          totalParticipants: Object.values(updatedRoom.participants).length,
          participantsList: Object.values(updatedRoom.participants)
        });

        // Also update full room state
        io.to(targetCode).emit('room:updated', { room: clientRoom });

        if (typeof callback === 'function') {
          callback(response);
        }
      } catch (err) {
        console.error(`❌ [JOIN ERROR] Room: "${targetCode}":`, err.message);
        const errResp = { success: false, error: err.message, message: err.message };
        socket.emit('participant:join_error', errResp);
        socket.emit('room:error', { message: err.message });
        if (typeof callback === 'function') {
          callback(errResp);
        }
      }
    };

    socket.on('room:join', handleJoin);
    socket.on('participant:join', handleJoin);

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
        participant.socketId = socket.id;
        participant.isOnline = true;
        participant.lastActive = Date.now();
        gameEngine.saveRoomToDb(room);

        socket.roomCode = targetCode;
        socket.participantId = participant.id;
        socket.join(targetCode);

        const clientRoom = formatClientRoom(room);

        const currentQuestion = gameEngine.getCurrentQuestion(room);

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
        io.to(targetCode).emit('room:participant-reconnected', {
          participant,
          count: Object.values(room.participants).filter(p => p.isOnline).length
        });
        io.to(targetCode).emit('room:updated', { room: clientRoom });
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
        socket.emit('host:sync', response);
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
      try {
        const room = gameEngine.startGame(targetCode);
        const rawQuestion = gameEngine.getCurrentQuestion(room);

        // Start server countdown timer tick
        startRoomTimer(io, targetCode, room.questionTimeLimit || rawQuestion.timeLimit || 30);

        // Broadcast to all participants & host
        io.to(targetCode).emit('question:started', {
          question: rawQuestion,
          timeLimit: room.questionTimeLimit || rawQuestion.timeLimit || 30,
          index: room.currentQuestionIndex,
          total: room.game.questions.length
        });

        io.to(targetCode).emit('game:started', {
          roomCode: targetCode,
          state: room.state,
          currentQuestionIndex: room.currentQuestionIndex,
          totalQuestions: room.game.questions.length
        });

        io.to(`${targetCode}:host`).emit('host:question_active', {
          question: rawQuestion,
          questionIndex: room.currentQuestionIndex,
          totalQuestions: room.game.questions.length,
          timeLimit: room.questionTimeLimit,
          distribution: gameEngine.calculateAnswerDistribution(room)
        });

        if (typeof callback === 'function') callback({ success: true, room });
      } catch (err) {
        console.error('Start game error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:start', handleStartGame);
    socket.on('host:start_game', handleStartGame);

    // ==========================================
    // SUBMIT ANSWER (Supports game:submit-answer & participant:submit_answer)
    // ==========================================
    const handleSubmitAnswer = ({ participantId, roomCode, code, questionId, answer, optionId, timeRemaining, responseTimeMs }, callback) => {
      const targetCode = (roomCode || code || socket.roomCode || '').toUpperCase().trim();
      const pid = participantId || socket.participantId;
      const optId = optionId || answer;
      const respTime = responseTimeMs || ((30 - (timeRemaining || 0)) * 1000);

      console.log(`📝 [ANSWER SUBMITTED] Room: ${targetCode}, PID: ${pid}, Choice: ${optId}`);

      try {
        const result = gameEngine.submitAnswer({
          roomCode: targetCode,
          participantId: pid,
          optionId: optId,
          responseTimeMs: respTime
        });

        const room = gameEngine.getRoom(targetCode);
        const answeredCount = Object.keys(room?.answers?.[room.currentQuestionIndex] || {}).length;
        const totalParticipants = Object.keys(room?.participants || {}).length;

        // Broadcast answered update to host
        io.to(targetCode).emit('question:answered', {
          participantId: pid,
          answeredCount,
          totalParticipants
        });

        io.to(targetCode).emit('distribution:update', result.distribution);

        const response = {
          success: true,
          optionId: optId,
          alreadyAnswered: result.alreadyAnswered || false,
          answer: result.answer
        };

        socket.emit('answer:submitted', response);
        if (typeof callback === 'function') callback(response);
      } catch (err) {
        console.error('Submit answer error:', err);
        const errResp = { success: false, error: err.message };
        socket.emit('answer:error', errResp);
        if (typeof callback === 'function') callback(errResp);
      }
    };

    socket.on('game:submit-answer', handleSubmitAnswer);
    socket.on('participant:submit_answer', handleSubmitAnswer);

    // ==========================================
    // REVEAL PLAYERS ANSWERS
    // ==========================================
    const handleRevealPlayersAnswers = ({ code, roomCode }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`👁️ [REVEAL PLAYERS ANSWERS] Room: ${targetCode}`);
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
        io.to(targetCode).emit('players-answers:revealed', {
          correctAnswer: null, // intentionally hide correct answer
          explanation: '', // hide explanation
          distributions: optionsMap,
          stats,
          learningObjective: '',
          discussionQuestion: '',
          leaderboards
        });

        if (typeof callback === 'function') callback({ success: true });
      } catch (err) {
        console.error('Error revealing players answers:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:reveal-players-answers', handleRevealPlayersAnswers);
    socket.on('host:reveal_players_answers', handleRevealPlayersAnswers);

    // ==========================================
    // REVEAL ANSWER (Supports game:reveal-answer & host:reveal_answer)
    // ==========================================
    const handleRevealAnswer = ({ code, roomCode }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`🔍 [REVEAL ANSWER] Room: ${targetCode}`);
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
        io.to(targetCode).emit('answer:revealed', payload);

        if (typeof callback === 'function') callback({ success: true, stats, leaderboards });
      } catch (err) {
        console.error('Reveal answer error:', err.message, err.stack);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:reveal-answer', handleRevealAnswer);
    socket.on('host:reveal_answer', handleRevealAnswer);

    // ==========================================
    // SHOW LEADERBOARD (Supports game:show-leaderboard & host:show_leaderboard)
    // ==========================================
    const handleShowLeaderboard = ({ code, roomCode }, callback) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`🏆 [SHOW LEADERBOARD] Room: ${targetCode}`);
      try {
        const { room, leaderboards } = gameEngine.showLeaderboard(targetCode);

        const teamScores = {};
        for (const t of leaderboards.team) {
          teamScores[t.team] = t.totalScore;
        }

        const payload = {
          participants: leaderboards.individual,
          teamScores,
          individualLeaderboard: leaderboards.individual,
          teamLeaderboard: leaderboards.team,
          mode: room.mode
        };

        io.to(targetCode).emit('leaderboard:updated', payload);
        io.to(targetCode).emit('leaderboard:update', payload);

        if (typeof callback === 'function') callback({ success: true, leaderboards });
      } catch (err) {
        console.error('Show leaderboard error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:show-leaderboard', handleShowLeaderboard);
    socket.on('host:show_leaderboard', handleShowLeaderboard);

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
          io.to(targetCode).emit('reflection:active', {
            question,
            questionIndex: result.questionIndex,
            totalQuestions: result.totalQuestions
          });
          io.to(targetCode).emit('question:started', {
            question,
            timeLimit: question.timeLimit || 90,
            index: result.questionIndex,
            total: result.totalQuestions
          });
        } else {
          startRoomTimer(io, targetCode, room.questionTimeLimit || question.timeLimit || 30);

          io.to(targetCode).emit('question:started', {
            question,
            timeLimit: room.questionTimeLimit || question.timeLimit || 30,
            index: result.questionIndex,
            total: result.totalQuestions
          });

          io.to(`${targetCode}:host`).emit('host:question_active', {
            question,
            questionIndex: result.questionIndex,
            totalQuestions: result.totalQuestions,
            timeLimit: room.questionTimeLimit,
            distribution: gameEngine.calculateAnswerDistribution(room)
          });
        }

        if (typeof callback === 'function') callback({ success: true, finished: false });
      } catch (err) {
        console.error('Next question error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('game:next-question', handleNextQuestion);
    socket.on('host:next_question', handleNextQuestion);

    // ==========================================
    // SUBMIT REFLECTION (Supports reflection:submit & participant:submit_reflection)
    // ==========================================
    const handleSubmitReflection = ({ roomCode, code, participantId, behaviorText, text, category }, callback) => {
      const targetCode = (roomCode || code || socket.roomCode || '').toUpperCase().trim();
      const pid = participantId || socket.participantId;
      const refText = behaviorText || text;

      console.log(`💡 [REFLECTION SUBMITTED] Room: ${targetCode}, Text: "${refText}"`);

      try {
        const reflection = gameEngine.submitReflection({
          roomCode: targetCode,
          participantId: pid,
          text: refText,
          category
        });

        socket.emit('reflection:submitted', { success: true, reflection });
        io.to(targetCode).emit('reflection:added', { reflection });
        io.to(targetCode).emit('reflection:new', reflection);

        if (typeof callback === 'function') callback({ success: true, reflection });
      } catch (err) {
        console.error('Submit reflection error:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    };

    socket.on('reflection:submit', handleSubmitReflection);
    socket.on('participant:submit_reflection', handleSubmitReflection);

    // ==========================================
    // PARTICIPANT REACTION
    // ==========================================
    socket.on('participant:react', ({ roomCode, emoji }) => {
      const targetCode = (roomCode || socket.roomCode || '').toUpperCase().trim();
      if (!targetCode || !emoji) return;
      io.to(targetCode).emit('room:reaction', { emoji });
    });

    // ==========================================
    // ADJUST POINTS & TOGGLE TEAM MODE
    // ==========================================
    socket.on('game:adjust-points', ({ code, targetId, isTeam, pointsDelta }) => {
      const targetCode = (code || socket.roomCode || '').toUpperCase().trim();
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

    socket.on('game:toggle-team-mode', ({ code }) => {
      const targetCode = (code || socket.roomCode || '').toUpperCase().trim();
      const room = gameEngine.getRoom(targetCode);
        if (room) {
          room.mode = room.mode === 'team' ? 'individual' : 'team';
          gameEngine.saveRoomToDb(room);
          io.to(targetCode).emit('room:updated', { 
            room: formatClientRoom(room)
          });
        }
    });

    socket.on('game:pause-toggle', ({ code }) => {
      const targetCode = (code || socket.roomCode || '').toUpperCase().trim();
      console.log(`⏸️ [PAUSE TOGGLED] Room: ${targetCode}`);
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

      io.to(targetCode).emit('room:updated', {
        room: formatClientRoom(room)
      });
    });

    // ==========================================
    // END / RESET WORKSHOP (Single Room Engine)
    // ==========================================
    const handleEndRoom = ({ code, roomCode }) => {
      const targetCode = (code || roomCode || socket.roomCode || '').toUpperCase().trim();
      console.log(`🛑 [END WORKSHOP] Room: ${targetCode}`);
      stopRoomTimer(targetCode);
      io.to(targetCode).emit('room:ended', {
        message: 'The facilitator has ended this workshop. Thank you for participating!'
      });
      gameEngine.endRoom(targetCode);
    };

    socket.on('room:end', handleEndRoom);
    socket.on('host:end_workshop', handleEndRoom);

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
            io.to(item.room.code).emit('room:participant-offline', {
              participantId: item.participant.id,
              count: onlineCount
            });
            io.to(item.room.code).emit('room:participant-left', {
              participantId: item.participant.id,
              count: onlineCount
            });
            io.to(item.room.code).emit('room:updated', {
              room: {
                code: item.room.code,
                participants: item.room.participants
              }
            });
          }
        }
      } catch (err) {
        console.error('Disconnect cleanup error:', err);
      }
    });
  });
}
