// Run: PORT=3055 node src/index.js  &  node test_answer_flow.mjs
// Players whose socket dropped must still be able to reclaim their seat and have answers counted.
import assert from 'assert';
import { io } from 'socket.io-client';
const URL = 'http://localhost:' + (process.env.PORT || 3055);
const mk = () => io(URL, { transports: ['websocket'] });
const ask = (s, ev, p) => new Promise(r => s.emit(ev, p, r));
const conn = s => new Promise(r => s.connected ? r() : s.once('connect', r));
const wait = ms => new Promise(r => setTimeout(r, ms));

const host = mk(), a = mk(), b = mk(), c = mk();
await Promise.all([host, a, b, c].map(conn));
const code = (await ask(host, 'room:create', { gameId: 'game-1', forceNew: true })).code;
const pa = (await ask(a, 'room:join', { code, name: 'A' })).participant;
const pb = (await ask(b, 'room:join', { code, name: 'B' })).participant;
assert(pa.token, 'join returns a secret token');
// stale/typo code gets routed to the active room
const jc = await ask(c, 'room:join', { code: 'ZZZZZ', name: 'C' });
assert.equal(jc.room.code, code, 'routed to active room');
assert((await ask(host, 'game:start', { code })).success, 'game started');

let answered = 0;
host.on('question:answered', d => { answered = d.answeredCount; });

// A's phone reconnects while the old socket still looks alive to the server.
const a2 = mk(); await conn(a2);
const noTok = await ask(a2, 'room:reconnect', { code, participantId: pa.id });
assert(!noTok.success, 'reclaim without token rejected');
const withTok = await ask(a2, 'room:reconnect', { code, participantId: pa.id, token: pa.token });
assert(withTok.success, 'reclaim with token accepted: ' + withTok.error);
assert(!withTok.room.participants[pb.id].token, 'other players never see tokens');
await wait(100);
assert(!a.connected, 'stale socket kicked');
const sub = await ask(a2, 'game:submit-answer', { code, optionId: 'C' });
assert(sub.success, 'A answer counted');
assert(sub.answer.isCorrect === undefined && sub.answer.pointsEarned === undefined, 'submit reply hides grading');
// reconnect after answering must report the existing pick
const a3 = mk(); await conn(a3);
const back = await ask(a3, 'room:reconnect', { code, participantId: pa.id, token: pa.token });
assert.equal(back.myAnswer, 'C', 'reconnect returns own answer');
const again = await ask(a3, 'game:submit-answer', { code, optionId: 'A' });
assert(again.alreadyAnswered && again.answer.optionId === 'C', 'second tap reports first pick');

// B's buffered answer reaches the server before room:reconnect (socket.io flushes buffer first).
const b2 = mk(); await conn(b2);
const res = await ask(b2, 'game:submit-answer', { code, optionId: 'A', participantId: pb.id, token: pb.token });
assert(res.success, 'B answer bound via token: ' + res.error);
await wait(100);
const cres = await ask(c, 'game:submit-answer', { code: 'ZZZZZ', optionId: 'B' });
assert(cres.success, 'answer with stale code counted: ' + cres.error);
await wait(100);
assert.equal(answered, 3, 'host saw all votes');

const score = new Promise(r => a3.once('participant:score-updated', r));
const rev = await ask(host, 'game:reveal-answer', { code });
assert(rev.stats.find(s => s.optionId === 'C').isCorrect, 'reveal marks C correct');
const s = await score;
assert(s.isCorrect && s.answered && s.pointsAwarded > 0, 'A graded correct');

console.log('ALL OK'); process.exit(0);
