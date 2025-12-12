const express = require('express')
const sessionConfig = require('./config/session')
const cors = require('cors')
const path = require('path')
const { connectDB } = require('./config/database')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// connect to DB 
connectDB().catch((err) => console.error('DB connect failed:', err))

const app = express()

// Configure CORS with dynamic host
const getServerHost = () => {
  const host = process.env.SERVER_HOST || 'localhost'
  if (host === '0.0.0.0') return '*'
  return `http://${host}`
}

const corsOrigins = [
  'http://localhost',
  'http://localhost:80',
  'http://127.0.0.1',
  getServerHost()
].filter((origin, index, self) => self.indexOf(origin) === index && origin !== '*')

// Allow API respond to frontend
app.use(cors({
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
}))

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

// mount upload router so frontend can POST /api/upload_logo
const uploadRouter = require('./middleware/upload');
app.use('/api', uploadRouter);

// API routes
app.use('/', routes)

// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Serve static client files from root directory (lowest priority)
app.use(express.static(path.join(__dirname, '..')))

// 404 + error handlers
app.use(notFound)
app.use(errorHandler)

module.exports = app