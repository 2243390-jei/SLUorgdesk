const express = require('express')
const router = express.Router()
const organizationsController = require('../controllers/organizationControllers')
const { validateOrganization } = require('../middleware/validation')

// Specific routes MUST come before dynamic /:id routes
router.get('/filtered', organizationsController.getFilteredOrganizations)

// Dynamic routes AFTER specific ones
router.get('/', organizationsController.getAllOrganization)
router.get('/:id', organizationsController.getOrganizationById)
router.post('/', validateOrganization, organizationsController.createOrganization)
router.patch('/:id', validateOrganization, organizationsController.updateOrganization)
router.delete('/:id', organizationsController.deleteOrganization)

module.exports = router