require('dotenv').config()

const express = require('express')
const router = express.Router()
const format = require('pg-format')
const { dbUserPool } = require('../db/db')
const tokenCheck = require('../middlewares/tokenCheck')
const { uuid } = require('uuidv4');

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

    if (!req.body.type) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const itemId = req.body.itemId
    const quantity = req.body.quantity
    const itemType = req.body.type

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
                                "INSERT INTO cart (user_id, item_id, item_type, quantity) SELECT %L::uuid, %L::uuid, %L, %L FROM items WHERE item_id = %L::uuid AND %L <= items.quantity",
                                userId,
                                itemId,
                                itemType,
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
                        "SELECT cart.*, items.name FROM cart JOIN items ON cart.item_id = items.item_id WHERE cart.user_id = %L;",
                        userId
                    )

                    client.query(query)
                        .then(result => {
                            
                            client.query("COMMIT")
                            client.release()
                           
                            return res.status(200).json({
                                message: "User cart fetched successfully",
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
})



router.get('/cartValue',tokenCheck, (req, res) => {

    const userId = req.userId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    const query = format(
                        `SELECT
                        cart.item_id,
                        cart.user_id,
                        cart.cart_item_id,
                        items.name,
                        items.quantity,
                        items.image,
                        items.price,
                        CASE
                            WHEN items.item_type = 'product' THEN
                                (product_tax.pa + product_tax.pb + product_tax.pc) * cart.quantity
                            WHEN items.item_type = 'service' THEN
                                (service_tax.sa + service_tax.sb + service_tax.sc) * cart.quantity
                        END AS total_tax,
                        (items.price * cart.quantity) AS total_price_before_tax,
                        CASE
                            WHEN items.item_type = 'product' THEN
                                (items.price * cart.quantity) + (product_tax.pa + product_tax.pb + product_tax.pc) * cart.quantity
                            WHEN items.item_type = 'service' THEN
                                (items.price * cart.quantity) + (service_tax.sa + service_tax.sb + service_tax.sc) * cart.quantity
                        END AS total_price_after_tax
                        FROM
                            cart
                        JOIN
                            items ON cart.item_id = items.item_id
                        LEFT JOIN
                            product_tax ON items.item_id = product_tax.item_id
                        LEFT JOIN
                            service_tax ON items.item_id = service_tax.item_id
                        WHERE
                            cart.user_id = %L;
                        `,
                        userId
                    )

                    client.query(query)
                        .then(result => {
                            
                            client.query("COMMIT")
                            client.release()
                           
                            return res.status(200).json({
                                message: "User cart value fetched successfully",
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
})


router.delete('/removeItem',tokenCheck, (req, res) => {

    if (!req.body.cartItemId) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const cartItemId = req.body.cartItemId

    const userId = req.userId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    const query = format(
                        "DELETE FROM cart WHERE cart_item_id = %L AND user_id = %L RETURNING *",
                        cartItemId,
                        userId
                    )

                    client.query(query)
                        .then(result => {
                           
                            client.query("COMMIT")
                            client.release()
                            if (result.rowCount === 0) {
                                
                                return res.status(404).json({
                                    message: "Item Not Found or User Unauthorized"
                                })
                            }

                            return res.status(200).json({
                                message: "Item Deleted Successfully",
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


router.delete('/clear',tokenCheck, (req, res) => {

    const userId = req.userId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    const query = format(
                        "DELETE FROM cart WHERE user_id = %L RETURNING *",
                        userId
                    )

                    client.query(query)
                        .then(result => {
                           
                            client.query("COMMIT")
                            client.release()
                            if (result.rowCount === 0) {
                                
                                return res.status(404).json({
                                    message: "Cart not cleared or User Unauthorized"
                                })
                            }

                            return res.status(200).json({
                                message: "Cart cleared Successfully",
                                data: result.rowCount 
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


router.get('/placeOrder',tokenCheck, (req, res) => {

    const userId = req.userId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    // Get all the item_ids and quantity from cart for user where items in stock
                    const query = format(
                        `SELECT cart.item_id AS item_id, cart.quantity AS quantity
                        FROM cart
                        JOIN items ON cart.item_id = items.item_id
                        WHERE cart.user_id = %L AND items.quantity >= cart.quantity`,
                        userId
                    )

                    client.query(query)
                        .then(result => {

                            if (result.rowCount === 0) {
                                
                                return res.status(404).json({
                                    message: "Nothing in cart to place order or all items are out of stock"
                                })
                            }

                            // generate a relational id for those cart items
                            const item_rel_id = uuid()

                            const itemOrderData = result.rows.map(row => ({
                                item_rel_id: item_rel_id,
                                item_id: row.item_id,
                                quantity: row.quantity
                            }))

                            
                            // update available quantity of items
                            const updateQueries = result.rows.map(row => {
                                const item_id = row.item_id
                                const quantity = row.quantity
                                return format(
                                    'UPDATE items SET quantity = quantity - %L WHERE item_id = %L',
                                    quantity,
                                    item_id
                                )
                            })

                            const fullQuery = updateQueries.join('\n')

                            client.query(fullQuery)
                                .then(result => {
                                        
                                        // insert into item_rel_id and item_id relation table
                                        const insertQuery = format(
                                            "INSERT INTO item_order_rel (item_rel_id, item_id, quantity) VALUES %L",
                                            itemOrderData.map(data => [data.item_rel_id, data.item_id, data.quantity])
                                        )

                                        client.query(insertQuery)
                                            .then(result => {

                                                // calculate total order value
                                                const query = format(
                                                    `SELECT
                                                    SUM(
                                                        CASE
                                                            WHEN items.item_type = 'product' THEN
                                                                (items.price * cart.quantity) + (product_tax.pa + product_tax.pb + product_tax.pc) * cart.quantity
                                                            WHEN items.item_type = 'service' THEN
                                                                (items.price * cart.quantity) + (service_tax.sa + service_tax.sb + service_tax.sc) * cart.quantity
                                                        END 
                                                    ) AS total_order_val
                                                    FROM
                                                        cart
                                                    JOIN
                                                        items ON cart.item_id = items.item_id
                                                    LEFT JOIN
                                                        product_tax ON items.item_id = product_tax.item_id
                                                    LEFT JOIN
                                                        service_tax ON items.item_id = service_tax.item_id
                                                    WHERE
                                                        cart.user_id = %L;
                                                    `,
                                                    userId
                                                )

                                                client.query(query)
                                                    .then(result => {

                                                        const totalVal = result.rows[0].total_order_val

                                                        // create a bill id with total value
                                                        const insertQuery = format(
                                                            "INSERT INTO bill (item_rel_id, total_val) VALUES (%L::uuid, %L) RETURNING *",
                                                            item_rel_id,
                                                            totalVal
                                                        )

                                                        client.query(insertQuery)
                                                            .then(result => {

                                                                const billId = result.rows[0].bill_id
                                                                
                                                                // create order in orders table
                                                                const orderQuery = format(
                                                                    "INSERT INTO orders (item_rel_id, bill_id) VALUES (%L::uuid, %L::uuid) RETURNING *",
                                                                    item_rel_id,
                                                                    billId
                                                                )

                                                                client.query(orderQuery)
                                                                    .then(result => {

                                                                        const orderId = result.rows[0].order_id
                                                                        
                                                                        // create order user realation entry
                                                                        const query = format(
                                                                            "INSERT INTO order_user_rel (order_id, user_id) VALUES (%L::uuid, %L::uuid) RETURNING *",
                                                                            orderId,
                                                                            userId
                                                                        )

                                                                        client.query(query)
                                                                            .then(result => {

                                                                                // once order successfully placed clear cart
                                                                                
                                                                                const query = format(
                                                                                    "DELETE FROM cart WHERE user_id = %L RETURNING *",
                                                                                    userId
                                                                                )

                                                                                client.query(query)
                                                                                    .then(result => {

                                                                                        client.query("COMMIT")
                                                                                        client.release()
                                                                                        if (result.rowCount === 0) {
                                                                                            
                                                                                            return res.status(404).json({
                                                                                                message: "Order Placed Failed"
                                                                                            })
                                                                                        }

                                                                                        return res.status(200).json({
                                                                                            message: "Ordered Placed Successfully",
                                                                                            data: result.rowCount 
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


module.exports = router