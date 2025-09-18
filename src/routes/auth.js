
const express = require('express');
const { randomUUID } = require('crypto');
const cfg = require('../config');
const { query } = require('../db');

function authRouter(redis) {
  const router = express.Router();

  const providers = {
    google: require('../providers/google'),
    github: require('../providers/github'),
    discord: require('../providers/discord'),
    vk: require('../providers/vk'),
  };
  const { verifyTelegramLogin } = require('../providers/telegram');

  router.get('/:provider/start', async (req, res) => {
    try {
      const provider = req.params.provider;
      if (!providers[provider]) return res.status(400).send({ error: 'Unknown provider' });

      const state = randomUUID();
      await redis.set(`oauth:state:${state}`, JSON.stringify({
        provider,
        sid: req.session.id
      }), { EX: 600 });

      const url = providers[provider].getAuthUrl(state);
      res.redirect(url);
    } catch (e) {
      console.error('start error', e);
      res.status(500).send({ error: 'start_failed' });
    }
  });

  router.get('/:provider/callback', async (req, res) => {
    try {
      const provider = req.params.provider;
      if (!providers[provider]) return res.status(400).send({ error: 'Unknown provider' });

      const { code, state } = req.query;
      if (!code || !state) return res.status(400).send({ error: 'Missing code/state' });

      const stateKey = `oauth:state:${state}`;
      const rawState = await redis.get(stateKey);
      if (!rawState) return res.status(400).send({ error: 'Invalid state' });
      await redis.del(stateKey);

      const tokenData = await providers[provider].exchangeCodeForToken(code);

      let profile;
      if (provider === 'vk') {
        profile = await providers.vk.fetchUserInfo(tokenData.access_token, tokenData.user_id, tokenData.email);
      } else {
        profile = await providers[provider].fetchUserInfo(tokenData.access_token);
      }

      const client = await require('../db').getClient();
      try {
        await client.query('BEGIN');

        let userId = null;
        const q1 = await client.query(
          'SELECT user_id FROM identities WHERE provider=$1 AND provider_id=$2',
          [profile.provider, profile.provider_id]
        );
        if (q1.rows.length) {
          userId = q1.rows[0].user_id;
          await client.query(
            'UPDATE users SET name=COALESCE($1,name), email=COALESCE($2,email), avatar_url=COALESCE($3,avatar_url), updated_at=NOW() WHERE id=$4',
            [profile.name, profile.email, profile.avatar, userId]
          );
        } else {
          if (profile.email) {
            const q2 = await client.query('SELECT id FROM users WHERE email=$1', [profile.email]);
            if (q2.rows.length) {
              userId = q2.rows[0].id;
            }
          }
          if (!userId) {
            const ins = await client.query(
              'INSERT INTO users(name,email,avatar_url) VALUES($1,$2,$3) RETURNING id',
              [profile.name, profile.email, profile.avatar]
            );
            userId = ins.rows[0].id;
          }
          await client.query(
            `INSERT INTO identities(user_id,provider,provider_id,access_token,refresh_token,scope,expires_at)
             VALUES($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (provider, provider_id) DO UPDATE SET
               access_token=EXCLUDED.access_token,
               refresh_token=EXCLUDED.refresh_token,
               scope=EXCLUDED.scope,
               expires_at=EXCLUDED.expires_at,
               updated_at=NOW()`,
            [userId, profile.provider, profile.provider_id, tokenData.access_token || null, tokenData.refresh_token || null, tokenData.scope || null, null]
          );
        }

        await client.query('COMMIT');

        req.session.data.userId = userId;
        req.session.data.lastProvider = profile.provider;

        res.redirect('/');
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('db error', e);
        res.status(500).send({ error: 'db_failed' });
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('callback error', e);
      res.status(500).send({ error: 'callback_failed' });
    }
  });

  router.get('/telegram/callback', async (req, res) => {
    try {
      const data = Object.fromEntries(Object.entries(req.query).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
      const profile = verifyTelegramLogin(data);
      if (!profile) return res.status(400).send({ error: 'telegram_verify_failed' });

      const client = await require('../db').getClient();
      try {
        await client.query('BEGIN');

        let userId = null;
        const q1 = await client.query(
          'SELECT user_id FROM identities WHERE provider=$1 AND provider_id=$2',
          [profile.provider, profile.provider_id]
        );
        if (q1.rows.length) {
          userId = q1.rows[0].user_id;
          await client.query(
            'UPDATE users SET name=COALESCE($1,name), avatar_url=COALESCE($2,avatar_url), updated_at=NOW() WHERE id=$3',
            [profile.name, profile.avatar, userId]
          );
        } else {
          const ins = await client.query(
            'INSERT INTO users(name,email,avatar_url) VALUES($1,$2,$3) RETURNING id',
            [profile.name, profile.email, profile.avatar]
          );
          userId = ins.rows[0].id;

          await client.query(
            `INSERT INTO identities(user_id,provider,provider_id)
             VALUES($1,$2,$3)
             ON CONFLICT (provider, provider_id) DO NOTHING`,
            [userId, profile.provider, profile.provider_id]
          );
        }

        await client.query('COMMIT');

        req.session.data.userId = userId;
        req.session.data.lastProvider = profile.provider;

        res.redirect('/');
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('db error', e);
        res.status(500).send({ error: 'db_failed' });
      } finally {
        client.release();
      }
    } catch (e) {
      console.error('telegram callback error', e);
      res.status(500).send({ error: 'telegram_callback_failed' });
    }
  });

  return router;
}

module.exports = { authRouter };
