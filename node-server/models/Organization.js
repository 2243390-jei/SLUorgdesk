const mongoose = require('mongoose')

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  acronym: { type: String, required: true },
  school: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isWhitelisted: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  localLogoPath: String
})

module.exports = mongoose.model('Organizations', organizationSchema)