require('dotenv').config()

const jwt = require('jsonwebtoken')

const jwtKey = process.env.JWT_SECRET

const tokenCheck = (req, res, next) => {
  let token = req.headers.authorization

  if (token) {
    try {
      token = token.split(' ')[1]
    } catch (err) {

      return res.status(401).json({ message: 'failed authentication' })
    }

    jwt.verify(token, jwtKey, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: 'failed authentication' })
      } else {
        const userId = decodedToken.userId

        req.userId = userId
        next()
      }
    })
  } else {
    return res.status(401).json({ message: 'failed authentication' })
  }
}

module.exports = tokenCheck
