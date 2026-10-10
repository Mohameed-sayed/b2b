// Run: PORT=3055 node src/index.js  &  node test_security.mjs
import assert from 'assert';
import { io } from 'socket.io-client';

const URL = 'http://localhost:' + (process.env.PORT || 3055);
const mk = () => io(URL, { transports: ['websocket'] });
const ask = (s, ev, p) => new Promise(r => s.emit(ev, p, r));
const once = (s, ev) => new Promise(r => s.once(ev, r));

const host = mk(), player = mk(), evil = mk();
await Promise.all([host, player, evil].map(s => once(s, 'connect')));

const created = await ask(host, 'room:create', { gameId: 'game-1', forceNew: true });
assert(created.success, 'host creates room');
const code = created.code;

// stranger cannot hijack the live room
const hijack = await ask(evil, 'room:create', { gameId: 'game-1' });
assert(hijack.success === false, 'room:create hijack rejected');

const joined = await ask(player, 'room:join', { code, name: 'P1' });
assert(joined.success);
assert(!Object.values(joined.room.participants)[0].socketId, 'player view hides socket ids');

// non-host cannot drive the game
assert((await ask(player, 'game:start', { code })).success === false, 'player start rejected');
evil.emit('room:end', { code });

// question payloads
const pq = once(player, 'question:started');
const hq = once(host, 'question:started');
assert((await ask(host, 'game:start', { code })).success, 'host starts');
const [pp, hp] = await Promise.all([pq, hq]);
assert(pp.question.correctAnswer === undefined && pp.question.explanation === undefined, 'player question has no answer');
assert(hp.question.correctAnswer, 'host question has answer');

// invalid option rejected, spoofed participantId ignored
const bad = await ask(player, 'game:submit-answer', { optionId: 'ZZZ' });
assert(bad.success === false, 'invalid option rejected');
const ok = await ask(player, 'game:submit-answer', { participantId: 'someone-else', optionId: hp.question.options[0].id });
assert(ok.success, 'answer accepted for own socket identity');

// public games API hides answers
const g = await (await fetch(URL + '/api/games')).json();
if (process.env.ADMIN_TOKEN) {
  assert(!JSON.stringify(g).includes('correctAnswer'), 'public /api/games has no answers');
  assert((await fetch(URL + '/api/games/bulk', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '[]' })).status === 401);
}

console.log('ALL OK');
process.exit(0);
