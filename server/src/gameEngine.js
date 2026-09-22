import crypto from 'crypto';
import { db } from './storage/db.js';

export const ROOM_STATES = {
  LOBBY: 'LOBBY',
  QUESTION_ACTIVE: 'QUESTION_ACTIVE',
  ANSWER_REVEALED: 'ANSWER_REVEALED',
  DEBRIEF: 'DEBRIEF',
  LEADERBOARD: 'LEADERBOARD',
  REFLECTION: 'REFLECTION',
  COMPLETED: 'COMPLETED'
};

/**
 * Normalizes internal server room state to the frontend RoomStatus string.
 * Prevents host/participant UI crashes when state names differ.
 */
export function toClientStatus(state, gameId) {
  if (!state) return 'lobby';
  const s = String(state).trim().toUpperCase();
  switch (s) {
    case ROOM_STATES.LOBBY:
      return 'lobby';
    case ROOM_STATES.QUESTION_ACTIVE:
    case 'QUESTION':
      if (gameId === 'game-7') return 'escape-room';
      if (gameId === 'game-8') return 'reflection-wall';
      return 'question';
    case 'ESCAPE-ROOM':
    case 'ESCAPE_ROOM':
      return 'escape-room';
    case ROOM_STATES.REFLECTION:
    case 'REFLECTION-WALL':
    case 'REFLECTION_WALL':
      return 'reflection-wall';
    case ROOM_STATES.ANSWER_REVEALED:
    case 'ANSWER-REVEALED':
    case ROOM_STATES.DEBRIEF:
    case 'REVEALING':
      return 'revealing';
    case ROOM_STATES.LEADERBOARD:
    case ROOM_STATES.COMPLETED:
    case 'ENDED':
      return 'leaderboard';
    default: {
      const lower = s.toLowerCase();
      if (['lobby', 'question', 'revealing', 'leaderboard', 'escape-room', 'reflection-wall', 'ended'].includes(lower)) {
        return lower;
      }
      return 'question';
    }
  }
}

/**
 * Formats a room object strictly adhering to the client-side Room interface.
 */
export function formatClientRoom(room, hostSocketId = null) {
  if (!room) return null;
  return {
    code: room.code,
    hostSocketId: hostSocketId || room.hostSocketId || null,
    currentGameId: room.gameId,
    currentQuestionIndex: room.currentQuestionIndex ?? 0,
    status: toClientStatus(room.state, room.gameId),
    isPaused: !!room.isPaused,
    timeRemaining: room.currentTimeRemaining !== undefined ? room.currentTimeRemaining : (room.questionTimeLimit || 30),
    participants: room.participants || {},
    submissions: room.submissions || room.answers?.[room.currentQuestionIndex] || {},
    teamMode: room.mode === 'team',
    reflections: room.reflections || []
  };
}

export const TEAMS = [
  { id: 'Team Alpha', name: 'Team Alpha', color: '#F59E0B', badge: '🦁' },
  { id: 'Team Beta', name: 'Team Beta', color: '#3B82F6', badge: '🦅' },
  { id: 'Team Gamma', name: 'Team Gamma', color: '#10B981', badge: '🐺' },
  { id: 'Team Delta', name: 'Team Delta', color: '#8B5CF6', badge: '🐉' }
];

const DEFAULT_AVATARS = ['🚀', '⚡', '💡', '🎯', '🔥', '🌟', '🧠', '🛠️', '💻', '🎨'];

/**
 * In-memory active rooms cache for ultra-fast Socket.IO lookups,
 * backed by JSON persistence in db.js.
 */
class GameEngine {
  constructor() {
    this.rooms = new Map(); // roomCode -> roomObject
    this.loadActiveRoomsFromDb();
  }

