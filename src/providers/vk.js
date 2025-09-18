const cfg = require('../config');
const { URLSearchParams } = require('url');

function redirectUri() {
  return `${cfg.appBaseUrl}/auth/vk/callback`;
}

function getAuthUrl(state) {
  const p = new URLSearchParams({
    client_id: cfg.vk.clientId,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: 'email',
    state,
    display: 'page'
  });

  const url = `${cfg.vk.authUrl}?${p.toString()}`;
  console.log('[VK authorize URL]', url);
  return url;
}

async function exchangeCodeForToken(code) {
  const p = new URLSearchParams({
    client_id: cfg.vk.clientId,
    client_secret: cfg.vk.clientSecret,
    redirect_uri: redirectUri(),
    code
  });

  const url = `${cfg.vk.tokenUrl}?${p.toString()}`;
  const resp = await fetch(url, { method: 'GET' });
  if (!resp.ok) throw new Error(`VK token error: ${resp.status} ${resp.statusText}`);

  const data = await resp.json();
  if (data.error || data.error_description) {
    throw new Error(`VK token JSON error: ${data.error || ''} ${data.error_description || ''}`.trim());
  }
  return data;
}

async function fetchUserInfo(access_token, user_id, emailFromToken) {
  const p = new URLSearchParams({
    user_ids: String(user_id),
    fields: 'photo_200',
    v: cfg.vk.apiVersion,
    access_token
  });
  const url = `${cfg.vk.userApi}?${p.toString()}`;

  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`VK user error: ${resp.status} ${resp.statusText}`);

  const data = await resp.json();
  if (data.error) {
    throw new Error(`VK user JSON error: ${JSON.stringify(data.error)}`);
  }

  const u = (data.response && data.response[0]) || {};
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ');

  return {
    provider: 'vk',
    provider_id: String(user_id),
    name: name || null,
    email: emailFromToken || null,
    avatar: u.photo_200 || null
  };
}

module.exports = { getAuthUrl, exchangeCodeForToken, fetchUserInfo };
