
require('dotenv').config();

const cfg = {
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',
  port: Number(process.env.PORT || 3000),
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret',
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/oauth_demo',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: ['openid', 'profile', 'email'],
    userInfoUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: ['read:user', 'user:email'],
    userApi: 'https://api.github.com/user',
    userEmailsApi: 'https://api.github.com/user/emails'
  },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    scopes: ['identify', 'email'],
    userApi: 'https://discord.com/api/users/@me'
  },
  vk: {
    clientId: process.env.VK_CLIENT_ID || '',
    clientSecret: process.env.VK_CLIENT_SECRET || '',
    authUrl: 'https://oauth.vk.com/authorize',
    tokenUrl: 'https://oauth.vk.com/access_token',
    apiVersion: '5.199',
    userApi: 'https://api.vk.com/method/users.get'
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME || '',
  }
};

module.exports = cfg;
