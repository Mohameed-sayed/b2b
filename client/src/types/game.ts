export type QuestionType =
  | 'multiple-choice'
  | 'rapid-response'
  | 'voting'
  | 'categorization'
  | 'reflection'
  | 'slack-scenario';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface DynamicUpdate {
  round: number;
  announcement: string;
  questionText: string;
  options: QuestionOption[];
  correctAnswer: string;
  explanation: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  scenario: string;
  options: QuestionOption[];
  correctAnswer?: string | null;
  points: number;
  timeLimit: number; // in seconds
  explanation: string;
  learningObjective: string;
  discussionQuestion?: string;
  facilitatorTips?: string;
  dynamicUpdate?: DynamicUpdate;
}

export interface Game {
  id: string;
  title: string;
  subtitle: string;
  topic: string;
  description: string;
  category: string;
  order: number;
  questions: Question[];
}

// Team names match server-side TEAMS definition in gameEngine.js
export type TeamName = 'Team Alpha' | 'Team Beta' | 'Team Gamma' | 'Team Delta';

export interface Participant {
  id: string;
  socketId: string;
  name: string;
  avatar: string;
  team: string; // widened from TeamName - server assigns any string team
  score: number;
  streak: number;
  rank?: number;
  lastAnswer?: string;
  lastAnswerTime?: number; // timestamp ms
  lastPointsEarned?: number;
  isCorrectLast?: boolean | null;
  isOnline: boolean;
  hasAnsweredCurrent?: boolean;
}

export interface AnswerSubmission {
  participantId: string;
  roomCode: string;
  questionId: string;
  answer: string;
  timeRemaining: number;
  timeTaken: number;
}

export interface AnswerDistribution {
  [optionId: string]: number; // count of participants who chose this option
}

export interface OptionDistributionStats {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
  isCorrect: boolean;
  participants?: { name: string; team?: string }[];
}

export interface ReflectionSubmission {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  team?: string;
  roomCode: string;
  text?: string;          // server field name
  behaviorText?: string;  // client field name (aliased on send)
  category?: string;
  timestamp?: number;     // legacy
  createdAt?: number;     // server field name
}

export type RoomStatus =
  | 'lobby'
  | 'question'
  | 'answers-displayed'
  | 'revealing'
  | 'leaderboard'
  | 'escape-room'
  | 'reflection-wall'
  | 'ended';

export interface Room {
  code: string;
  hostSocketId: string;
  currentGameId: string;
  currentQuestionIndex: number;
  status: RoomStatus;
  isPaused: boolean;
  timeRemaining: number;
  questionStartedAt?: number;
  participants: Record<string, Participant>;
  submissions: Record<string, AnswerSubmission>; // key: participantId
  distributions?: AnswerDistribution;
  teamMode: boolean;
  reflections: ReflectionSubmission[];
}

// Client-Server Socket Events
export interface ServerToClientEvents {
  'room:created': (data: { room: Room }) => void;
  'room:joined': (data: { participant: Participant; room: Room }) => void;
  'room:updated': (data: { room: Room }) => void;
  'room:participant-joined': (data: { participant: Participant; count: number }) => void;
  'room:participant-reconnected': (data: { participant: Participant; count: number }) => void;
  'room:participant-offline': (data: { participantId: string; count: number }) => void;
  'room:participant-left': (data: { participantId: string; count: number }) => void;
  'room:error': (data: { message: string }) => void;
  'question:started': (data: { question: Question; timeLimit: number; index: number; total: number }) => void;
  'question:tick': (data: { timeRemaining: number }) => void;
  'question:answered': (data: { participantId: string; answeredCount: number; totalParticipants: number }) => void;
  'question:revealed': (data: {
    correctAnswer: string | null;
    explanation: string;
    distributions: Record<string, { count: number; percentage: number }>;
    stats: OptionDistributionStats[];
    learningObjective?: string;
    discussionQuestion?: string;
    leaderboards?: { individual: Participant[]; team: unknown[] };
  }) => void;
  'players-answers:revealed': (data: {
    correctAnswer: string | null;
    explanation: string;
    distributions: Record<string, { count: number; percentage: number }>;
    stats: OptionDistributionStats[];
    learningObjective?: string;
    discussionQuestion?: string;
    leaderboards?: { individual: Participant[]; team: unknown[] };
  }) => void;
  'answer:revealed': (data: {
    correctAnswer: string | null;
    explanation: string;
    distributions: Record<string, { count: number; percentage: number }>;
    stats: OptionDistributionStats[];
    learningObjective?: string;
    discussionQuestion?: string;
    leaderboards?: { individual: Participant[]; team: unknown[] };
  }) => void;
  'answer:submitted': (data: { success: boolean; optionId: string; alreadyAnswered: boolean; answer: unknown }) => void;
  'answer:error': (data: { success: false; error: string }) => void;
  'participant:score-updated': (data: {
    participantId: string;
    pointsAwarded: number;
    totalScore: number;
    isCorrect: boolean;
    streak: number;
    explanation?: string;
  }) => void;
  'participant:join_success': (data: { success: boolean; participant: Participant; room: Room }) => void;
  'participant:join_error': (data: { success: false; error: string; message: string }) => void;
  'participant:joined': (data: { participant: Participant; isReconnect: boolean; totalParticipants: number; participantsList: Participant[] }) => void;
  'leaderboard:updated': (data: {
    participants: Participant[];
    teamScores: Record<string, number>;
    individualLeaderboard?: Participant[];
    teamLeaderboard?: unknown[];
    mode?: string;
  }) => void;
  // Server emits 'leaderboard:update' as alias
  'leaderboard:update': (data: {
    participants: Participant[];
    teamScores: Record<string, number>;
    individualLeaderboard?: Participant[];
    teamLeaderboard?: unknown[];
    mode?: string;
  }) => void;
  'reflection:added': (data: { reflection: ReflectionSubmission }) => void;
  'reflection:new': (data: ReflectionSubmission) => void;
  'reflection:submitted': (data: { success: boolean; reflection: ReflectionSubmission }) => void;
  'reflection:active': (data: { question: Question; questionIndex: number; totalQuestions: number }) => void;
  'distribution:update': (data: unknown) => void;
  'game:started': (data: { roomCode: string; state: string; currentQuestionIndex: number; totalQuestions: number }) => void;
  'game:completed': (data: { leaderboards: { individual: Participant[]; team: unknown[] }; message: string }) => void;
  'room:ended': (data: { message?: string }) => void;
  'host:room_created': (data: { success: boolean; code: string; roomCode: string; hostToken: string; room: Room }) => void;
  'host:sync': (data: { success: boolean; room: Room }) => void;
  'host:question_active': (data: { question: Question; questionIndex: number; totalQuestions: number; timeLimit: number; distribution: unknown }) => void;
  'error': (data: { success?: false; error?: string; message?: string }) => void;
}

