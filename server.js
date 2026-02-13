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
/* Custom server for Socket.io real-time notifications in Pinkaroo, with rate-limiting and Redis for high-traffic */
app.prepare().then(() => {
  const server = createServer((req, res) => {
    const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
    limiter(req, res, () => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });
  });
  const client = redis.createClient({ url: process.env.REDIS_URL });
  const subClient = client.duplicate();
  Promise.all([client.connect(), subClient.connect()]).then(() => {
    const io = new Server(server, { adapter: createAdapter(client, subClient) });
    io.on('connection', (socket) => {
      socket.on('join', (userId) => socket.join(userId));
      socket.on('ping', () => socket.emit('pong')); // Heartbeat
    });
    global.io = io;
    server.listen(3000, () => console.log('Pinkaroo server on localhost:3000'));
  });
});
