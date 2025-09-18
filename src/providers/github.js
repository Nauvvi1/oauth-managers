
const cfg = require('../config');
const { URLSearchParams } = require('url');

function getAuthUrl(state) {
  const p = new URLSearchParams({
    client_id: cfg.github.clientId,
    redirect_uri: `${cfg.appBaseUrl}/auth/github/callback`,
    scope: cfg.github.scopes.join(' '),
    state
  });
  return `${cfg.github.authUrl}?${p.toString()}`;
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: cfg.github.clientId,
    client_secret: cfg.github.clientSecret,
    redirect_uri: `${cfg.appBaseUrl}/auth/github/callback`,
    code
  });
  const resp = await fetch(cfg.github.tokenUrl, {
    method: 'POST',
    headers: { 'Accept': 'application/json' },
    body
  });
  if (!resp.ok) throw new Error(`GitHub token error: ${resp.status}`);
  return resp.json();
}

async function fetchUserInfo(access_token) {
  const uResp = await fetch(cfg.github.userApi, {
    headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'oauth-manager-demo' }
  });
  if (!uResp.ok) throw new Error(`GitHub user error: ${uResp.status}`);
  const u = await uResp.json();

  let email = u.email || null;
  if (!email) {
    const eResp = await fetch(cfg.github.userEmailsApi, {
      headers: { Authorization: `Bearer ${access_token}`, 'User-Agent': 'oauth-manager-demo', 'Accept': 'application/vnd.github+json' }
    });
    if (eResp.ok) {
      const emails = await eResp.json();
      const primary = emails.find(e => e.primary && e.verified) || emails[0];
      email = primary ? primary.email : null;
    }
  }

  return {
    provider: 'github',
    provider_id: String(u.id),
    name: u.name || u.login || null,
    email,
    avatar: u.avatar_url || null
  };
}

module.exports = { getAuthUrl, exchangeCodeForToken, fetchUserInfo };
