import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import os from 'os';
import apiRoutes from './routes/api.js';
import { setupSocketHandlers } from './socketHandler.js';
import { db } from './storage/db.js';

// Helper to find LAN IP
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
  const privateIp = candidates.find(ip =>
    ip.startsWith('192.168.') || ip.startsWith('10.') || /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(ip)
  );
  return privateIp || candidates[0] || 'localhost';
}

const app = express();

// Enable universal CORS for live workshop access from laptops and mobile phones
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    platform: 'iSchool B2B Onboarding Game Platform Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Create HTTP server & Socket.IO server
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  },
  pingInterval: 25000,
  pingTimeout: 20000,
  transports: ['polling', 'websocket'],
  allowUpgrades: true,
  connectTimeout: 45000,
  maxHttpBufferSize: 1e7
});

// Attach real-time handlers
setupSocketHandlers(io);

// Initialize database
db.init();

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  const lanIp = getLocalIpAddress();
  const clientPort = process.env.CLIENT_PORT || 5173;
  console.log('====================================================');
  console.log('🚀 iSchool B2B Onboarding Game Platform Server');
  console.log(`📡 Server Local:   http://localhost:${PORT}`);
  console.log(`🌐 Server LAN:     http://${lanIp}:${PORT}`);
  console.log(`📱 Client Join:    http://${lanIp}:${clientPort}/join`);
  console.log(`🎮 Games Loaded:   ${db.getGames().length}`);
  console.log('====================================================');
});

// Handle port-already-in-use gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use by another process.`);
    console.error(`   To fix this, run one of:\n`);
    console.error(`   npx kill-port ${PORT}             (if you have npx)`);
    console.error(`   npm run kill:ports                (kills 3001 + 5173)`);
    console.error(`   Or manually: netstat -ano | findstr :${PORT}  → taskkill /PID <PID> /F\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
