import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type PlayerState = {
  id: string;
  force: number;
  team: 'left' | 'right';
  ready: boolean;
};

type RoomState = {
  id: string;
  players: Record<string, PlayerState>;
  status: 'waiting' | 'countdown' | 'playing' | 'finished';
  score: number; // -100 (left wins) to +100 (right wins)
  timeRemaining: number;
  winner: 'left' | 'right' | 'tie' | null;
  countdown: number;
};

const rooms = new Map<string, RoomState>();
const socketToRoom = new Map<string, string>(); // socket.id -> roomId
const gameIntervals = new Map<string, NodeJS.Timeout>();
const countdownIntervals = new Map<string, NodeJS.Timeout>();
const MAX_SCORE = 100;
const TICK_RATE = 100; // ms
const MULTIPLIER = 1.0;

function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('createRoom', (callback) => {
      console.log('createRoom requested by:', socket.id);
      if (typeof callback !== 'function') return;
      let roomId = generateRoomCode();
      while (rooms.has(roomId)) {
        roomId = generateRoomCode();
      }
      rooms.set(roomId, {
        id: roomId,
        players: {},
        status: 'waiting',
        score: 0,
        timeRemaining: 30,
        winner: null,
        countdown: 3,
      });
      callback({ roomId });
    });

    socket.on('joinRoom', (roomId, callback) => {
      if (typeof roomId !== 'string' || typeof callback !== 'function') return;
      
      const rId = roomId.toUpperCase();
      const room = rooms.get(rId);
      
      if (!room) {
        callback({ error: 'Room not found' });
        return;
      }
      
      const pCount = Object.keys(room.players).length;
      if (pCount >= 2) {
        callback({ error: 'Room is full' });
        return;
      }

      // Check if player is already in a room
      if (socketToRoom.has(socket.id)) {
        handlePlayerLeave(socket.id);
      }

      // Determine team
      const existingPlayers = Object.values(room.players);
      const team = (existingPlayers.length > 0 && existingPlayers[0].team === 'left') ? 'right' : 'left';

      room.players[socket.id] = {
        id: socket.id,
        force: 0,
        team,
        ready: false,
      };

      socketToRoom.set(socket.id, rId);
      socket.join(rId);
      
      io.to(rId).emit('roomState', room);
      callback({ success: true, team, roomState: room });
    });

    socket.on('playerReady', (roomId) => {
      if (typeof roomId !== 'string') return;
      const room = rooms.get(roomId.toUpperCase());
      if (!room || !room.players[socket.id]) return;
      
      room.players[socket.id].ready = true;
      io.to(room.id).emit('roomState', room);

      const players = Object.values(room.players);
      const allReady = players.length === 2 && players.every(p => p.ready);
      
      if (allReady && room.status === 'waiting') {
        startCountdown(room.id);
      }
    });

    socket.on('updateForce', (roomId, force) => {
      if (typeof roomId !== 'string') return;
      const room = rooms.get(roomId.toUpperCase());
      if (room && room.status === 'playing' && room.players[socket.id]) {
        if (typeof force !== 'number' || isNaN(force)) return;
        room.players[socket.id].force = Math.max(0, Math.min(100, force));
      }
    });

    socket.on('leaveRoom', () => {
      handlePlayerLeave(socket.id);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      handlePlayerLeave(socket.id);
    });

    socket.on('getRoomState', (roomId, callback) => {
      if (typeof roomId !== 'string' || typeof callback !== 'function') return;
      const room = rooms.get(roomId.toUpperCase());
      if (room) callback(room);
    });
  });

  function startCountdown(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;

    room.status = 'countdown';
    room.countdown = 3;
    io.to(roomId).emit('roomState', room);
    
    if (countdownIntervals.has(roomId)) {
      clearInterval(countdownIntervals.get(roomId)!);
    }

    const countInterval = setInterval(() => {
      const r = rooms.get(roomId);
      if (!r || r.status !== 'countdown') {
        clearInterval(countInterval);
        countdownIntervals.delete(roomId);
        return;
      }

      r.countdown--;
      if (r.countdown <= 0) {
        clearInterval(countInterval);
        countdownIntervals.delete(roomId);
        r.status = 'playing';
        r.timeRemaining = 30;
        r.score = 0;
        io.to(roomId).emit('roomState', r);
        startGameLoop(roomId);
      } else {
        io.to(roomId).emit('roomState', r);
      }
    }, 1000);
    
    countdownIntervals.set(roomId, countInterval);
  }

  function handlePlayerLeave(socketId: string) {
    const roomId = socketToRoom.get(socketId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    socketToRoom.delete(socketId);

    if (room) {
      delete room.players[socketId];
      
      // Stop countdown if active
      if (countdownIntervals.has(roomId)) {
        clearInterval(countdownIntervals.get(roomId)!);
        countdownIntervals.delete(roomId);
      }

      if (Object.keys(room.players).length === 0) {
        stopGameLoop(roomId);
        rooms.delete(roomId);
      } else {
        // Reset room to waiting if someone left
        room.status = 'waiting';
        room.score = 0;
        room.winner = null;
        Object.values(room.players).forEach(p => p.ready = false);
        io.to(roomId).emit('playerDisconnected', socketId);
        io.to(roomId).emit('roomState', room);
        stopGameLoop(roomId);
      }
    }
  }

  function startGameLoop(roomId: string) {
    stopGameLoop(roomId);
    
    let tickCount = 0;
    const interval = setInterval(() => {
      const room = rooms.get(roomId);
      if (!room || room.status !== 'playing') {
        stopGameLoop(roomId);
        return;
      }

      tickCount++;
      if (tickCount % 10 === 0) {
         room.timeRemaining -= 1;
      }

      const players = Object.values(room.players);
      if (players.length < 2) {
        room.status = 'waiting';
        stopGameLoop(roomId);
        io.to(roomId).emit('roomState', room);
        return;
      }

      const leftPlayer = players.find(p => p.team === 'left');
      const rightPlayer = players.find(p => p.team === 'right');

      const leftForce = leftPlayer?.force || 0;
      const rightForce = rightPlayer?.force || 0;

      const netForce = (rightForce - leftForce) * MULTIPLIER;
      room.score += netForce * 0.05; // Slightly faster tugging for more excitement
      
      // Boundaries
      if (room.score <= -MAX_SCORE) {
        room.score = -MAX_SCORE;
        room.status = 'finished';
        room.winner = 'left';
        stopGameLoop(roomId);
      } else if (room.score >= MAX_SCORE) {
        room.score = MAX_SCORE;
        room.status = 'finished';
        room.winner = 'right';
        stopGameLoop(roomId);
      } else if (room.timeRemaining <= 0) {
        room.status = 'finished';
        if (Math.abs(room.score) < 1) room.winner = 'tie';
        else room.winner = room.score < 0 ? 'left' : 'right';
        stopGameLoop(roomId);
      }

      io.to(roomId).emit('roomState', room);
    }, TICK_RATE);

    gameIntervals.set(roomId, interval);
  }

  function stopGameLoop(roomId: string) {
    const interval = gameIntervals.get(roomId);
    if (interval) {
      clearInterval(interval);
      gameIntervals.delete(roomId);
    }
  }

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
