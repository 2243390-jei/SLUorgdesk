const session = require('express-session');

module.exports = session({
  secret: 'a8f3e2c9d5b1f7a4e6c2d9b3f5a7e1c4d6b8a2f4e7c9b1d3f5a7e9c2b4d6a8',
  resave: false,
  saveUninitialized: false,
  name: 'connect.sid',
  cookie: {
    secure: false, // set to true if using HTTPS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
  },
});