// Ensures .env is loaded even if this module is imported on its own.
require('./env');

const session = require('express-session');

const isProduction = (process.env.NODE_ENV || 'development') === 'production';
const secret = process.env.SESSION_SECRET;

if (!secret) {
  if (isProduction) {
    // Fail fast rather than signing session cookies with a guessable constant.
    throw new Error(
      'SESSION_SECRET must be set in production (Secret Manager on Cloud Run, or node-server/.env locally).'
    );
  }
  console.warn('[session] SESSION_SECRET is not set - using an insecure development default.');
}

// The API sits behind the Apache reverse proxy (and Cloud Run's load balancer),
// so express-session must read X-Forwarded-Proto to know the browser used HTTPS.
const cookieSecure = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : isProduction;

module.exports = session({
  secret: secret || 'dev-only-insecure-secret-change-me',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  proxy: true,
  cookie: {
    secure: cookieSecure,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
});