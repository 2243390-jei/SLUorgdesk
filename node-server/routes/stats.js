const express = require('express')
const router = express.Router()
const User = require('../models/User')
const Organization = require('../models/Organization')
const Submission = require('../models/Submission')

/**
 * GET /api/stats
 * Fetch aggregated stats for dashboard:
 * - Users by role (count)
 * - Recent activities (submissions per day, last 7 days)
 * - Organizations by school (count)
 */
router.get('/', async (req, res) => {
    try {
        // Fetch all users
        const users = await User.find({}, 'role isActive createdAt school lastLogin').lean()

        // Initialize aggregates
        const roleCount = {}
        const dayActivities = {}
        const now = new Date()

        // Fetch all submissions
        const submissions = await Submission.find(
            { submittedAt: { $exists: true } },
            'submittedAt'
        ).lean()

        // Build day activities from all submissions
        const dayMap = {}
        submissions.forEach(sub => {
            if (sub.submittedAt) {
                const subDate = new Date(sub.submittedAt)
                subDate.setHours(0, 0, 0, 0)
                const key = subDate.getTime()
                dayMap[key] = (dayMap[key] || 0) + 1
                dayActivities[key] = (dayActivities[key] || 0) + 1
            }
        })

        // Get sorted unique days from submissions
        const days = Object.keys(dayMap)
            .map(key => new Date(parseInt(key)))
            .sort((a, b) => a.getTime() - b.getTime())

        // Generate labels for all days
        const dayLabels = days.map(d => 
            d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        )

        // Get activity data for all days
        const activityData = days.map(d => dayActivities[d.getTime()] || 0)

        // Count by role from users
        users.forEach(user => {
            const role = user.role || 'Unknown'
            roleCount[role] = (roleCount[role] || 0) + 1
        })

        // Convert role counts to arrays
        const roleLabels = Object.keys(roleCount)
        const roleData = Object.values(roleCount)

        // Fetch organizations with user counts
        const organizations = await Organization.find({}, 'name acronym school').lean()
        const orgCount = organizations.length
        
        // Count organizations per school
        const schoolOrgCount = {}
        organizations.forEach(org => {
            const school = org.school || 'Unspecified'
            schoolOrgCount[school] = (schoolOrgCount[school] || 0) + 1
        })

        // Sort by count descending and prepare labels/data
        const schoolList = Object.entries(schoolOrgCount)
            .map(([school, count]) => ({ name: school, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)

        const schoolNames = schoolList.map(s => s.name)
        const schoolData = schoolList.map(s => s.count)

        res.status(200).json({
            success: true,
            data: {
                roles: {
                    labels: roleLabels,
                    data: roleData
                },
                recentActivities: {
                    labels: dayLabels,
                    data: activityData
                },
                organizations: {
                    labels: schoolNames,
                    data: schoolData
                },
                organizationCount: orgCount,
                totalUsers: users.length
            }
        })
    } catch (err) {
        console.error('Error fetching stats:', err)
        res.status(500).json({ success: false, error: 'Failed to fetch stats', details: err.message })
    }
})

module.exports = router
