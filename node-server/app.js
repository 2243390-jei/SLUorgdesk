const express = require('express')
const cors = require('cors')
const path = require('path')
const { connectDB } = require('./config/database')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// connect to DB (uses env MONGO_URI if present)
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

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// API routes FIRST (higher priority)
app.use('/', routes)

// Static file serving AFTER API routes
// Serve uploads folder
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Serve static client files from root directory (lowest priority)
app.use(express.static(path.join(__dirname, '..')))

// 404 + error handlers (must be last)
app.use(notFound)
app.use(errorHandler)

module.exports = app