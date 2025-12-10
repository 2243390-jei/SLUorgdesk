const mongoose = require('mongoose')
const Submission = require('./models/Submission')
require('./config/database').connectDB()

async function seedSubmissions() {
    try {
        const now = new Date()
        const submissions = []
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(now)
            date.setDate(date.getDate() - i)
            
            const count = Math.floor(Math.random() * 3) + 1
            for (let j = 0; j < count; j++) {
                submissions.push({
                    applicationInfo: { test: true },
                    orgInfo: { test: true },
                    academicYear: '2024-2025',
                    semester: 'First',
                    events: [],
                    status: 'pending',
                    submittedAt: date
                })
            }
        }
        
        await Submission.insertMany(submissions)
        console.log(`Inserted ${submissions.length} test submissions`)
        process.exit(0)
    } catch (err) {
        console.error('Error seeding submissions:', err)
        process.exit(1)
    }
}

seedSubmissions()
