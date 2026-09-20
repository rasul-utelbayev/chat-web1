import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { storage } from './server/storage.js';
import type { User, WSClientAction, WSServerAction, OnlineUser } from './src/types.js';

interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  user?: User;
  currentRoomId?: string;
  lastActive?: number;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Helper to extract bearer token
function getBearerToken(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

// ---------------- REST API Routes ----------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Register
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password, displayName } = req.body || {};
    const result = storage.register(username, password, displayName);
    res.status(201).json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Ro'yxatdan o'tishda xatolik yuz berdi" });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body || {};
    const result = storage.login(username, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Kirishda xatolik yuz berdi' });
  }
});

// Current user verification
app.get('/api/auth/me', (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiya talab etiladi' });
  }
  const user = storage.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Sessiya eskirgan yoki mavjud emas' });
  }
  res.json({ user });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    storage.logout(token);
  }
  res.json({ success: true });
});

// Get rooms
app.get('/api/rooms', (req, res) => {
  res.json({ rooms: storage.getRooms() });
});

// Get room messages
app.get('/api/rooms/:id/messages', (req, res) => {
  const roomId = req.params.id;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
  const messages = storage.getMessages(roomId, limit);
  res.json({ messages });
});

// Send message via REST API
app.post('/api/rooms/:id/messages', (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Avtorizatsiya talab etiladi' });
  }
  const user = storage.getUserByToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Yaroqsiz sessiya' });
  }

  const roomId = req.params.id;
  const { text } = req.body || {};

  try {
    const message = storage.addMessage(roomId, user, text);
    broadcastToRoom(roomId, { type: 'new_message', message });
    res.status(201).json({ message });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Xabarni yuborib bo‘lmadi' });
  }
});

// ---------------- HTTP & WebSocket Server ----------------
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

function sendWS(ws: WebSocket, data: WSServerAction) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function broadcastAll(data: WSServerAction) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

function broadcastToRoom(roomId: string, data: WSServerAction, excludeWs?: WebSocket) {
  const payload = JSON.stringify(data);
  for (const client of wss.clients) {
    const extWs = client as ExtendedWebSocket;
    if (extWs !== excludeWs && extWs.readyState === WebSocket.OPEN && extWs.currentRoomId === roomId) {
      extWs.send(payload);
    }
  }
}

function broadcastPresence() {
  const onlineMap = new Map<string, OnlineUser>();
  for (const client of wss.clients) {
    const extWs = client as ExtendedWebSocket;
    if (extWs.readyState === WebSocket.OPEN && extWs.user) {
      onlineMap.set(extWs.user.id, {
        id: extWs.user.id,
        username: extWs.user.username,
        displayName: extWs.user.displayName,
        avatarColor: extWs.user.avatarColor,
        currentRoomId: extWs.currentRoomId,
        lastActive: extWs.lastActive || Date.now(),
      });
    }
  }

  const onlineUsers = Array.from(onlineMap.values());
  broadcastAll({
    type: 'presence_update',
    onlineUsers,
    count: onlineUsers.length,
  });
}

// WebSocket Connection handler
wss.on('connection', (socket: WebSocket) => {
  const ws = socket as ExtendedWebSocket;
  ws.isAlive = true;
  ws.currentRoomId = 'general';
  ws.lastActive = Date.now();

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', (raw: string) => {
    try {
      const data: WSClientAction = JSON.parse(raw.toString());
      ws.lastActive = Date.now();

      switch (data.type) {
        case 'auth': {
          const user = storage.getUserByToken(data.token);
          if (user) {
            ws.user = user;
            sendWS(ws, { type: 'auth_success', user });
            broadcastPresence();
          } else {
            sendWS(ws, { type: 'auth_error', message: 'Sessiya yaroqsiz' });
          }
          break;
        }

        case 'join_room': {
          ws.currentRoomId = data.roomId;
          broadcastPresence();
          break;
        }

        case 'leave_room': {
          if (ws.currentRoomId === data.roomId) {
            ws.currentRoomId = undefined;
          }
          broadcastPresence();
          break;
        }

        case 'send_message': {
          if (!ws.user) {
            sendWS(ws, { type: 'auth_error', message: 'Avtorizatsiyadan o‘tishingiz kerak' });
            return;
          }

          try {
            const message = storage.addMessage(data.roomId, ws.user, data.text);
            // Broadcast to all clients in this room (including sender)
            broadcastToRoom(data.roomId, { type: 'new_message', message });
          } catch (err: any) {
            // Can send error back to user if needed
            console.error('Failed to add message:', err);
          }
          break;
        }

        case 'typing': {
          if (ws.user && data.roomId) {
            broadcastToRoom(
              data.roomId,
              {
                type: 'user_typing',
                roomId: data.roomId,
                username: ws.user.username,
                displayName: ws.user.displayName,
                isTyping: Boolean(data.isTyping),
              },
              ws
            );
          }
          break;
        }

        case 'ping': {
          sendWS(ws, { type: 'pong' });
          break;
        }
      }
    } catch (err) {
      console.error('Invalid WS message received:', err);
    }
  });

  ws.on('close', () => {
    broadcastPresence();
  });
});

// Periodic ping / dead socket cleanup
const heartbeatInterval = setInterval(() => {
  for (const client of wss.clients) {
    const extWs = client as ExtendedWebSocket;
    if (!extWs.isAlive) {
      extWs.terminate();
      continue;
    }
    extWs.isAlive = false;
    extWs.ping();
  }
}, 30000);

wss.on('close', () => {
  clearInterval(heartbeatInterval);
});

// ---------------- Vite / Static middleware ----------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
