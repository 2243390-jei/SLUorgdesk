const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Submission = require('../models/Submission');
const Organization = require('../models/Organization');

// Helper to parse period query param like '7d', '30d', 'all'
function parsePeriod(period) {
    if (!period || period === 'all') return null;
    const m = period.match(/^(\d+)\s*d$/);
    if (m) return parseInt(m[1], 10);
    return null;
}

router.get('/', async (req, res) => {
    try {
        const periodParam = req.query.period || '7d';
        const days = parsePeriod(periodParam);
        const now = new Date();
        const startDate = days ? new Date(now.getTime() - days * 24*60*60*1000) : null;

        // Roles: count users by role
        const roleAgg = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const roles = {
            labels: roleAgg.map(r => r._id || 'Unknown'),
            data: roleAgg.map(r => r.count)
        };

        // Recent activities: using Submission.createdAt (fallback to User.createdAt if needed)
        // produce one data point per day in the requested range (or last 7 days default)
        let recentLabels = [];
        let recentData = [];

        if (days) {
            // Create array of day labels (YYYY-MM-DD) from startDate -> now
            for (let i = days - 1; i >= 0; i--) {
                const day = new Date(now.getTime() - i * 24*60*60*1000);
                recentLabels.push(day.toISOString().slice(0,10));
            }

            // Aggregate submissions per day
            const match = { createdAt: { $gte: startDate } };
            const subs = await Submission.aggregate([
                { $match: match },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } }
            ]);

            const map = subs.reduce((acc, cur) => { acc[cur._id] = cur.count; return acc; }, {});
            recentData = recentLabels.map(l => map[l] || 0);
        } else {
            // if 'all' requested, return totals per month or top N months - fallback simple
            const subs = await Submission.aggregate([
                { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);
            recentLabels = subs.map(s => s._id);
            recentData = subs.map(s => s.count);
        }

        // Organizations: count users per organization, join organization name
        const orgAgg = await User.aggregate([
            { $group: { _id: '$organization', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 20 },
            { $lookup: { from: 'organizations', localField: '_id', foreignField: '_id', as: 'org' } },
            { $unwind: { path: '$org', preserveNullAndEmptyArrays: true } },
            { $project: { name: { $ifNull: ['$org.name', 'Unknown'] }, count: 1 } }
        ]);

        const organizations = {
            labels: orgAgg.map(o => o.name),
            data: orgAgg.map(o => o.count)
        };

        const totalUsers = await User.countDocuments();

        res.json({
            success: true,
            data: {
                roles,
                recentActivities: { labels: recentLabels, data: recentData },
                organizations,
                organizationCount: organizations.labels.length,
                totalUsers
            }
        });
    } catch (err) {
        console.error('Error building stats', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
