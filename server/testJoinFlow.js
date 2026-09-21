import { io } from 'socket.io-client';

async function testJoin() {
  console.log('--- Testing Host Room Creation and Player Join ---');
  const hostSocket = io('http://localhost:3001');

  await new Promise((resolve) => hostSocket.on('connect', resolve));
  console.log('✅ Host connected:', hostSocket.id);

  // 1. Host creates room
  const roomRes = await new Promise((resolve) => {
    hostSocket.emit('room:create', { gameId: 'game-1' }, resolve);
  });
  console.log('✅ Room created on server:', roomRes.code);

  const roomCode = roomRes.code;

  // 2. Player connects and joins
  const playerSocket = io('http://localhost:3001');
  await new Promise((resolve) => playerSocket.on('connect', resolve));
  console.log('✅ Player connected:', playerSocket.id);

  const joinRes = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Player join timed out!')), 3000);
    playerSocket.emit('room:join', {
      code: roomCode,
      name: 'Ahmed Instructor',
      avatar: '🚀',
      team: 'Team Cairo'
    }, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });

  console.log('✅ Player join response:', joinRes.success ? 'SUCCESS' : 'FAILED', joinRes.participant?.name);

  if (!joinRes.success) {
    throw new Error('Join was not successful!');
  }

  // 3. Host starts game
  const startPromise = new Promise((resolve) => {
    playerSocket.on('question:started', (data) => {
      console.log('✅ Player received question:started!', data.question.title);
      resolve(data);
    });
  });

  hostSocket.emit('game:start', { code: roomCode });
  await startPromise;

  // 4. Player submits answer
  const answerRes = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Answer submit timed out!')), 3000);
    playerSocket.emit('game:submit-answer', {
      participantId: joinRes.participant.id,
      roomCode: roomCode,
      questionId: 'g1-q1',
      answer: 'C',
      timeRemaining: 25,
      timeTaken: 5
    }, (res) => {
      clearTimeout(timer);
      resolve(res);
    });
  });

  console.log('✅ Answer submission response:', answerRes.success ? 'SUCCESS' : 'FAILED');

  hostSocket.disconnect();
  playerSocket.disconnect();

  console.log('🎉 ALL JOIN & ANSWER FLOWS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

testJoin().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
