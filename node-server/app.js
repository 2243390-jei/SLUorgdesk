const express = require('express')
const cors = require('cors')
const path = require('path')
const { connectDB } = require('./config/database')
const routes = require('./routes')
const { notFound, errorHandler } = require('./middleware/errorHandler')

// connect to DB (uses env MONGO_URI if present)
connectDB().catch((err) => console.error('DB connect failed:', err))

const app = express()
app.use(cors())
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