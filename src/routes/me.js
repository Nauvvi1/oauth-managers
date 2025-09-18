
const express = require('express');
const { query } = require('../db');

function meRouter() {
  const router = express.Router();

  router.get('/me', async (req, res) => {
    try {
      const userId = req.session?.data?.userId;
      if (!userId) return res.status(401).send({ authenticated: false });

      const u = await query('SELECT id, name, email, avatar_url FROM users WHERE id=$1', [userId]);
      if (!u.rows.length) return res.status(401).send({ authenticated: false });

      const me = u.rows[0];
      res.send({ authenticated: true, user: me, provider: req.session.data.lastProvider || null });
    } catch (e) {
      console.error('/me error', e);
      res.status(500).send({ error: 'me_failed' });
    }
  });

  router.post('/logout', async (req, res) => {
    req.session.data = {};
    res.send({ ok: true });
  });

  return router;
}

module.exports = { meRouter };
