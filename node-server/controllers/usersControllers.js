const User = require('../models/User')

const getAllUsers = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 50
        const offset = req.query.offset ? parseInt(req.query.offset) : 0

        const users = await User.find()
            .select('_id name email role organization isActive createdAt')
            .populate('organization', 'name')
            .skip(offset)
            .limit(limit)
            .lean()

        res.status(200).json({ success: true, data: users })
    } catch (err) {
        console.error('Error fetching users:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch users', details: err.message })
    }
}

const getUserById = async (req, res) => {
    try {
        const { id } = req.params

        const user = await User.findById(id)
            .select('_id name email role studentId school course yearLevel isActive organizations createdAt')
            .lean()

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' })
        }

        res.status(200).json({ success: true, data: user })
    } catch (err) {
        console.error('Error fetching user by ID:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch user', details: err.message })
    }
}

const getUserByRole = async (req, res) => {
    try {
        const { role } = req.params
        const limit = req.query.limit ? parseInt(req.query.limit) : 50
        const offset = req.query.offset ? parseInt(req.query.offset) : 0

        const users = await User.find({ role })
            .select('_id name email studentId school isActive')
            .skip(offset)
            .limit(limit)
            .lean()

        res.status(200).json({ success: true, data: users })
    } catch (err) {
        console.error('Error fetching users by role:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch users by role', details: err.message })
    }
}

const getUserByEmail = async (req, res) => {
    try {
        const { email } = req.params

        const user = await User.findOne({ email })
            .select('_id name email role studentId school isActive')
            .lean()

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' })
        }

        res.status(200).json({ success: true, data: user })
    } catch (err) {
        console.error('Error fetching user by email:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch user', details: err.message })
    }
}

const createUser = async (req, res) => {
    try {
        const { name, email, password, role, organization, isActive } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'Missing required fields' })
        }

        const newUser = new User({
            name,
            email,
            password,
            role: role || 'Organization',
            organization: organization || null,
            isActive: isActive !== undefined ? isActive : true
        })

        const savedUser = await newUser.save()
        res.status(201).json({ success: true, id: savedUser._id })
    } catch (err) {
        console.error('Error creating user:', err)
        res.status(500).json({ success: false, error: 'Failed to create user', details: err.message })
    }
}

const updateUser = async (req, res) => {
    try {
        const { id } = req.params
        const updateData = req.body

        updateData.updatedAt = new Date()

        const result = await User.findByIdAndUpdate(id, updateData, { new: true })

        if (!result) {
            return res.status(404).json({ success: false, error: 'User not found' })
        }

        res.status(200).json({ success: true })
    } catch (err) {
        console.error('Error updating user:', err)
        res.status(500).json({ success: false, error: 'Failed to update user', details: err.message })
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params

        const result = await User.findByIdAndDelete(id)

        if (!result) {
            return res.status(404).json({ success: false, error: 'User not found' })
        }

        res.status(200).json({ success: true })
    } catch (err) {
        console.error('Error deleting user:', err)
        res.status(500).json({ success: false, error: 'Failed to delete user', details: err.message })
    }
}

//  for login purposes
const findUserByEmail = async (email) => {
    try {
        const user = await User.findOne({ email }).lean()
        return user
    } catch (err) {
        console.error('Error finding user by email:', err)
        return null
    }
}

module.exports = { getAllUsers, getUserById, getUserByRole, getUserByEmail, createUser, updateUser, deleteUser, findUserByEmail }