module.exports = (req, res, next) => {
  // Check if session exists and user is authenticated
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized. Please log in.' 
    });
  }
  next();
};