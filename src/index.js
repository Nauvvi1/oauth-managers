
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { createClient } = require('redis');
const cfg = require('./config');
const { sessionMiddleware } = require('./session');

(async () => {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser(cfg.sessionSecret));

  const redis = createClient({ url: cfg.redisUrl });
  redis.on('error', (err) => console.error('Redis Client Error', err));
  await redis.connect();

  app.use(sessionMiddleware(redis));

  const { authRouter } = require('./routes/auth');
  const { meRouter } = require('./routes/me');
  app.use('/auth', authRouter(redis));
  app.use(meRouter());

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.get('/health', (req, res) => res.send({ ok: true }));

  app.listen(cfg.port, () => {
    console.log(`OAuth Manager Demo running on ${cfg.appBaseUrl} (port ${cfg.port})`);
  });
})().catch((e) => {
  console.error('Fatal start error:', e);
  process.exit(1);
});
