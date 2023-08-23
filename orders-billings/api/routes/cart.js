require('dotenv').config()

const express = require('express')
const router = express.Router()
const format = require('pg-format')
const { dbUserPool } = require('../db/db')
const tokenCheck = require('../middlewares/tokenCheck')


router.post('/add',tokenCheck, (req,res) => {

    if (!req.body.itemId) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    if (!req.body.quantity) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const itemId = req.body.itemId
    const quantity = req.body.quantity

    const userId = req.userId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    const query = format(
                        "SELECT * FROM cart WHERE item_id = %L AND user_id = %L",
                        itemId,
                        userId
                    )

                    client.query(query)
                        .then(result => {
                            
                            if(result.rowCount > 0)
                            {
                                return res.status(200).json({
                                    message: "Item already in cart. Please update quantity in cart if required"
                                })
                            }

                            const query = format(
                                "INSERT INTO cart (user_id, item_id, quantity) SELECT %L, %L, %L FROM items WHERE item_id = %L AND %L <= items.quantity",
                                userId,
                                itemId,
                                quantity,
                                itemId,
                                quantity
                            )

                            client.query(query)
                                .then( result => {

                                    client.query("COMMIT")
                                    client.release()

                                    return res.status(200).json({
                                        message: "Data Inserted Successfully"
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
    
})


router.get('/',tokenCheck, (req, res) => {

    const userId = req.userId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    const query = format(
                        "SELECT * FROM cart WHERE user_id = %L",
                        userId
                    )

                    client.query(query)
                        .then(result => {
                            
                            client.query("COMMIT")
                            client.release()
                           
                            return res.status(200).json({
                                message: "User cart fetched successfully",
                                data: result.rows[0] 
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
})


module.exports = router