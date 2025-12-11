const express = require('express')
const router = express.Router()
const usersRoutes = require('./users')
const organizationsRoutes = require('./organizations')
const statsRoutes = require('./stats')

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ success: true, message: 'Server is running' })
})

// API Routes
router.use('/api/users', usersRoutes)
router.use('/api/organizations', organizationsRoutes)
router.use('/api/stats', statsRoutes)

module.exports = router