  loadActiveRoomsFromDb() {
    try {
      const persistedRooms = db.getRooms();
      for (const [code, room] of Object.entries(persistedRooms)) {
        if (room && room.code) {
          // Reset socket IDs and online flags on server boot
          if (room.participants) {
            for (const pid of Object.keys(room.participants)) {
              room.participants[pid].socketId = null;
              room.participants[pid].isOnline = false;
            }
          }
          room.hostSocketId = null;
          this.rooms.set(code.toUpperCase(), room);
        }
      }
      console.log(`📦 Loaded ${this.rooms.size} rooms from persistence.`);
    } catch (err) {
      console.error('Error loading rooms from storage:', err);
    }
  }

  generateRoomCode() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code;
    let attempts = 0;
    do {
      if (attempts < 50) {
        code = 'B2B' + chars[Math.floor(Math.random() * chars.length)] + chars[Math.floor(Math.random() * chars.length)];
      } else {
        code = '';
        for (let i = 0; i < 5; i++) {
          code += chars[Math.floor(Math.random() * chars.length)];
        }
      }
      attempts++;
    } while (this.rooms.has(code) && attempts < 200);
    return code;
  }

  saveRoomToDb(room) {
    if (!room) return;
    try {
      db.saveRoom(room);
    } catch (err) {
      console.error(`Failed to persist room ${room.code}:`, err);
    }
  }

  createRoom({ gameId, mode = 'individual', hostSocketId = null, code = null, customCode = null }) {
    const games = db.getGames();
    let selectedGame = games.find(g => g.id === gameId);
    if (!selectedGame) {
      selectedGame = games[0] || null;
    }

    if (!selectedGame) {
      throw new Error('No games available to create a room');
    }

    const roomCode = (code || customCode || this.generateRoomCode()).toUpperCase();
    const hostToken = crypto.randomBytes(16).toString('hex');

    // If room already exists, update host socket and return it
    if (this.rooms.has(roomCode)) {
      const existing = this.rooms.get(roomCode);
      if (hostSocketId) existing.hostSocketId = hostSocketId;
      return existing;
    }

    const room = {
      code: roomCode,
      hostToken,
      hostSocketId,
      gameId: selectedGame.id,
      game: selectedGame,
      mode: mode === 'team' ? 'team' : 'individual',
      state: ROOM_STATES.LOBBY,
      isPaused: false,
      currentQuestionIndex: 0,
      questionStartTime: null,
      questionTimeLimit: 30,
      participants: {}, // participantId -> participantData
      answers: {}, // questionIndex -> { [participantId]: answerData }
      reflections: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.rooms.set(roomCode, room);
    this.saveRoomToDb(room);
    console.log(`🎮 Room created: ${roomCode} with game "${selectedGame.title}" [Mode: ${room.mode}]`);
    return room;
  }

  getRoom(code) {
    if (!code) return null;
    return this.rooms.get(code.toUpperCase()) || null;
  }

  updateHostSocket(roomCode, socketId, hostToken) {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    if (room.hostToken && hostToken && room.hostToken !== hostToken) {
      return false;
    }
    room.hostSocketId = socketId;
    room.updatedAt = Date.now();
    return true;
  }

  validateHost(roomCode, hostToken) {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    if (!room.hostToken || !hostToken) return false;
    return room.hostToken === hostToken;
  }

  joinParticipant({ roomCode, name, avatar, participantId, socketId }) {
    let room = this.getRoom(roomCode);
    if (!room) {
      // Auto-create room if participant joins a valid code
      console.log(`⚠️ Room ${roomCode} not found on join, auto-creating lobby...`);
      room = this.createRoom({ code: roomCode });
    }

    const cleanName = (name || '').trim() || 'Anonymous Player';
    const pid = participantId || crypto.randomUUID();

    // Check if participant already exists (reconnection scenario)
    if (room.participants[pid]) {
      const existing = room.participants[pid];
      existing.socketId = socketId;
      existing.isOnline = true;
      existing.lastActive = Date.now();
      if (name && name.trim()) existing.name = name.trim();
      if (avatar) existing.avatar = avatar;
      room.updatedAt = Date.now();
      this.saveRoomToDb(room);
      return { participant: existing, isReconnect: true, room };
    }

    // Assign team if in team mode or round-robin balance
    const availableTeams = TEAMS.map(t => t.name);
    let assignedTeam = null;
    if (room.mode === 'team') {
      // Find team with least members
      const teamCounts = availableTeams.reduce((acc, t) => {
        acc[t] = 0;
        return acc;
      }, {});
      for (const p of Object.values(room.participants)) {
        if (p.team && teamCounts[p.team] !== undefined) {
          teamCounts[p.team]++;
        }
      }
      assignedTeam = availableTeams.reduce((minTeam, currentTeam) => {
        return teamCounts[currentTeam] < teamCounts[minTeam] ? currentTeam : minTeam;
      }, availableTeams[0]);
    }

    const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

    const newParticipant = {
      id: pid,
      socketId,
      name: cleanName,
      avatar: avatar || randomAvatar,
      team: assignedTeam,
      score: 0,
      streak: 0,
      isOnline: true,
      joinedAt: Date.now(),
      lastActive: Date.now(),
      answers: {}
    };

    room.participants[pid] = newParticipant;
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);

    console.log(`👤 Participant joined room ${room.code}: ${cleanName} (${pid})`);
    return { participant: newParticipant, isReconnect: false, room };
  }

  setParticipantTeam(roomCode, participantId, teamName) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    const participant = room.participants[participantId];
    if (!participant) return null;

    const validTeam = TEAMS.find(t => t.name.toLowerCase() === teamName.toLowerCase());
    if (!validTeam) return null;

    participant.team = validTeam.name;
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);
    return participant;
  }

  setRoomMode(roomCode, mode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;
    room.mode = mode === 'team' ? 'team' : 'individual';
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);
    return room;
  }

  handleDisconnect(socketId) {
    const updatedRooms = [];
    for (const room of this.rooms.values()) {
      let changed = false;
      // Check participants
      for (const participant of Object.values(room.participants)) {
        if (participant.socketId === socketId) {
          participant.isOnline = false;
          participant.socketId = null;
          participant.lastActive = Date.now();
          changed = true;
          updatedRooms.push({ room, participant, isHost: false });
        }
      }
      // Check host
      if (room.hostSocketId === socketId) {
        room.hostSocketId = null;
        changed = true;
        updatedRooms.push({ room, isHost: true });
      }
      if (changed) {
        room.updatedAt = Date.now();
        this.saveRoomToDb(room);
      }
    }
    return updatedRooms;
  }

  getCurrentQuestion(room) {
    if (!room || !room.game || !room.game.questions) return null;
    return room.game.questions[room.currentQuestionIndex] || null;
  }

  startGame(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const question = this.getCurrentQuestion(room);
    if (!question) throw new Error('No questions found in game');

    if (question.type === 'reflection' || room.gameId === 'game-8') {
      room.state = ROOM_STATES.REFLECTION;
    } else {
      room.state = ROOM_STATES.QUESTION_ACTIVE;
    }
    room.isPaused = false;
    room.currentQuestionIndex = 0;
    room.questionStartTime = Date.now();
    room.questionTimeLimit = question.timeLimit || 30;
    if (!room.answers[0]) {
      room.answers[0] = {};
    }
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);
    return room;
  }

  submitAnswer({ roomCode, participantId, optionId, responseTimeMs = null }) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.state !== ROOM_STATES.QUESTION_ACTIVE) {
      throw new Error('Question is not currently active');
    }

    const participant = room.participants[participantId];
    if (!participant) throw new Error('Participant not found');

    const qIndex = room.currentQuestionIndex;
    if (!room.answers[qIndex]) {
      room.answers[qIndex] = {};
    }

    // Check if already answered
    if (room.answers[qIndex][participantId]) {
      return {
        alreadyAnswered: true,
        answer: room.answers[qIndex][participantId],
        distribution: this.calculateAnswerDistribution(room)
      };
    }

    const question = this.getCurrentQuestion(room);
    const timeLimitMs = (room.questionTimeLimit || 30) * 1000;
    const now = Date.now();
    const actualResponseTime = responseTimeMs !== null ? responseTimeMs : (now - (room.questionStartTime || now));
    const clampedResponseTime = Math.max(100, Math.min(timeLimitMs, actualResponseTime));

    // Scoring Engine
    const isCorrect = question.correctAnswer === null || question.correctAnswer === undefined
      ? true // Reflection or voting without single correct answer
      : String(question.correctAnswer).trim().toUpperCase() === String(optionId).trim().toUpperCase();

    const basePoints = question.points || 1000;
    let speedBonus = 0;
    let streakBonus = 0;
    let pointsEarned = 0;

    if (isCorrect) {
      // Speed bonus: up to 200 points based on fraction of remaining time
      const remainingFraction = Math.max(0, Math.min(1, (timeLimitMs - clampedResponseTime) / timeLimitMs));
      speedBonus = Math.round(remainingFraction * 200);

      // Streak bonus: 50 pts per step after 1st correct
      participant.streak = (participant.streak || 0) + 1;
      if (participant.streak > 1) {
        streakBonus = 50;
      }

      pointsEarned = basePoints + speedBonus + streakBonus;
    } else {
      participant.streak = 0;
      pointsEarned = 0;
    }

    participant.score += pointsEarned;
    participant.lastActive = now;

    const answerRecord = {
      participantId,
      participantName: participant.name,
      team: participant.team,
      optionId,
      responseTimeMs: clampedResponseTime,
      isCorrect,
      basePoints,
      speedBonus,
      streakBonus,
      pointsEarned,
      submittedAt: now
    };

    room.answers[qIndex][participantId] = answerRecord;
    participant.answers[question.id || `q-${qIndex}`] = answerRecord;

    room.updatedAt = now;
    this.saveRoomToDb(room);

    const distribution = this.calculateAnswerDistribution(room);
    const totalParticipants = Object.values(room.participants).filter(p => p.isOnline).length;
    const totalSubmitted = Object.keys(room.answers[qIndex]).length;
    const allAnswered = totalSubmitted >= totalParticipants && totalParticipants > 0;

    return {
      success: true,
      answer: answerRecord,
      distribution,
      totalSubmitted,
      totalParticipants,
      allAnswered
    };
  }

  calculateAnswerDistribution(room) {
    const question = this.getCurrentQuestion(room);
    if (!question) return {};

    const qIndex = room.currentQuestionIndex;
    const currentAnswers = room.answers[qIndex] || {};
    const totalSubmitted = Object.keys(currentAnswers).length;

    const distribution = {};
    if (Array.isArray(question.options)) {
      for (const opt of question.options) {
        distribution[opt.id] = {
          id: opt.id,
          text: opt.text,
          count: 0,
          percentage: 0
        };
      }
    }

    for (const ans of Object.values(currentAnswers)) {
      const optId = ans.optionId;
      if (distribution[optId]) {
        distribution[optId].count++;
      } else {
        distribution[optId] = { id: optId, text: optId, count: 1, percentage: 0 };
      }
    }

    for (const key of Object.keys(distribution)) {
      distribution[key].percentage = totalSubmitted > 0
        ? Math.round((distribution[key].count / totalSubmitted) * 100)
        : 0;
    }

    return {
      options: distribution,
      totalSubmitted,
      totalParticipants: Object.values(room.participants).length
    };
  }

  revealAnswer(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    room.state = ROOM_STATES.ANSWER_REVEALED;
    room.isPaused = false;
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);

    const question = this.getCurrentQuestion(room);
    const distribution = this.calculateAnswerDistribution(room);
    const leaderboards = this.getLeaderboards(roomCode);

    return {
      room,
      question,
      distribution,
      leaderboards
    };
  }

  showDebrief(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    room.state = ROOM_STATES.DEBRIEF;
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);

    const question = this.getCurrentQuestion(room);
    return {
      room,
      debrief: {
        learningObjective: question?.learningObjective || '',
        discussionQuestion: question?.discussionQuestion || '',
        facilitatorTips: question?.facilitatorTips || '',
        explanation: question?.explanation || ''
      }
    };
  }

  showLeaderboard(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    room.state = ROOM_STATES.LEADERBOARD;
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);

    const leaderboards = this.getLeaderboards(roomCode);
    return { room, leaderboards };
  }

  nextQuestion(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const nextIndex = room.currentQuestionIndex + 1;
    const totalQuestions = room.game?.questions?.length || 0;

    if (nextIndex < totalQuestions) {
      room.currentQuestionIndex = nextIndex;
      const question = room.game.questions[nextIndex];
      
      // If it's a reflection question, move to reflection state
      if (question.type === 'reflection') {
        room.state = ROOM_STATES.REFLECTION;
      } else {
        room.state = ROOM_STATES.QUESTION_ACTIVE;
      }

      room.isPaused = false;
      room.questionStartTime = Date.now();
      room.questionTimeLimit = question.timeLimit || 30;
      if (!room.answers[nextIndex]) {
        room.answers[nextIndex] = {};
      }
      room.updatedAt = Date.now();
      this.saveRoomToDb(room);
      return { room, finished: false, question, questionIndex: nextIndex, totalQuestions };
    } else {
      // Finished all questions in current game
      room.state = ROOM_STATES.COMPLETED;
      room.isPaused = false;
      room.updatedAt = Date.now();
      this.saveRoomToDb(room);
      const leaderboards = this.getLeaderboards(roomCode);
      return { room, finished: true, leaderboards };
    }
  }

  adjustPoints({ roomCode, participantId, pointsDelta, reason }) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const participant = room.participants[participantId];
    if (!participant) throw new Error('Participant not found');

    const delta = parseInt(pointsDelta, 10) || 0;
    participant.score = Math.max(0, participant.score + delta);
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);

    const leaderboards = this.getLeaderboards(roomCode);
    return { participant, delta, reason, leaderboards };
  }

  submitReflection({ roomCode, participantId, text, category = 'commitment' }) {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const participant = room.participants[participantId];
    const participantName = participant ? participant.name : 'Anonymous';
    const team = participant ? participant.team : null;

    const reflection = {
      id: crypto.randomUUID(),
      roomCode: room.code,
      participantId,
      participantName,
      team,
      text: (text || '').trim(),
      category,
      createdAt: Date.now()
    };

    if (!room.reflections) room.reflections = [];
    room.reflections.push(reflection);
    room.updatedAt = Date.now();
    this.saveRoomToDb(room);

    // Save to persistent DB reflections file
    db.saveReflection(room.code, reflection);

    return reflection;
  }

  getReflections(roomCode) {
    const room = this.getRoom(roomCode);
    if (room && room.reflections) {
      return room.reflections;
    }
    return db.getReflections(roomCode);
  }

  getLeaderboards(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return { individual: [], team: [] };

    // Individual Leaderboard
    const participantsList = Object.values(room.participants);
    const individual = participantsList
      .map(p => {
        const lastAnswer = p.answers[room.game?.questions?.[room.currentQuestionIndex]?.id];
        return {
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          team: p.team,
          score: p.score,
          streak: p.streak,
          isOnline: p.isOnline,
          lastPointsEarned: lastAnswer ? lastAnswer.pointsEarned : 0,
          isCorrectLast: lastAnswer ? lastAnswer.isCorrect : null
        };
      })
      .sort((a, b) => b.score - a.score)
      .map((p, index) => ({ rank: index + 1, ...p }));

    // Team Leaderboard
    const teamScores = {};
    for (const t of TEAMS) {
      teamScores[t.name] = {
        name: t.name,
        color: t.color,
        badge: t.badge,
        score: 0,
        memberCount: 0,
        members: []
      };
    }

    for (const p of participantsList) {
      const tName = p.team || 'Team Alpha';
      if (!teamScores[tName]) {
        teamScores[tName] = { name: tName, color: '#6B7280', badge: '🛡️', score: 0, memberCount: 0, members: [] };
      }
      teamScores[tName].score += p.score;
      teamScores[tName].memberCount++;
      teamScores[tName].members.push({ name: p.name, score: p.score, avatar: p.avatar });
    }

    const team = Object.values(teamScores)
      .map(t => ({
        ...t,
        averageScore: t.memberCount > 0 ? Math.round(t.score / t.memberCount) : 0,
        members: t.members.sort((a, b) => b.score - a.score)
      }))
      .sort((a, b) => b.score - a.score)
      .map((t, index) => ({ rank: index + 1, ...t }));

    return { individual, team };
  }

  /**
   * Sanitizes room state for participant view:
   * Masks correctAnswer, explanation, discussionQuestion before answer is revealed.
   */
  getSanitizedRoomForParticipant(roomCode, participantId) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    const qIndex = room.currentQuestionIndex;
    const rawQuestion = this.getCurrentQuestion(room);
    let sanitizedQuestion = null;

    if (rawQuestion) {
      if (room.state === ROOM_STATES.ANSWER_REVEALED || room.state === ROOM_STATES.DEBRIEF || room.state === ROOM_STATES.LEADERBOARD) {
        // Participant can see explanation and correct answer
        sanitizedQuestion = {
          id: rawQuestion.id,
          type: rawQuestion.type,
          title: rawQuestion.title,
          scenario: rawQuestion.scenario,
          options: rawQuestion.options,
          points: rawQuestion.points,
          timeLimit: rawQuestion.timeLimit,
          correctAnswer: rawQuestion.correctAnswer,
          explanation: rawQuestion.explanation,
          learningObjective: rawQuestion.learningObjective,
          dynamicUpdate: rawQuestion.dynamicUpdate
        };
      } else {
        // Question is active or in lobby: MASK correct answer & explanation
        sanitizedQuestion = {
          id: rawQuestion.id,
          type: rawQuestion.type,
          title: rawQuestion.title,
          scenario: rawQuestion.scenario,
          options: rawQuestion.options,
          points: rawQuestion.points,
          timeLimit: rawQuestion.timeLimit,
          dynamicUpdate: rawQuestion.dynamicUpdate
        };
      }
    }

    const participant = room.participants[participantId] || null;
    const myAnswer = participant && rawQuestion ? participant.answers[rawQuestion.id] : null;

    return {
      code: room.code,
      state: room.state,
      mode: room.mode,
      gameTitle: room.game?.title,
      currentQuestionIndex: room.currentQuestionIndex,
      totalQuestions: room.game?.questions?.length || 0,
      question: sanitizedQuestion,
      questionStartTime: room.questionStartTime,
      questionTimeLimit: room.questionTimeLimit,
      hasAnswered: !!myAnswer,
      myAnswer: myAnswer || null,
      myScore: participant ? participant.score : 0,
      myStreak: participant ? participant.streak : 0,
      myTeam: participant ? participant.team : null,
      distribution: (room.state === ROOM_STATES.ANSWER_REVEALED || room.state === ROOM_STATES.DEBRIEF)
        ? this.calculateAnswerDistribution(room)
        : null
    };
  }

  getFullRoomForHost(roomCode) {
    const room = this.getRoom(roomCode);
    if (!room) return null;

    return {
      ...room,
      distribution: this.calculateAnswerDistribution(room),
      leaderboards: this.getLeaderboards(roomCode),
      participantsList: Object.values(room.participants)
    };
  }
}

export const gameEngine = new GameEngine();
