require('dotenv').config()

const express = require('express')
const router = express.Router()
const format = require('pg-format')
const { dbUserPool } = require('../db/db')
const tokenCheck = require('../middlewares/tokenCheck')
const authorizeAdmin = require('../middlewares/authorizeAdmin')

router.post('/add', tokenCheck, authorizeAdmin, (req,res) => {

    if(!req.body.name)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.detail)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.price)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.quantity)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.type)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    const name = req.body.name
    const image = (!req.body.image) ? "": req.body.image
    const detail = req.body.detail
    const price = req.body.price
    const quantity = req.body.quantity
    const itemType = req.body.type


    if(itemType === "product")
    {
        let pa = 0;
        let pb = 0;
        
        if(price > 1000 && price <= 5000)
        {
            pa = price * 0.12;
        }
        else if(price > 5000)
        {
            pb = price * 0.18;
        }

        dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
            .then(()=>{

                const query = format(
                    "INSERT INTO items (name, image, detail, price, quantity, item_type) VALUES (%L, %L, %L, %L, %L, %L) RETURNING *",
                    name,
                    image,
                    detail,
                    price,
                    quantity,
                    itemType
                )

                client.query(query)
                    .then(result =>{

                        const taxQuery = format(
                            "INSERT INTO product_tax (item_id, item_type, pa, pb) VALUES (%L, %L, %L, %L) RETURNING *",
                            result.rows[0].item_id,
                            itemType,
                            pa,
                            pb
                        )

                        client.query(taxQuery)
                            .then(taxResult => {

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
                                    error:err
                                  })
                            })
                    })
                    .catch(err => {
                        client.query("ROLLBACK")
                        client.release()
                        console.log("Error: ", err)
                        
                        return res.status(500).json({
                            message: "Query error",
                            error:err
                          })
                    })

            })
            .catch(err => {
                console.log("Error: ", err)
                client.release()
                return res.status(500).json({
                    message: "Database transaction error",
                    error:err
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
    }
    else if(itemType === "service")
    {
        let sa = 0;
        let sb = 0;

        if(price > 1000 && price <= 8000)
        {
            sa = price * 0.10;
        }
        else if(price > 8000)
        {
            sb = price * 0.15;
        }

        dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
            .then(()=>{

                const query = format(
                    "INSERT INTO items (name, image, detail, price, quantity, item_type) VALUES (%L, %L, %L, %L, %L, %L) RETURNING *",
                    name,
                    image,
                    detail,
                    price,
                    quantity,
                    itemType
                )

                client.query(query)
                    .then(result =>{

                        const taxQuery = format(
                            "INSERT INTO service_tax (item_id, item_type, sa, sb) VALUES (%L, %L, %L, %L) RETURNING *",
                            result.rows[0].item_id,
                            itemType,
                            sa,
                            sb
                        )

                        client.query(taxQuery)
                            .then(taxResult => {

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
                                    error:err
                                  })
                            })
                    })
                    .catch(err => {
                        client.query("ROLLBACK")
                        client.release()
                        console.log("Error: ", err)
                        
                        return res.status(500).json({
                            message: "Query error",
                            error:err
                          })
                    })

            })
            .catch(err => {
                console.log("Error: ", err)
                client.release()
                return res.status(500).json({
                    message: "Database transaction error",
                    error:err
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
    }
    else
    {
        return res.status(400).json({
            message:"type invalid. Must be product or service"
        })
    }
})


router.delete('/remove',tokenCheck, authorizeAdmin, (req, res) => {

    if (!req.body.itemId) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const itemId = req.body.itemId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    const query = format(
                        "DELETE FROM items WHERE item_id = %L RETURNING *",
                        itemId
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



router.patch('/update', tokenCheck, authorizeAdmin, (req,res) => {

    if(!req.body.itemId)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.name)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.detail)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.price)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    if(!req.body.quantity)
    {
        return res.status(400).json({
            message:"Missing Required Body Content"
        })
    }

    const name = req.body.name
    const image = (!req.body.image) ? "": req.body.image
    const detail = req.body.detail
    const price = req.body.price
    const quantity = req.body.quantity
    const itemId = req.body.itemId



    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {
                
                const query = format(
                    "SELECT item_type FROM items WHERE item_id = %L",
                    itemId
                )

                client.query(query)
                    .then(result => {
                       
                        const itemType = result.rows[0].item_type

                        if(itemType === 'product')
                        {
                            let pa = 0;
                            let pb = 0;
                            
                            if(price > 1000 && price <= 5000)
                            {
                                pa = price * 0.12;
                            }
                            else if(price > 5000)
                            {
                                pb = price * 0.18;
                            }

                            const query = format(
                                "UPDATE items SET name = %L, image = %L, detail = %L, price = %L, quantity = %L, item_type = %L WHERE item_id = %L",
                                name,
                                image,
                                detail,
                                price,
                                quantity,
                                itemType,
                                itemId
                            )
            
                            client.query(query)
                                .then(result =>{
            
                                    const taxQuery = format(
                                        "UPDATE product_tax SET pa = %L, pb = %L WHERE item_id = %L AND item_type = %L",
                                        pa,
                                        pb,
                                        itemId,
                                        itemType
                                    )
            
                                    client.query(taxQuery)
                                        .then(taxResult => {
            
                                            client.query("COMMIT")
                                            client.release()
                                            return res.status(200).json({
                                                message: "Data Updated Successfully"
                                            })
                                        })
                                        .catch(err => {
                                            client.query("ROLLBACK")
                                            client.release()
                                            console.log("Error: ", err)
                                            
                                            return res.status(500).json({
                                                message: "Query error",
                                                error:err
                                              })
                                        })
                                })
                                .catch(err => {
                                    client.query("ROLLBACK")
                                    client.release()
                                    console.log("Error: ", err)
                                    
                                    return res.status(500).json({
                                        message: "Query error",
                                        error:err
                                      })
                                })
            
                        }
                        else if(itemType === "service")
                        {
                            let sa = 0;
                            let sb = 0;

                            if(price > 1000 && price <= 8000)
                            {
                                sa = price * 0.10;
                            }
                            else if(price > 8000)
                            {
                                sb = price * 0.15;
                            }


                            const query = format(
                                "UPDATE items SET name = %L, image = %L, detail = %L, price = %L, quantity = %L, item_type = %L WHERE item_id = %L",
                                name,
                                image,
                                detail,
                                price,
                                quantity,
                                itemType,
                                itemId
                            )
            
                            client.query(query)
                                .then(result =>{
            
                                    const taxQuery = format(
                                        "UPDATE service_tax SET sa = %L, sb = %L WHERE item_id = %L AND item_type = %L",
                                        sa,
                                        sb,
                                        itemId,
                                        itemType
                                    )
            
                                    client.query(taxQuery)
                                        .then(taxResult => {
            
                                            client.query("COMMIT")
                                            client.release()
                                            return res.status(200).json({
                                                message: "Data Updated Successfully"
                                            })
                                        })
                                        .catch(err => {
                                            client.query("ROLLBACK")
                                            client.release()
                                            console.log("Error: ", err)
                                            
                                            return res.status(500).json({
                                                message: "Query error",
                                                error:err
                                              })
                                        })
                                })
                                .catch(err => {
                                    client.query("ROLLBACK")
                                    client.release()
                                    console.log("Error: ", err)
                                    
                                    return res.status(500).json({
                                        message: "Query error",
                                        error:err
                                      })
                                })
                        }
                        else
                        {
                            client.release()
                            return res.status(400).json({
                                message:"type invalid. Must be product or service"
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

    if (!req.body.itemId) {
        return res.status(400).json({
            message: "Missing Required Body Content"
        })
    }

    const itemId = req.body.itemId

    dbUserPool.connect()
        .then(client => {
            client.query("BEGIN")
                .then(() => {
                    
                    const query = format(
                        "SELECT * FROM items WHERE item_id = %L RETURNING *",
                        itemId
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
                                message: "Item Fetched Successfully",
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