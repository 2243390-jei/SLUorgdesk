require('./env')
const mongoose = require('mongoose')

const connectDB = async (uri) => {
  // No hardcoded fallback: the credentials live in the environment (Secret
  // Manager on Cloud Run) or in node-server/.env for local development.
  const mongoUri = uri || process.env.MONGO_URI

  if (!mongoUri) {
    throw new Error(
      'MONGO_URI is not configured. Set it in the environment or in node-server/.env'
    )
  }

  try {
    await mongoose.connect(mongoUri)
    console.log(`MongoDB connected (db: ${mongoose.connection.name})`)
  } catch (err) {
    console.error('MongoDB connection error:', err)
    throw err
  }
}

module.exports = { connectDB }
