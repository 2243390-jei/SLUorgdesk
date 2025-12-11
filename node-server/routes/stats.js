const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');

/**
 * GET /api/stats
 * Returns:
 * {
 *   success: true,
 *   data: {
 *     organizations: { labels: [...], data: [...] },
 *     roles: { labels: [...], data: [...] }
 *   }
 * }
 */
router.get('/', async (req, res) => {
  try {
    // Organizations grouped by school
    const orgAgg = await Organization.aggregate([
      { $group: { _id: { $ifNull: ['$school', 'Unassigned'] }, count: { $sum: 1 } } },
      { $project: { school: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1, school: 1 } }
    ]);

    const orgLabels = orgAgg.map(r => (r.school || 'Unassigned'));
    const orgData = orgAgg.map(r => (r.count || 0));

    // Users grouped by role; if role is missing, map by isWhitelisted -> Organization else Student
    const rolesAgg = await User.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $ne: [{ $ifNull: ['$role', null] }, null] },
              '$role',
              {
                $cond: [
                  { $eq: ['$isWhitelisted', true] },
                  'Organization',
                  'Student'
                ]
              }
            ]
          },
          count: { $sum: 1 }
        }
      },
      { $project: { role: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1, role: 1 } }
    ]);

    const roleLabels = rolesAgg.map(r => (r.role || 'Unassigned'));
    const roleData = rolesAgg.map(r => (r.count || 0));

    res.json({
      success: true,
      data: {
        organizations: { labels: orgLabels, data: orgData },
        roles: { labels: roleLabels, data: roleData }
      }
    });
  } catch (err) {
    console.error('Stats route error:', err);
    res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

module.exports = router;
