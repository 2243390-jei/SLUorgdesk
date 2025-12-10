require('dotenv').config()
const mongoose = require('mongoose')

const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI || "mongodb+srv://root:root123360@software-engineering.vw1nyls.mongodb.net/Web-Tech?retryWrites=true&w=majority&appName=Software-Engineering"
  try {
    await mongoose.connect(mongoUri)
    console.log('MongoDB connected')
  } catch (err) {
    console.error('MongoDB connection error:', err)
    throw err
  }
}

module.exports = { connectDB }
