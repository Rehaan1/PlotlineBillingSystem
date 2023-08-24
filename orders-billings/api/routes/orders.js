require('dotenv').config()

const express = require('express')
const router = express.Router()
const format = require('pg-format')
const { dbUserPool } = require('../db/db')
const tokenCheck = require('../middlewares/tokenCheck')


router.get('/', tokenCheck, (req,res) => {

    const userId = req.userId

    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {
                
                const query = format(
                    "SELECT * FROM order_user_rel WHERE user_id = %L",
                    userId
                )

                client.query(query)
                    .then(result => {
                        client.query("COMMIT")
                        client.release()

                        return res.status(200).json({
                            message: "Orders Fetched Successfully",
                            data: result.rows
                        })
                    })
                    .catch(err => {
                        client.query("ROLLBACK")
                        client.release()
                        console.log("Error: ", err)
                        return res.status(500).json({
                            message: "Query error",
                            error: err
                        })
                    })
            })
            .catch(err => {
                console.log("Error: ", err)
                client.release()
                return res.status(500).json({
                    message: "Database transaction error",
                    error: err
                })
            })
    })
    .catch(err => {
        console.log(err)
        return res.status(200).json({
            message: "Database Connection Error",
            error: err
        })
    })

    return res.status(200).json({
        message :"Orders Endpoint Working"
    })
})


module.exports = router