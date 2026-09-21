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
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    const tmpPath = `${filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, filePath);
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

export const db = {
  // Initialize and seed if empty
  init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const games = readJsonFile(GAMES_FILE, null);
    if (!games || !Array.isArray(games) || games.length === 0) {
      console.log('🌱 Seeding default workshop games into database...');
      writeJsonFile(GAMES_FILE, defaultGames);
    }
    if (!fs.existsSync(ROOMS_FILE)) {
      writeJsonFile(ROOMS_FILE, {});
    }
    if (!fs.existsSync(REFLECTIONS_FILE)) {
      writeJsonFile(REFLECTIONS_FILE, {});
    }
    console.log('✅ Database initialized successfully.');
  },

  // Games
  getGames() {
    let games = readJsonFile(GAMES_FILE, []);
    if (!games || games.length === 0) {
      this.init();
      games = readJsonFile(GAMES_FILE, defaultGames);
    }
    return games;
  },
  saveGames(games) {
    writeJsonFile(GAMES_FILE, games);
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
    return readJsonFile(ROOMS_FILE, {});
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
    writeJsonFile(ROOMS_FILE, rooms);
    return room;
  },
  deleteRoom(code) {
    if (!code) return;
    const rooms = this.getRooms();
    delete rooms[code.toUpperCase()];
    writeJsonFile(ROOMS_FILE, rooms);
  },

  // Reflections
  getReflections(roomCode) {
    if (!roomCode) return [];
    const all = readJsonFile(REFLECTIONS_FILE, {});
    return all[roomCode.toUpperCase()] || [];
  },
  saveReflection(roomCode, reflection) {
    if (!roomCode || !reflection) return null;
    const all = readJsonFile(REFLECTIONS_FILE, {});
    const key = roomCode.toUpperCase();
    if (!all[key]) all[key] = [];
    all[key].push(reflection);
    writeJsonFile(REFLECTIONS_FILE, all);
    return reflection;
  }
};

// Note: db.init() is called explicitly from server/src/index.js on startup.
// Do not auto-call here to avoid double initialization.
