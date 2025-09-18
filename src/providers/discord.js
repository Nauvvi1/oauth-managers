
const cfg = require('../config');
const { URLSearchParams } = require('url');

function getAuthUrl(state) {
  const p = new URLSearchParams({
    client_id: cfg.discord.clientId,
    redirect_uri: `${cfg.appBaseUrl}/auth/discord/callback`,
    response_type: 'code',
    scope: cfg.discord.scopes.join(' '),
    state,
    prompt: 'consent'
  });
  return `${cfg.discord.authUrl}?${p.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: cfg.discord.clientId,
    client_secret: cfg.discord.clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${cfg.appBaseUrl}/auth/discord/callback`
  });
  const resp = await fetch(cfg.discord.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!resp.ok) throw new Error(`Discord token error: ${resp.status}`);
  return resp.json();
}

async function fetchUserInfo(access_token) {
  const resp = await fetch(cfg.discord.userApi, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!resp.ok) throw new Error(`Discord user error: ${resp.status}`);
  const u = await resp.json();
  const username = [u.global_name, u.username].filter(Boolean).join(' / ');
  const avatar = u.avatar ? `https://cdn.discordapp.com/avatars/${u.id}/${u.avatar}.png` : null;
  return {
    provider: 'discord',
    provider_id: String(u.id),
    name: username || null,
    email: u.email || null,
    avatar
  };
}

module.exports = { getAuthUrl, exchangeCodeForToken, fetchUserInfo };
