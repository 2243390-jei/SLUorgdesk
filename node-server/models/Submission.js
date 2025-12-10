const mongoose = require('mongoose')

const submissionSchema = new mongoose.Schema({
  applicationInfo: {},
  orgInfo: {},
  academicYear: String,
  semester: String,
  events: [{}],
  status: { type: String, default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Submission', submissionSchema, 'Submissions')
