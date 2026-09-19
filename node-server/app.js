// Must come first: config/session.js and middleware/internalAuth.js read
// process.env at module load time.
require('./config/env')

const express = require('express')
const sessionConfig = require('./config/session')
const cors = require('cors')
const path = require('path')
const { connectDB } = require('./config/database')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const internalAuth = require('./middleware/internalAuth')

// connect to DB 
connectDB().catch((err) => console.error('DB connect failed:', err))

const app = express()

// The API always sits behind a reverse proxy (Apache locally, Apache plus the
// Cloud Run load balancer in production), so the real client protocol and
// address arrive in X-Forwarded-*. Trusting exactly one hop lets express-session
// issue Secure cookies over HTTPS without letting clients spoof their address.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? 1))

// Extra browser origins allowed to call the API directly (comma separated).
// Requests served through the web container's /api/* proxy are same-origin, so
// CORS does not apply to them at all.
const getServerHost = () => {
  const host = process.env.SERVER_HOST || 'localhost'
  if (host === '0.0.0.0') return '*'
  return `http://${host}`
}

const corsOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://localhost:8080',
  'http://127.0.0.1',
  'http://127.0.0.1:8080',
  getServerHost(),
  ...(process.env.CORS_ORIGINS || '').split(',').map((o) => o.trim())
].filter((origin, index, self) => self.indexOf(origin) === index && origin !== '*')

// Allow API respond to frontend
const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (corsOrigins.includes(origin)) return callback(null, true)
    const allowAll = process.env.NODE_ENV !== 'production'
    if (allowAll) return callback(null, true)
    return callback(new Error('CORS policy violation'), false)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
})

// Requests relayed by the web container's reverse proxy are same-origin: the
// browser is already on that origin and only attached an Origin header (browsers
// send one for same-origin POSTs too). Enforcing the cross-origin allow-list on
// them would reject every login and form submission, so the allow-list applies
// to direct callers only.
app.use((req, res, next) => {
  if (internalAuth.fromProxy(req)) return next()
  return corsMiddleware(req, res, next)
})

// Session middleware
app.use(sessionConfig)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next) => {
  if (req.url.startsWith('/api/User')) {
    req.url = req.url.replace(/^\/api\/User/, '/api/users')
  } else if (req.url.startsWith('/api/Organizations')) {
    req.url = req.url.replace(/^\/api\/Organizations/, '/api/organizations')
  }
  next()
})

// Reject API calls that did not come through the reverse proxy. Enabled only
// when INTERNAL_AUTH_TOKEN is configured, so local runs are unaffected.
app.use('/api', internalAuth)

// mount upload router so frontend can POST /api/upload_logo
const uploadRouter = require('./middleware/upload');
app.use('/api', uploadRouter);
// API routes
app.use('/', routes)

// Serve uploads folder.
// Guarded by the same shared secret: submitted documents must not be readable by
// anyone who discovers the raw Cloud Run URL. The browser never needs this route
// (Apache serves /uploads/** from the shared volume and enforces access through
// uploads/.htaccess), so the guard is transparent on the proxy path.
app.use('/uploads', internalAuth, express.static(path.join(__dirname, '..', 'uploads')))

// Serve static client files from root directory (lowest priority)
app.use(express.static(path.join(__dirname, '..')))

// 404 + error handlers
app.use(notFound)
app.use(errorHandler)

module.exports = app