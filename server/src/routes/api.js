import express from 'express';
import os from 'os';
import { db } from '../storage/db.js';
import { gameEngine, TEAMS } from '../gameEngine.js';

const router = express.Router();

// Helper to get local machine IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push(iface.address);
      }
    }
  }

  // Prioritize typical home/office private subnets
  const privateIp = candidates.find(ip =>
    ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  );

  return privateIp || candidates[0] || 'localhost';
}

/**
 * GET /api/network-ip
 * Returns machine LAN IP and suggested join URLs for the mobile QR code
 */
router.get('/network-ip', (req, res) => {
  try {
    const ip = getLocalIpAddress();
    const serverPort = process.env.PORT || 3001;
    const clientPort = process.env.CLIENT_PORT || 5173;
    const clientBaseUrl = process.env.CLIENT_URL || `http://${ip}:${clientPort}`;

    res.json({
      success: true,
      ip,
      serverPort: Number(serverPort),
      clientPort: Number(clientPort),
      clientBaseUrl,
      sampleJoinUrl: `${clientBaseUrl}/join/B2B7X`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/teams
 * Returns available workshop team definitions
 */
router.get('/teams', (req, res) => {
  res.json({
    success: true,
    teams: TEAMS
  });
});

/**
 * GET /api/games
 * Returns all games
 */
router.get('/games', (req, res) => {
  try {
    const games = db.getGames();
    res.json({
      success: true,
      count: games.length,
      games
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/games/:id
 * Get single game by ID
 */
router.get('/games/:id', (req, res) => {
  try {
    const game = db.getGameById(req.params.id);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    res.json({ success: true, game });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/games
 * Create a new game
 */
router.post('/games', (req, res) => {
  try {
    const gameData = req.body;
    if (!gameData || !gameData.title) {
      return res.status(400).json({ success: false, error: 'Game title is required' });
    }

    const newGame = {
      id: gameData.id || `game-${Date.now()}`,
      title: gameData.title,
      subtitle: gameData.subtitle || '',
      topic: gameData.topic || '',
      description: gameData.description || '',
      category: gameData.category || 'General',
      order: gameData.order || (db.getGames().length + 1),
      questions: Array.isArray(gameData.questions) ? gameData.questions : []
    };

    db.saveGame(newGame);
    res.status(201).json({ success: true, game: newGame });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/games/:id
 * Update game or its questions
 */
router.put('/games/:id', (req, res) => {
  try {
    const existing = db.getGameById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }

    const updated = {
      ...existing,
      ...req.body,
      id: existing.id // protect ID
    };

    db.saveGame(updated);
    res.json({ success: true, game: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/games/:id
 * Delete a game
 */
router.delete('/games/:id', (req, res) => {
  try {
    const deleted = db.deleteGame(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    res.json({ success: true, message: 'Game deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/rooms/:code
 * Get room details
 */
router.get('/rooms/:code', (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const room = gameEngine.getRoom(code);
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    // Return safe summary of room
    res.json({
      success: true,
      room: {
        code: room.code,
        state: room.state,
        mode: room.mode,
        gameId: room.gameId,
        gameTitle: room.game?.title,
        participantsCount: Object.keys(room.participants).length,
        currentQuestionIndex: room.currentQuestionIndex,
        totalQuestions: room.game?.questions?.length || 0,
        createdAt: room.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/rooms/:code/reflections
 * Get reflections for a room
 */
router.get('/rooms/:code/reflections', (req, res) => {
  try {
    const code = req.params.code.toUpperCase();
    const reflections = gameEngine.getReflections(code);
    res.json({
      success: true,
      count: reflections.length,
      reflections
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
