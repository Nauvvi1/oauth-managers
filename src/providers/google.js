
const cfg = require('../config');
const { URLSearchParams } = require('url');

function getAuthUrl(state) {
  const p = new URLSearchParams({
    client_id: cfg.google.clientId,
    redirect_uri: `${cfg.appBaseUrl}/auth/google/callback`,
    response_type: 'code',
    scope: cfg.google.scopes.join(' '),
    access_type: 'offline',
    include_granted_scopes: 'true',
    state
  });
  return `${cfg.google.authUrl}?${p.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: cfg.google.clientId,
    client_secret: cfg.google.clientSecret,
    redirect_uri: `${cfg.appBaseUrl}/auth/google/callback`,
    grant_type: 'authorization_code',
    code
  });
  const resp = await fetch(cfg.google.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!resp.ok) throw new Error(`Google token error: ${resp.status}`);
  return resp.json();
}

async function fetchUserInfo(access_token) {
  const resp = await fetch(cfg.google.userInfoUrl, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  if (!resp.ok) throw new Error(`Google userinfo error: ${resp.status}`);
  const u = await resp.json();
  return {
    provider: 'google',
    provider_id: u.sub,
    name: u.name || [u.given_name, u.family_name].filter(Boolean).join(' '),
    email: u.email || null,
    avatar: u.picture || null
  };
}

module.exports = { getAuthUrl, exchangeCodeForToken, fetchUserInfo };
