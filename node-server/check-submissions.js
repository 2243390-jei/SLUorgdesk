const mongoose = require('mongoose')
const Submission = require('./models/Submission')
require('dotenv').config()

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sluorgdesk'

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected')
    
    try {
      const count = await Submission.countDocuments()
      console.log(`Total submissions: ${count}`)
      
      const subs = await Submission.find({}, 'submittedAt').lean().limit(5)
      console.log('Sample submissions:')
      subs.forEach(sub => console.log(`  ${sub._id}: ${sub.submittedAt}`))
      
      const oldest = await Submission.findOne({}, 'submittedAt').sort({ submittedAt: 1 }).lean()
      const newest = await Submission.findOne({}, 'submittedAt').sort({ submittedAt: -1 }).lean()
      
      if (oldest) console.log(`Oldest: ${oldest.submittedAt}`)
      if (newest) console.log(`Newest: ${newest.submittedAt}`)
      
      process.exit(0)
    } catch (err) {
      console.error('Error:', err)
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
