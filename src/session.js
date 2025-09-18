
const { randomUUID } = require('crypto');
const cookie = require('cookie');
const ONE_DAY = 24 * 60 * 60;

function sessionMiddleware(redis, opts = {}) {
  const cookieName = opts.cookieName || 'sid';
  const ttl = opts.ttl || ONE_DAY * 7;

  return async (req, res, next) => {
    const cookies = req.headers.cookie ? cookie.parse(req.headers.cookie) : {};
    let sid = cookies[cookieName];

    if (!sid) {
      sid = randomUUID();
      res.setHeader('Set-Cookie', cookie.serialize(cookieName, sid, {
        httpOnly: true,
        path: '/',
        maxAge: ttl,
        sameSite: 'lax'
      }));
      req.session = { id: sid, data: {} };
      next();
      return;
    }

    try {
      const raw = await redis.get(`sess:${sid}`);
      req.session = { id: sid, data: raw ? JSON.parse(raw) : {} };
    } catch (e) {
      console.error('Redis session read error:', e);
      req.session = { id: sid, data: {} };
    }

    res.on('finish', async () => {
      try {
        await redis.set(`sess:${sid}`, JSON.stringify(req.session.data), { EX: ttl });
      } catch (e) {
        console.error('Redis session write error:', e);
      }
    });

    next();
  };
}

module.exports = { sessionMiddleware };
