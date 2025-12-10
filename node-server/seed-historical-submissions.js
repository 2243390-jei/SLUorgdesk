const mongoose = require('mongoose')
const Submission = require('./models/Submission')
require('dotenv').config()

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sluorgdesk')
  .then(async () => {
    console.log('MongoDB connected for seeding')
    
    try {
      // Delete existing submissions to start fresh
      await Submission.deleteMany({})
      console.log('Cleared existing submissions')

      const submissions = []
      const today = new Date()
      
      // Create submissions for the last 60 days with varying amounts
      for (let i = 60; i > 0; i--) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        date.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
        
        // Random number of submissions per day (1-5)
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

      // Insert all submissions
      await Submission.insertMany(submissions)
      console.log(`Created ${submissions.length} submissions across 60 days`)
      
      // Show summary
      const grouped = {}
      submissions.forEach(sub => {
        const key = new Date(sub.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        grouped[key] = (grouped[key] || 0) + 1
      })
      
      console.log('\nSubmissions by day:')
      Object.entries(grouped).slice(0, 10).forEach(([day, count]) => {
        console.log(`  ${day}: ${count} submissions`)
      })
      
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
