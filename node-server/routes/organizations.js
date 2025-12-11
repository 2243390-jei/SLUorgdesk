const express = require('express');
const router = express.Router();
const organizationsController = require('../controllers/organizationControllers');
const { validateOrganization } = require('../middleware/validation');
const authMiddleware = require('../middleware/AuthMiddleware');

// Specific routes MUST come before dynamic /:id routes
router.get('/filtered', organizationsController.getFilteredOrganizations);

// Dynamic routes AFTER specific ones
router.get('/', authMiddleware, organizationsController.getAllOrganization);
router.get('/:id', organizationsController.getOrganizationById);
router.post('/', validateOrganization, organizationsController.createOrganization);
router.patch('/:id', validateOrganization, organizationsController.updateOrganization);
router.delete('/:id', organizationsController.deleteOrganization);


// Accept both PATCH and PUT for updates so frontend PUT requests succeed
router.patch('/:id', validateOrganization, organizationsController.updateOrganization)
router.put('/:id', validateOrganization, organizationsController.updateOrganization)

router.delete('/:id', organizationsController.deleteOrganization)

module.exports = router;