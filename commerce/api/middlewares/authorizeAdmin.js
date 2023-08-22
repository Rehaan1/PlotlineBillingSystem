

const authorizeAdmin = (req, res, next) => {
    if (req.role === 'admin') {
      next();
    } else {
      return res.status(403).json({
        "message":"Access Denie. Need Proper Authorization"
      });
    }
  }

module.exports = authorizeAdmin