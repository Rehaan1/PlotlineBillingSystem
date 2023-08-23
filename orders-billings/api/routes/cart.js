require('dotenv').config()

const express = require('express')
const router = express.Router()
const format = require('pg-format')
const { dbUserPool } = require('../db/db')
const tokenCheck = require('../middlewares/tokenCheck')


router.get('/',tokenCheck, (req, res) => {

    return res.status(200).json({
        message: "Cart Endpoint Up"
    })
})


module.exports = router