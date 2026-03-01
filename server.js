const { createServer } = require('http');
const { parse } = require('url');
const express = require('express');
const next = require('next');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const RATE_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_GENERAL = 400;  // per IP per window
const DEFAULT_MAX_AUTH = 30;      // per IP per window (sign-in, register, callbacks)

// General API (dashboard, listings, nav, etc.)
const generalLimiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: Number(process.env.RATE_LIMIT_MAX_GENERAL) || DEFAULT_MAX_GENERAL,
  message: { error: 'Too many requests. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth: sign-in, register, NextAuth callbacks
const authLimiter = rateLimit({
  windowMs: RATE_WINDOW_MS,
  max: Number(process.env.RATE_LIMIT_MAX_AUTH) || DEFAULT_MAX_AUTH,
  message: { error: 'Too many sign-in attempts. Please try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

function isAuthPath(pathname) {
  return pathname && pathname.startsWith('/api/auth/');
}

app.prepare().then(() => {
  const expressApp = express();

  // Trust proxy so req.ip is set from X-Forwarded-For when behind a reverse proxy
  expressApp.set('trust proxy', 1);

  // Path-specific rate limiting (express-rate-limit works with Express req/res)
  expressApp.use((req, res, nextHandler) => {
    const limiter = isAuthPath(req.path) ? authLimiter : generalLimiter;
    limiter(req, res, nextHandler);
  });

  // All requests go to Next.js (use middleware instead of all('*') to avoid path-to-regexp rejecting '*' in Express 5)
  expressApp.use((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const server = createServer(expressApp);

  function startWithSocket(io) {
    io.on('connection', (socket) => {
      socket.on('join', (userId) => socket.join(userId));
      socket.on('ping', () => socket.emit('pong'));
    });
    global.io = io;
    server.listen(3000, () => console.log('Pinkaroo server on localhost:3000'));
  }

  if (process.env.REDIS_URL) {
    const client = redis.createClient({ url: process.env.REDIS_URL });
    const subClient = client.duplicate();
    Promise.all([client.connect(), subClient.connect()])
      .then(() => {
        const io = new Server(server, { adapter: createAdapter(client, subClient) });
        startWithSocket(io);
      })
      .catch((err) => {
        console.warn('Redis unavailable, using in-memory Socket.io:', err.message);
        startWithSocket(new Server(server));
      });
  } else {
    startWithSocket(new Server(server));
  }
});
