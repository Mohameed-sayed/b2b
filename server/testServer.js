import { io } from '../client/node_modules/socket.io-client/build/esm/index.js';

const BASE_URL = 'http://127.0.0.1:3001';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 Starting Backend End-to-End Test Suite...\n');

  // 1. Test Root Health Endpoint
  console.log('--- TEST 1: Root & Health REST Endpoints ---');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  console.log('GET /health:', healthData);
  if (healthData.status !== 'ok') throw new Error('Health check failed');

  // 2. Test Network IP Endpoint
  console.log('\n--- TEST 2: GET /api/network-ip ---');
  const ipRes = await fetch(`${BASE_URL}/api/network-ip`);
  const ipData = await ipRes.json();
  console.log('LAN IP response:', ipData);
  if (!ipData.success || !ipData.ip) throw new Error('Failed to retrieve network IP');

  // 3. Test Games API
  console.log('\n--- TEST 3: GET /api/games ---');
  const gamesRes = await fetch(`${BASE_URL}/api/games`);
  const gamesData = await gamesRes.json();
  console.log(`Loaded ${gamesData.count} games.`);
  if (!gamesData.success || gamesData.count < 7) throw new Error('Expected at least 7 default games');

  const g1Res = await fetch(`${BASE_URL}/api/games/game-1`);
  const g1Data = await g1Res.json();
  console.log('Game 1 Title:', g1Data.game?.title);
  if (!g1Data.game || g1Data.game.id !== 'game-1') throw new Error('Failed to get game-1');

  // 4. Test Game CRUD
  console.log('\n--- TEST 4: POST & PUT /api/games ---');
  const newGamePayload = {
    id: 'test-custom-game',
    title: 'Custom Test Workshop Game',
    topic: 'Testing',
    questions: [
      {
        id: 'tcg-q1',
        title: 'Question 1',
        scenario: 'Test Scenario',
        options: [{ id: 'A', text: 'Option A' }, { id: 'B', text: 'Option B' }],
        correctAnswer: 'A',
        points: 1000,
        timeLimit: 30
      }
    ]
  };
  const createRes = await fetch(`${BASE_URL}/api/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newGamePayload)
  });
  const createData = await createRes.json();
  console.log('Created game:', createData.game?.title);

  // Update it
  const updateRes = await fetch(`${BASE_URL}/api/games/test-custom-game`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: 'Updated Custom Test Game' })
  });
  const updateData = await updateRes.json();
  console.log('Updated title:', updateData.game?.title);

  // Clean up test game
  await fetch(`${BASE_URL}/api/games/test-custom-game`, { method: 'DELETE' });
  console.log('Cleaned up test game.');

  // 5. Test Real-time Socket.IO: Host & Participants
  console.log('\n--- TEST 5: Socket.IO Real-time Workflow ---');

  const hostSocket = io(BASE_URL);
  const p1Socket = io(BASE_URL);
  const p2Socket = io(BASE_URL);

  await Promise.all([
    new Promise(r => hostSocket.on('connect', r)),
    new Promise(r => p1Socket.on('connect', r)),
    new Promise(r => p2Socket.on('connect', r))
  ]);
  console.log('✅ Host and 2 Participants connected via WebSockets.');

  let roomCode = null;
  let hostToken = null;

  // Step 5A: Host creates room
  const createRoomPromise = new Promise((resolve) => {
    hostSocket.emit('host:create_room', { gameId: 'game-1', mode: 'team' }, (res) => {
      resolve(res);
    });
  });
  const createResult = await createRoomPromise;
  roomCode = createResult.roomCode;
  hostToken = createResult.hostToken;
  console.log(`✅ Host created room ${roomCode} with hostToken ${hostToken.substring(0, 8)}...`);

  // Step 5B: Participant 1 joins
  const p1JoinPromise = new Promise((resolve) => {
    p1Socket.emit('participant:join', {
      roomCode,
      name: 'Ahmed Instructor',
      avatar: '🦁',
      participantId: 'p-ahmed-1'
    }, (res) => {
      resolve(res);
    });
  });
  const p1Join = await p1JoinPromise;
  console.log(`✅ Participant 1 joined: ${p1Join.participant.name} (${p1Join.participant.team})`);

  // Step 5C: Participant 2 joins
  const p2JoinPromise = new Promise((resolve) => {
    p2Socket.emit('participant:join', {
      roomCode,
      name: 'Sara Instructor',
      avatar: '🚀',
      participantId: 'p-sara-2'
    }, (res) => {
      resolve(res);
    });
  });
  const p2Join = await p2JoinPromise;
  console.log(`✅ Participant 2 joined: ${p2Join.participant.name} (${p2Join.participant.team})`);

  // Step 5D: Participant 1 chooses Team Alpha, Participant 2 chooses Team Beta
  await new Promise(r => p1Socket.emit('participant:select_team', { roomCode, participantId: 'p-ahmed-1', team: 'Team Alpha' }, r));
  await new Promise(r => p2Socket.emit('participant:select_team', { roomCode, participantId: 'p-sara-2', team: 'Team Beta' }, r));
  console.log('✅ Teams assigned: Ahmed -> Team Alpha, Sara -> Team Beta');

  // Step 5E: Host starts game
  console.log('\n--- Host Starts Game ---');
  let qActiveReceived = false;
  p1Socket.on('question:active', (data) => {
    qActiveReceived = true;
    console.log('📱 Participant received question:', data.question.title);
    if (data.question.correctAnswer) {
      throw new Error('SECURITY VIOLATION: correctAnswer leaked to participant before reveal!');
    }
  });

  await new Promise(r => hostSocket.emit('host:start_game', { roomCode, hostToken }, r));
  await wait(200);
  if (!qActiveReceived) throw new Error('Participant did not receive question:active event');

  // Step 5F: Submitting answers
  console.log('\n--- Participants Submit Answers ---');
  let liveDistribution = null;
  hostSocket.on('distribution:update', (dist) => {
    liveDistribution = dist;
    console.log(`📊 Live distribution update: Option C count = ${dist.options?.C?.count}, Total = ${dist.totalSubmitted}`);
  });

  // P1 submits Option C (correct) with 5s elapsed
  const p1Ans = await new Promise(r => p1Socket.emit('participant:submit_answer', {
    roomCode,
    participantId: 'p-ahmed-1',
    optionId: 'C',
    responseTimeMs: 5000
  }, r));
  console.log('Ahmed answered C:', p1Ans.answer?.isCorrect, 'Points earned:', p1Ans.answer?.pointsEarned);

  // P2 submits Option A (incorrect) with 10s elapsed
  const p2Ans = await new Promise(r => p2Socket.emit('participant:submit_answer', {
    roomCode,
    participantId: 'p-sara-2',
    optionId: 'A',
    responseTimeMs: 10000
  }, r));
  console.log('Sara answered A:', p2Ans.answer?.isCorrect, 'Points earned:', p2Ans.answer?.pointsEarned);

  await wait(200);

  // Step 5G: Host reveals answer
  console.log('\n--- Host Reveals Answer ---');
  let revealReceived = false;
  p1Socket.on('answer:revealed', (data) => {
    revealReceived = true;
    console.log('📱 Participant received reveal. Correct answer is:', data.correctAnswer);
  });
  await new Promise(r => hostSocket.emit('host:reveal_answer', { roomCode, hostToken }, r));
  await wait(200);
  if (!revealReceived) throw new Error('Reveal event not received');

  // Step 5H: Host shows debrief & leaderboard
  console.log('\n--- Host Shows Debrief & Leaderboard ---');
  const debriefRes = await new Promise(r => hostSocket.emit('host:show_debrief', { roomCode, hostToken }, r));
  console.log('Debrief Learning Objective:', debriefRes.debrief?.learningObjective);

  const lbRes = await new Promise(r => hostSocket.emit('host:show_leaderboard', { roomCode, hostToken }, r));
  console.log('Leaderboard Rankings:');
  for (const item of lbRes.leaderboards.individual) {
    console.log(`  #${item.rank} ${item.name} (${item.team}) - Score: ${item.score} (Streak: ${item.streak})`);
  }
  console.log('Team Leaderboard:');
  for (const item of lbRes.leaderboards.team) {
    console.log(`  #${item.rank} ${item.name} - Score: ${item.score} (Members: ${item.memberCount})`);
  }

  // Step 5I: Host adjusts points for great oral participation
  console.log('\n--- Host Adjusts Points (+100 for great debrief participation) ---');
  const adjustRes = await new Promise(r => hostSocket.emit('host:adjust_points', {
    roomCode,
    hostToken,
    participantId: 'p-ahmed-1',
    pointsDelta: 100,
    reason: 'Great live insight during debrief'
  }, r));
  console.log(`Ahmed new score: ${adjustRes.result.participant.score}`);

  // Step 5J: Participant submits reflection
  console.log('\n--- Participant Submits Reflection ---');
  let hostReceivedReflection = false;
  hostSocket.on('reflection:new', (ref) => {
    hostReceivedReflection = true;
    console.log('🖥️ Host received live reflection:', ref.participantName, '->', ref.text);
  });
  await new Promise(r => p1Socket.emit('participant:submit_reflection', {
    roomCode,
    participantId: 'p-ahmed-1',
    text: 'I will clarify requirements before committing blindly.',
    category: 'clarify'
  }, r));
  await wait(200);
  if (!hostReceivedReflection) throw new Error('Host did not receive reflection event');

  // Step 5K: Verify REST room & reflections endpoints
  console.log('\n--- Verification of Room & Reflection REST APIs ---');
  const roomApiRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}`);
  const roomApiData = await roomApiRes.json();
  console.log('GET /api/rooms/:code:', roomApiData.room);

  const refApiRes = await fetch(`${BASE_URL}/api/rooms/${roomCode}/reflections`);
  const refApiData = await refApiRes.json();
  console.log(`GET /api/rooms/:code/reflections: count = ${refApiData.count}, sample = "${refApiData.reflections[0]?.text}"`);

  // Disconnect sockets
  hostSocket.disconnect();
  p1Socket.disconnect();
  p2Socket.disconnect();

  console.log('\n🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
