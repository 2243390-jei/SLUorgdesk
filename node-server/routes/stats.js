const express = require('express');
const router = express.Router();
const Organization = require('../models/Organization');
const User = require('../models/User');
const Submission = require('../models/Submission');
const authMiddleware = require('../middleware/AuthMiddleware');

function normalizeLabel(v) {
  if (v === null || typeof v === 'undefined') return 'Unassigned';
  const s = String(v).trim();
  if (!s || ['unknown','null','undefined'].includes(s.toLowerCase())) return 'Unassigned';
  return s;
}

// pick first existing field from candidates
function pick(obj, candidates = []) {
  for (const k of candidates) {
    if (!k) continue;
    // direct prop
    if (Object.prototype.hasOwnProperty.call(obj, k) && obj[k] !== undefined && obj[k] !== null) return obj[k];
    // nested prop path
    const parts = k.split('.');
    if (parts.length > 1) {
      let cur = obj;
      let ok = true;
      for (const p of parts) {
        if (cur && Object.prototype.hasOwnProperty.call(cur, p)) cur = cur[p];
        else { ok = false; break; }
      }
      if (ok && cur !== undefined && cur !== null) return cur;
    }
  }
  return null;
}

// Dashboard aggregate counts; only the admin and OSAS dashboards read this, and
// both are behind a login, so it must not be world-readable.
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Organizations grouped by school (unchanged)
    const orgAgg = await Organization.aggregate([
      { $group: { _id: { $ifNull: ['$school', 'Unassigned'] }, count: { $sum: 1 } } },
      { $project: { school: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1, school: 1 } }
    ]);
    const orgLabels = orgAgg.map(r => normalizeLabel(r.school));
    const orgData = orgAgg.map(r => (r.count || 0));

    // Users grouped by role (unchanged)
    const rolesAgg = await User.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $ne: [{ $ifNull: ['$role', null] }, null] },
              '$role',
              {
                $cond: [
                  { $eq: [{ $ifNull: ['$isWhitelisted', false] }, true] },
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
    const roleLabels = rolesAgg.map(r => normalizeLabel(r.role));
    const roleData = rolesAgg.map(r => (r.count || 0));

    // Recent activities: robust logic without assuming populate fields exist
    const recentQuery = Submission.find().sort({ createdAt: -1 }).limit(10);

    // Only populate if schema has the path defined as a ref
    const submissionPaths = (Submission.schema && Submission.schema.paths) ? Submission.schema.paths : {};
    if (submissionPaths.user && submissionPaths.user.options && submissionPaths.user.options.ref) {
      recentQuery.populate({ path: 'user', select: 'name email', strictPopulate: false });
    }
    if (submissionPaths.organization && submissionPaths.organization.options && submissionPaths.organization.options.ref) {
      recentQuery.populate({ path: 'organization', select: 'name acronym', strictPopulate: false });
    }

    const recentSubs = await recentQuery.lean();

    const recentActivities = (recentSubs || []).map(s => {
      // Try multiple candidate fields for user and organization (covers different schemas)
      const userVal = pick(s, [
        'user', 'user.name', 'user.email', 'userId', 'createdBy', 'author', 'submitter', 'submittedBy', 'userName', 'submitted_by'
      ]);
      const orgVal = pick(s, [
        'organization', 'organization.name', 'organization.acronym', 'org', 'orgId', 'organizationId', 'organizationName', 'orgName', 'org_affil'
      ]);

      const user = (typeof userVal === 'object' && userVal !== null)
        ? (userVal.name || userVal.email || String(userVal._id || 'Unknown'))
        : (userVal || 'Unknown');

      const organization = (typeof orgVal === 'object' && orgVal !== null)
        ? (orgVal.name || orgVal.acronym || String(orgVal._id || 'Unassigned'))
        : (orgVal || 'Unassigned');

      // Title/description detection
      const title = pick(s, ['title', 'name', 'action', 'type', 'description', 'summary']) || 'Activity';

      // createdAt fallback
      const createdAt = s.createdAt ? new Date(s.createdAt).toISOString() : (s.date ? new Date(s.date).toISOString() : null);

      return {
        id: s._id,
        title: String(title),
        user,
        organization,
        createdAt
      };
    });

    // send response (debug logging removed)
    return res.json({
      success: true,
      data: {
        organizations: { labels: orgLabels, data: orgData },
        roles: { labels: roleLabels, data: roleData },
        recentActivities
      },
      // compatibility top-level fields for legacy frontends
      organizations: { labels: orgLabels, data: orgData },
      roles: { labels: roleLabels, data: roleData },
      recentActivities
    });
  } catch (err) {
    console.error('Stats route error:', err);
    return res.status(500).json({ success: false, error: err.message || 'Server error' });
  }
});

module.exports = router;