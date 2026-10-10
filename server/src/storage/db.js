import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultGames } from '../data/seedGames.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const GAMES_FILE = path.join(DATA_DIR, 'games.json');
const ROOMS_FILE = path.join(DATA_DIR, 'rooms.json');
const REFLECTIONS_FILE = path.join(DATA_DIR, 'reflections.json');

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue), 'utf-8');
      return defaultValue;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// In-memory cache per file; writes are debounced and async so hot paths never block on disk.
const WRITE_DELAY_MS = 1000;
const cache = new Map();   // filePath -> data
const timers = new Map();  // filePath -> timeout
const serializers = new Map(); // filePath -> data => data to persist

function load(filePath, defaultValue) {
  if (!cache.has(filePath)) cache.set(filePath, readJsonFile(filePath, defaultValue));
  return cache.get(filePath);
}

async function flushFile(filePath) {
  clearTimeout(timers.get(filePath));
  timers.delete(filePath);
  if (!cache.has(filePath)) return;
  const ser = serializers.get(filePath) || (d => d);
  try {
    const tmpPath = `${filePath}.tmp`;
    await fs.promises.writeFile(tmpPath, JSON.stringify(ser(cache.get(filePath))), 'utf-8');
    await fs.promises.rename(tmpPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

function setData(filePath, data) {
  cache.set(filePath, data);
  if (!timers.has(filePath)) {
    timers.set(filePath, setTimeout(() => flushFile(filePath), WRITE_DELAY_MS));
  }
}

// Rooms embed the game; persist only gameId and rehydrate on load.
serializers.set(ROOMS_FILE, rooms =>
  Object.fromEntries(Object.entries(rooms).map(([k, r]) => [k, { ...r, game: undefined }])));

export function flushAll() {
  // sync flush for shutdown
  for (const filePath of [...timers.keys()]) {
    clearTimeout(timers.get(filePath));
    timers.delete(filePath);
    const ser = serializers.get(filePath) || (d => d);
    try {
      fs.writeFileSync(filePath, JSON.stringify(ser(cache.get(filePath))), 'utf-8');
    } catch (err) {
      console.error(`Error flushing ${filePath}:`, err);
    }
  }
}
process.on('exit', flushAll);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flushAll(); process.exit(0); });

const REFLECTION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const db = {
  // Initialize and seed if empty
  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const games = load(GAMES_FILE, null);
    if (!games || !Array.isArray(games) || games.length === 0) {
      console.log('🌱 Seeding default workshop games into database...');
      setData(GAMES_FILE, structuredClone(defaultGames));
    }
    load(ROOMS_FILE, {});
    // drop reflections older than 7 days
    const refl = load(REFLECTIONS_FILE, {});
    const cutoff = Date.now() - REFLECTION_TTL_MS;
    for (const k of Object.keys(refl)) {
      refl[k] = refl[k].filter(r => (r.createdAt || 0) > cutoff);
      if (refl[k].length === 0) delete refl[k];
    }
    console.log('✅ Database initialized successfully.');
  },

  // Games
  getGames() {
    let games = load(GAMES_FILE, []);
    if (!games || games.length === 0) {
      this.init();
      games = load(GAMES_FILE, defaultGames);
    }
    return games;
  },
  saveGames(games) {
    setData(GAMES_FILE, games);
  },
  resetGames() {
    const games = structuredClone(defaultGames);
    setData(GAMES_FILE, games);
    return games;
  },
  getGameById(id) {
    const games = this.getGames();
    return games.find(g => g.id === id) || null;
  },
  saveGame(game) {
    const games = this.getGames();
    const index = games.findIndex(g => g.id === game.id);
    if (index >= 0) {
      games[index] = game;
    } else {
      games.push(game);
    }
    this.saveGames(games);
    return game;
  },
  deleteGame(id) {
    const games = this.getGames();
    const filtered = games.filter(g => g.id !== id);
    this.saveGames(filtered);
    return filtered.length !== games.length;
  },

  // Rooms
  getRooms() {
    return load(ROOMS_FILE, {});
  },
  getRoom(code) {
    if (!code) return null;
    const rooms = this.getRooms();
    return rooms[code.toUpperCase()] || null;
  },
  saveRoom(room) {
    if (!room || !room.code) return;
    const rooms = this.getRooms();
    rooms[room.code.toUpperCase()] = room;
    setData(ROOMS_FILE, rooms);
    return room;
  },
  deleteRoom(code) {
    if (!code) return;
    const rooms = this.getRooms();
    delete rooms[code.toUpperCase()];
    setData(ROOMS_FILE, rooms);
  },
  clearRooms() {
    setData(ROOMS_FILE, {});
  },

  // Reflections
  getReflections(roomCode) {
    if (!roomCode) return [];
    const all = load(REFLECTIONS_FILE, {});
    return all[roomCode.toUpperCase()] || [];
  },
  saveReflection(roomCode, reflection) {
    if (!roomCode || !reflection) return null;
    const all = load(REFLECTIONS_FILE, {});
    const key = roomCode.toUpperCase();
    if (!all[key]) all[key] = [];
    all[key].push(reflection);
    setData(REFLECTIONS_FILE, all);
    return reflection;
  }
};

// Note: db.init() is called explicitly from server/src/index.js on startup.
// Do not auto-call here to avoid double initialization.