export interface ClientToServerEvents {
  'room:create': (data: { code?: string; gameId?: string; teamMode?: boolean; mode?: string; forceNew?: boolean }, callback?: (res: { success: boolean; code: string; roomCode: string; hostToken: string; room: Room }) => void) => void;
  'host:create_room': (data: { code?: string; gameId?: string; teamMode?: boolean; mode?: string; forceNew?: boolean }, callback?: (res: { success: boolean; code: string; roomCode: string; hostToken: string; room: Room }) => void) => void;
  'room:end': (data: { code: string; roomCode?: string }, callback?: (res: { success: boolean }) => void) => void;
  'host:end_workshop': (data: { code: string; roomCode?: string }, callback?: (res: { success: boolean }) => void) => void;
  'room:join': (data: { code?: string; roomCode?: string; name: string; avatar?: string; team?: string; participantId?: string }, callback?: (res: { success: boolean; participant?: Participant; room?: Room; error?: string; message?: string }) => void) => void;
  'participant:join': (data: { code?: string; roomCode?: string; name: string; avatar?: string; team?: string; participantId?: string }, callback?: (res: { success: boolean; participant?: Participant; room?: Room; error?: string; message?: string }) => void) => void;
  'room:reconnect': (data: { code?: string; roomCode?: string; participantId: string }, callback?: (res: { success: boolean; participant?: Participant; room?: Room; currentQuestion?: Question | null; questionIndex?: number; totalQuestions?: number; timeRemaining?: number; error?: string }) => void) => void;
  'host:reconnect': (data: { code?: string; roomCode?: string; hostToken?: string }, callback?: (res: { success: boolean; room?: Room; selectedGameId?: string; error?: string }) => void) => void;
  'game:select': (data: { code: string; gameId: string }) => void;
  'game:start': (data: { code: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'host:start_game': (data: { roomCode: string; hostToken?: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'game:pause-toggle': (data: { code: string }) => void;
  'game:next-question': (data: { code: string }, callback?: (res: { success: boolean; finished?: boolean }) => void) => void;
  'host:next_question': (data: { roomCode: string }, callback?: (res: { success: boolean; finished?: boolean }) => void) => void;
  'game:reveal-players-answers': (data: { code: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'host:reveal_players_answers': (data: { roomCode: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'game:reveal-answer': (data: { code: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'host:reveal_answer': (data: { roomCode: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'game:show-leaderboard': (data: { code: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'host:show_leaderboard': (data: { roomCode: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'game:adjust-points': (data: { code: string; targetId: string; isTeam: boolean; pointsDelta: number }) => void;
  'game:submit-answer': (data: AnswerSubmission & { participantId?: string; optionId?: string; responseTimeMs?: number }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'participant:submit_answer': (data: { participantId?: string; roomCode?: string; questionId?: string; answer?: string; optionId?: string; timeRemaining?: number; responseTimeMs?: number }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'reflection:submit': (data: { roomCode: string; participantId: string; behaviorText?: string; text?: string; category?: string }) => void;
  'participant:submit_reflection': (data: { roomCode?: string; code?: string; participantId?: string; behaviorText?: string; text?: string; category?: string }, callback?: (res: { success: boolean; error?: string }) => void) => void;
  'game:toggle-team-mode': (data: { code: string }) => void;
}

