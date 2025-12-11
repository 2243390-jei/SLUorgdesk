//Validation
const validateUser = (req, res, next) => {
  const { name, email, password, role } = req.body

  // For POST requests, all fields are required
  if (req.method === 'POST') {
    const errors = []
    
    if (!name || name.trim() === '') {
      errors.push('Name is required')
    }
    if (!email || email.trim() === '') {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format')
    }
    if (!password || password.trim() === '') {
      errors.push('Password is required')
    }
    if (!role || !['Admin', 'OSAS', 'Organization'].includes(role)) {
      errors.push('Role must be Admin, OSAS, or Organization')
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed', 
        details: errors 
      })
    }
  }

  // For PATCH requests, validate provided fields
  if (req.method === 'PATCH') {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      })
    }
    if (role && !['Admin', 'OSAS', 'Organization'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Role must be Admin, OSAS, or Organization'
      })
    }
  }

  next()
}

/**
 * Validate organization creation/update
 */
const validateOrganization = (req, res, next) => {
  const { name, acronym, school, email } = req.body

  // For POST requests
  if (req.method === 'POST') {
    const errors = []

    if (!name || name.trim() === '') {
      errors.push('Name is required')
    }
    if (!acronym || acronym.trim() === '') {
      errors.push('Acronym is required')
    }
    if (!school || school.trim() === '') {
      errors.push('School is required')
    }
    if (!email || email.trim() === '') {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format')
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      })
    }
  }

  // For PATCH requests
  if (req.method === 'PATCH') {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      })
    }
  }

  next()
}

module.exports = { validateUser, validateOrganization }
