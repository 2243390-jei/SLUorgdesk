const mongoose = require('mongoose')
const Submission = require('./models/Submission')
require('dotenv').config()

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/sluorgdesk'

mongoose.connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected for seeding')
    
    try {
      await Submission.deleteMany({})
      console.log('Cleared existing submissions')

      const submissions = []
      const today = new Date()
      
      for (let i = 60; i > 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
        const count = Math.floor(Math.random() * 5) + 1
        
        for (let j = 0; j < count; j++) {
          submissions.push({
            applicationInfo: { name: `Test ${Math.random()}` },
            orgInfo: { org: `Organization ${Math.random()}` },
            academicYear: '2024-2025',
            semester: 'Fall',
            events: [],
            status: 'pending',
            submittedAt: new Date(date.getTime() + Math.random() * 3600000),
            createdAt: new Date(date.getTime() + Math.random() * 3600000),
            updatedAt: new Date()
          })
        }
      }

      await Submission.insertMany(submissions)
      console.log(`Seeded ${submissions.length} submissions`)
      process.exit(0)
    } catch (err) {
      console.error('Seeding error:', err)
      process.exit(1)
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err)
    process.exit(1)
  })
