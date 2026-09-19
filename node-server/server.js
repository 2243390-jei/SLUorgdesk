const http = require('http')

// Load .env before anything reads process.env.
require('./config/env')

// Parse command-line arguments for host configuration FIRST (before loading app)
let HOST = '0.0.0.0'
const args = process.argv.slice(2)
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--host' || args[i] === '-h') && args[i + 1]) {
    HOST = args[i + 1]
    process.env.SERVER_HOST = HOST
    break
  }
}

// Now load app AFTER environment is set
const app = require('./app')

// Get port from environment or default to 5000
const PORT = process.env.PORT || 5000

// Create HTTP server
const server = http.createServer(app)

// Start server on specified host and port
server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`)
  console.log(`Listening on ${HOST}:${PORT}`)
})

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`)
  } else {
    console.error('Server error:', err)
  }
  process.exit(1)
})

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    process.exit(0)
  })
})