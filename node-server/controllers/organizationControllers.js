const Organization = require('../models/Organization')

const getAllOrganization = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50
        const offset = req.query.offset ? parseInt(req.query.offset) : 0

        const organizations = await Organization.find()
            .select('_id name acronym school localLogoPath email isWhitelisted createdAt')
            .skip(offset)
            .limit(limit)
            .lean()

        res.status(200).json({ success: true, data: organizations })
    } catch (err) {
        console.error('Error fetching organization:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch organization', details: err.message })
    }
}

const getOrganizationById = async (req, res) => {
    try {
        const { id } = req.params

        const organization = await Organization.findById(id)
            .select('_id name acronym school localLogoPath email isWhitelisted members createdAt')
            .lean()

        if (!organization) {
            return res.status(404).json({ success: false, error: 'Organization not found' })
        }

        res.status(200).json({ success: true, data: organization })
    } catch (err) {
        console.error('Error fetching organization by ID:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch organization', details: err.message })
    }
}

const getFilteredOrganizations = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100
        const offset = req.query.offset ? parseInt(req.query.offset) : 0

        const filters = {}

        if (req.query.id) {
            filters._id = req.query.id
        }
        if (req.query.search) {
            filters.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { acronym: { $regex: req.query.search, $options: 'i' } }
            ]
        }
        if (req.query.school) {
            filters.school = req.query.school
        }
        if (req.query.acronym) {
            filters.acronym = req.query.acronym
        }

        const organizations = await Organization.find(filters)
            .select('_id name acronym school localLogoPath email isWhitelisted createdAt')
            .skip(offset)
            .limit(limit)
            .lean()

        res.status(200).json({ success: true, data: organizations })
    } catch (err) {
        console.error('Error fetching filtered organizations:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch organizations', details: err.message })
    }
}

const createOrganization = async (req, res) => {
    try {
        const { name, acronym, school, email, isWhitelisted, localLogoPath } = req.body

        if (!name || !acronym) {
            return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        const newOrganization = new Organization({
            name,
            acronym,
            school: school || null,
            email: email || null,
            isWhitelisted: isWhitelisted !== undefined ? isWhitelisted : false,
            localLogoPath: localLogoPath || null
        })

        const savedOrganization = await newOrganization.save()
        res.status(201).json({ success: true, id: savedOrganization._id.toString() })
    } catch (err) {
        console.error('Error create organization:', err)
        res.status(500).json({ success: false, error: 'Failed to create organization', details: err.message })
    }
}

const updateOrganization = async (req, res) => {
    try {
        const { id } = req.params
        const updateData = req.body

        updateData.updatedAt = new Date()

        const result = await Organization.findByIdAndUpdate(id, updateData, { new: true })

        if (!result) {
            return res.status(404).json({ success: false, error: 'Organization not found' })
        }

        res.status(200).json({ success: true })
    } catch (err) {
        console.error('Error update organization:', err)
        res.status(500).json({ success: false, error: 'Failed to update organization', details: err.message })
    }
}

const deleteOrganization = async (req, res) => {
    try {
        const { id } = req.params

        const result = await Organization.findByIdAndDelete(id)

        if (!result) {
            return res.status(404).json({ success: false, error: 'Organization not found' })
        }

        res.status(200).json({ success: true })
    } catch (err) {
        console.error('Error delete organization:', err)
        res.status(500).json({ success: false, error: 'Failed to delete organization', details: err.message })
    }
}

module.exports = { getAllOrganization, getOrganizationById, getFilteredOrganizations, createOrganization, updateOrganization, deleteOrganization }