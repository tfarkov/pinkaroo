const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const generalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Too many attempts' } });

function isAuthPath(url) {
  const path = typeof url === 'string' ? url : url?.pathname;
  return path && (path.includes('/api/auth/callback') || path === '/api/auth/register');
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    const limiter = isAuthPath(parsedUrl.pathname) ? authLimiter : generalLimiter;
    limiter(req, res, () => {
      handle(req, res, parsedUrl);
    });
  });

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
