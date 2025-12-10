const express = require('express')
const router = express.Router()
const usersController = require('../controllers/usersControllers')
const { validateUser } = require('../middleware/validation')

// Specific routes MUST come before dynamic /:id routes
router.get('/role/:role', usersController.getUserByRole)
router.get('/email/:email', usersController.getUserByEmail)

// Dynamic routes AFTER specific ones
router.get('/', usersController.getAllUsers)
router.get('/:id', usersController.getUserById)
router.post('/', validateUser, usersController.createUser)
router.patch('/:id', validateUser, usersController.updateUser)
router.delete('/:id', usersController.deleteUser)

module.exports = router