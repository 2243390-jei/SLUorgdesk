const express = require('express')
const router = express.Router()
const organizationsController = require('../controllers/organizationController')

router.get('/', organizationsController.getAllOrganization)
router.post('/', organizationsController.createOrganization)
router.patch('/:id', organizationsController.updateOrganization)
router.delete('/:id', organizationsController.deleteOrganization)

module.exports = router