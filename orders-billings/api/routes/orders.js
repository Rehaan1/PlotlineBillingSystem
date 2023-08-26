require('dotenv').config()

const express = require('express')
const router = express.Router()
const format = require('pg-format')
const { dbUserPool } = require('../db/db')
const tokenCheck = require('../middlewares/tokenCheck')
const authorizeAdmin = require('../middlewares/authorizeAdmin')


router.get('/', tokenCheck, (req,res) => {

    const userId = req.userId

    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {
                
                const query = format(
                    `SELECT ou.order_user_rel_id,
                    ou.order_id,
                    ou.user_id,
                    o.bill_id
                    FROM order_user_rel ou
                    JOIN orders o ON ou.order_id = o.order_id
                    WHERE ou.user_id = %L;`,
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
})



router.post('/order', tokenCheck, (req,res) => {

    if (!req.body.orderId) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const orderId = req.body.orderId
    const userId = req.userId

    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {
                
                const query = format(
                    `SELECT * FROM order_user_rel WHERE order_id = %L AND user_id = %L`,
                    orderId,
                    userId
                )

                client.query(query)
                    .then(result => {


                        if(result.rowCount === 0)
                        {
                            return res.status(200).json({
                                message: "No order match for user"
                            })
                        }

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
                                orders o
                            JOIN
                                item_order_rel io ON o.item_rel_id = io.item_rel_id
                            JOIN
                                items i ON io.item_id = i.item_id
                            LEFT JOIN
                                product_tax pt ON i.item_type = 'product' AND pt.item_id = i.item_id
                            LEFT JOIN
                                service_tax st ON i.item_type = 'service' AND st.item_id = i.item_id
                            LEFT JOIN
                                bill b ON o.bill_id = b.bill_id
                            WHERE
                                o.order_id = %L
                            `,
                            orderId
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


router.post('/bill', tokenCheck, (req,res) => {

    if (!req.body.billId) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const billId = req.body.billId

    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {
                
                const query = format(
                    `SELECT
                    io.quantity,
                    i.name,
                    inv.invoice_link
                    FROM
                        item_order_rel io
                    JOIN
                        items i ON io.item_id = i.item_id
                    LEFT JOIN
                        bill b ON io.item_rel_id = b.item_rel_id
                    LEFT JOIN
                        invoices inv ON b.bill_id = inv.bill_id
                    WHERE
                        b.bill_id = %L;
                    `,
                    billId
                )

                client.query(query)
                    .then(result => {
                        client.query("COMMIT")
                        client.release()

                        return res.status(200).json({
                            message: "Bill Fetched Successfully",
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


router.get('/admin-get-orders', tokenCheck, authorizeAdmin, (req,res) => {

    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {
                
                const query = format(
                    `SELECT ou.order_user_rel_id,
                    ou.order_id,
                    ou.user_id,
                    o.bill_id
                    FROM order_user_rel ou
                    JOIN orders o ON ou.order_id = o.order_id`
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
})


router.post('/admin-order-details', tokenCheck, authorizeAdmin, (req,res) => {

    if (!req.body.orderId) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const orderId = req.body.orderId

    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {
                
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
                        orders o
                    JOIN
                        item_order_rel io ON o.item_rel_id = io.item_rel_id
                    JOIN
                        items i ON io.item_id = i.item_id
                    LEFT JOIN
                        product_tax pt ON i.item_type = 'product' AND pt.item_id = i.item_id
                    LEFT JOIN
                        service_tax st ON i.item_type = 'service' AND st.item_id = i.item_id
                    LEFT JOIN
                        bill b ON o.bill_id = b.bill_id
                    WHERE
                        o.order_id = %L
                    `,
                    orderId
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
})


module.exports = router