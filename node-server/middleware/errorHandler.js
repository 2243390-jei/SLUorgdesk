const notFound = (req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' })
}

const errorHandler = (err, req, res, next) => {
    res.status(500).json({ success: false, error: 'Internal server error' })
}

module.exports = { notFound, errorHandler }
