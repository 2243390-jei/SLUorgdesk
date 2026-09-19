const express = require('express');
const router = express.Router();
const organizationsController = require('../controllers/organizationControllers');
const { validateOrganization } = require('../middleware/validation');
const authMiddleware = require('../middleware/AuthMiddleware');

// Reads and mutations of organization records all require an authenticated
// session. `GET /` already had the guard; the rest were reachable anonymously.
router.get('/filtered', authMiddleware, organizationsController.getFilteredOrganizations);
router.get('/', authMiddleware, organizationsController.getAllOrganization);
router.get('/:id', authMiddleware, organizationsController.getOrganizationById);
router.post('/', authMiddleware, validateOrganization, organizationsController.createOrganization);
router.patch('/:id', authMiddleware, validateOrganization, organizationsController.updateOrganization);
router.delete('/:id', authMiddleware, organizationsController.deleteOrganization);
router.patch('/:id', authMiddleware, validateOrganization, organizationsController.updateOrganization)
router.put('/:id', authMiddleware, validateOrganization, organizationsController.updateOrganization)
router.delete('/:id', authMiddleware, organizationsController.deleteOrganization)

module.exports = router;