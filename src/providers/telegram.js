
const crypto = require('crypto');
const cfg = require('../config');

function verifyTelegramLogin(data) {
  const { hash, ...fields } = data;
  const token = cfg.telegram.botToken;
  if (!token) return null;

  const checkString = Object.keys(fields)
    .sort()
    .map(k => `${k}=${fields[k]}`)
    .join('\n');

  const secretKey = crypto.createHash('sha256').update(token).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

  if (hmac !== hash) {
    return null;
  }

  const name = [fields.first_name, fields.last_name].filter(Boolean).join(' ');
  return {
    provider: 'telegram',
    provider_id: String(fields.id),
    name: name || fields.username || null,
    email: null,
    avatar: fields.photo_url || null
  };
}

module.exports = { verifyTelegramLogin };
