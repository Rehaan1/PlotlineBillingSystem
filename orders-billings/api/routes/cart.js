require('dotenv').config()
const path = require('path')
const fs = require('fs')

const express = require('express')
const router = express.Router()
const format = require('pg-format')
const { dbUserPool } = require('../db/db')
const tokenCheck = require('../middlewares/tokenCheck')
const { uuid } = require('uuidv4')
const { createInvoice } = require("../services/createInvoice")
const uploadImage = require('../services/uploadHelper')

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
                        cart.quantity,
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
                                    'UPDATE items SET quantity = quantity - %L WHERE item_id = %L;',
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
                                                            "INSERT INTO bill (item_rel_id, total_value) VALUES (%L::uuid, %L) RETURNING *",
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

                                                                                // Generate Invoice

                                                                                const query = format(
                                                                                    `SELECT
                                                                                        io.item_id,
                                                                                        io.quantity,
                                                                                        i.name,
                                                                                        i.price,
                                                                                        i.item_type,
                                                                                        CASE
                                                                                            WHEN i.item_type = 'product' THEN pt.pa
                                                                                            WHEN i.item_type = 'service' THEN st.sa
                                                                                        END AS tax_a,
                                                                                        CASE
                                                                                            WHEN i.item_type = 'product' THEN pt.pb
                                                                                            WHEN i.item_type = 'service' THEN st.sb
                                                                                        END AS tax_b,
                                                                                        CASE
                                                                                            WHEN i.item_type = 'product' THEN pt.pc
                                                                                            WHEN i.item_type = 'service' THEN st.sc
                                                                                        END AS tax_c,
                                                                                        (i.price * io.quantity) + (io.quantity * (CASE
                                                                                            WHEN i.item_type = 'product' THEN pt.pa + pt.pb + pt.pc
                                                                                            WHEN i.item_type = 'service' THEN st.sa + st.sb + st.sc
                                                                                            ELSE 0
                                                                                        END)) AS total_item_value,
                                                                                        b.total_value AS total_order_value
                                                                                    FROM
                                                                                        item_order_rel io
                                                                                    JOIN
                                                                                        items i ON io.item_id = i.item_id
                                                                                    LEFT JOIN
                                                                                        product_tax pt ON i.item_type = 'product' AND pt.item_id = i.item_id
                                                                                    LEFT JOIN
                                                                                        service_tax st ON i.item_type = 'service' AND st.item_id = i.item_id
                                                                                    LEFT JOIN
                                                                                        bill b ON io.item_rel_id = b.item_rel_id
                                                                                    WHERE
                                                                                        b.bill_id = %L;
                                                                                    `,
                                                                                    billId
                                                                                )

                                                                                client.query(query)
                                                                                    .then( async (result) => {
                                                                                        
                                                                                        const ordersData = result.rows

                                                                                        const totalVal = parseFloat(ordersData[0].total_order_value)
                                                                                        const invoice_number = orderId

                                                                                        const invoice = {
                                                                                            items: ordersData,
                                                                                            subtotal: totalVal,
                                                                                            invoice_nr: invoice_number
                                                                                        }
                                                                                        
                                                                                        const invoiceFileName = invoice_number+".pdf"
                                                                                        const outputPath = path.join(__dirname, '..', '..', 'invoices', invoiceFileName)


                                                                                        if(await createInvoice(invoice, outputPath))
                                                                                        {
                                                                                            const imageUrl = await uploadImage(outputPath, invoiceFileName)

                                                                                            const query = format(
                                                                                                "INSERT INTO invoices (bill_id, invoice_link) VALUES (%L::uuid, %L) RETURNING *",
                                                                                                billId,
                                                                                                imageUrl
                                                                                            )

                                                                                            client.query(query)
                                                                                                .then(result => {

                                                                                                    // Delete file from server
                                                                                                    try 
                                                                                                    {
                                                                                                        fs.unlinkSync(outputPath);
                                                                                                        console.log(`File ${outputPath} has been deleted synchronously.`);
                                                                                                    } 
                                                                                                    catch (err) 
                                                                                                    {
                                                                                                        console.error(`Error deleting ${outputPath}:`, err);
                                                                                                    }

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
                                                                                                                data: result.rowCount,
                                                                                                                orderId: orderId,
                                                                                                                billId: billId,
                                                                                                                invoice_link: imageUrl
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
                                                                                        }
                                                                                        else
                                                                                        {
                                                                                            return res.status(404).json({
                                                                                                message: "Order Placed Failed"
                                                                                            })
                                                                                        }
                                                                                        
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