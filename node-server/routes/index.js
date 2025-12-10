const express = require('express')
const router = express.Router()
const usersRoutes = require('./users')
const organizationsRoutes = require('./organizations')

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' })
})

// API Routes
router.use('/api/User', usersRoutes)
router.use('/api/Organizations', organizationsRoutes)

module.exports = router