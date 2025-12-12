const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersControllers')
const { validateUser } = require('../middleware/validation')
const authMiddleware = require('../middleware/AuthMiddleware')

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email and password required' })
    }

    // Use findUserByEmail method to find user by email
    const user = await usersController.findUserByEmail(email)

    if (!user) {
      console.warn(`Login attempt: User not found for email: ${email}`)
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    if (user.password !== password) {
      console.warn(`Login attempt: Password mismatch for user: ${email}`)
      return res.status(401).json({ success: false, error: 'Invalid credentials' })
    }

    // Create session
    req.session.userId = user._id
    req.session.email = user.email
    req.session.role = user.role
    req.session.name = user.name


    res.json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

// Get current session user
router.get('/me', authMiddleware, (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.session.userId,
      email: req.session.email,
      role: req.session.role,
      name: req.session.name,
    },
  })
})

// Logout endpoint
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Logout failed' })
    }
    res.clearCookie('connect.sid')
    res.json({ success: true, message: 'Logged out successfully' })
  })
})

router.get('/role/:role', usersController.getUserByRole)
router.get('/email/:email', usersController.getUserByEmail)
router.get('/', usersController.getAllUsers)
router.get('/:id', usersController.getUserById)
router.post('/', validateUser, usersController.createUser)
router.patch('/:id', validateUser, usersController.updateUser)
router.delete('/:id', usersController.deleteUser)

module.exports = router