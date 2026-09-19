const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
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

    // Verify password using bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password || '')
    if (!passwordMatch) {
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

// Everything below reads or mutates user records, so it requires an authenticated
// session. Without this guard anyone who can reach the app could list every user,
// create an account - including an admin, since `role` is taken from the request
// body - or delete existing users. `validateUser` checks the payload shape, not
// the identity of the caller.
router.get('/role/:role', authMiddleware, usersController.getUserByRole)
router.get('/email/:email', authMiddleware, usersController.getUserByEmail)
router.get('/', authMiddleware, usersController.getAllUsers)
router.get('/:id', authMiddleware, usersController.getUserById)
router.post('/', authMiddleware, validateUser, usersController.createUser)
router.patch('/:id', authMiddleware, validateUser, usersController.updateUser)
router.delete('/:id', authMiddleware, usersController.deleteUser)

module.exports = router