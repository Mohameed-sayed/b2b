// Run: PORT=3055 node src/index.js  &  node test_team_move.mjs
import assert from 'assert';
import { io } from 'socket.io-client';
const URL = 'http://localhost:' + (process.env.PORT || 3055);
const mk = () => io(URL, { transports: ['websocket'] });
const ask = (s, ev, p) => new Promise(r => s.emit(ev, p, r));
const wait = ms => new Promise(r => setTimeout(r, ms));
const host = mk(), player = mk(), evil = mk();
await Promise.all([host, player, evil].map(s => new Promise(r => s.once('connect', r))));
const code = (await ask(host, 'room:create', { gameId: 'game-1', forceNew: true })).code;
const me = (await ask(player, 'room:join', { code, name: 'P1' })).participant;
const target = me.team === 'Team Beta' ? 'Team Gamma' : 'Team Beta';
const seen = new Promise(r => player.on('room:updated', ({ room }) => room.participants[me.id].team === target && r(true)));
evil.emit('team:move', { code, participantId: me.id, team: target });
host.emit('team:move', { code, participantId: me.id, team: 'Bogus' });
await wait(300);
host.emit('team:move', { code, participantId: me.id, team: target });
assert(await Promise.race([seen, wait(2000).then(() => false)]), 'host move applied + broadcast');
console.log('ALL OK'); process.exit(0);
