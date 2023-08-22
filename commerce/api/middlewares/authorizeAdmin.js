

const authorizeAdmin = (req, res, next) => {
    if (req.user.role === 'admin') {
      next();
    } else {
      return res.status(403).send('Access denied');
    }
  }

module.exports = authorizeAdmin