const express = require('express');
const router = express.Router();
const organizationsController = require('../controllers/organizationControllers');
const { validateOrganization } = require('../middleware/validation');
const authMiddleware = require('../middleware/AuthMiddleware');

router.get('/filtered', organizationsController.getFilteredOrganizations);
router.get('/', authMiddleware, organizationsController.getAllOrganization);
router.get('/:id', organizationsController.getOrganizationById);
router.post('/', validateOrganization, organizationsController.createOrganization);
router.patch('/:id', validateOrganization, organizationsController.updateOrganization);
router.delete('/:id', organizationsController.deleteOrganization);
router.patch('/:id', validateOrganization, organizationsController.updateOrganization)
router.put('/:id', validateOrganization, organizationsController.updateOrganization)
router.delete('/:id', organizationsController.deleteOrganization)

module.exports = router;