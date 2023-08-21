require('dotenv').config()

const express = require('express')
const router = express.Router()
const { dbUserPool } = require('../db/db')
const format = require('pg-format')
const tokenCheck = require('../middlewares/tokenCheck')


router.get('/', tokenCheck, (req,res) => {

    dbUserPool.connect()
    .then(client => {
        client.query("BEGIN")
            .then(() => {

                const query = format(
                    "SELECT name, address, email, phone FROM users WHERE user_id = %L",
                    req.userId
                )

                client.query(query)
                    .then(result => {

                        if (result.rows.length == 0) {
                            
                            client.release()

                            return res.status(409).json({
                              message: "No User Data"
                            })
                        }
                        
                        client.release()
                        return res.status(200).json({
                            message: "User Data Fetched Successfully",
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

router.patch('/update', tokenCheck, (req, res) => {

  if (!req.body.name) {
    return res.status(400).json({
      message: "Missing Required Body Content"
    })
  }

  if (!req.body.phone) {
    return res.status(400).json({
      message: "Missing Required Body Content"
    })
  }

  if (!req.body.address) {
    return res.status(400).json({
      message: "Missing Required Body Content"
    })
  }

  const newName = req.body.name
  const newPhone = req.body.phone
  const newAddress = req.body.address
  const userId = req.userId

  dbUserPool.connect()
    .then(client => {
      client.query("BEGIN")
        .then(() => {
          const updateQuery = format(
            "UPDATE users SET name = %L, address = %L, phone = %L WHERE user_id = %L RETURNING *",
            newName,
            newAddress,
            newPhone,
            userId
          )

          client.query(updateQuery)
            .then(result => {
              if (result.rows.length === 0) {
                client.query("ROLLBACK")
                client.release()
                return res.status(404).json({
                  message: "User not found"
                })
              }

              client.query("COMMIT")
              client.release()
              return res.status(200).json({
                message: "User updated successfully"
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
      return res.status(500).json({
        message: "Database Connection Error",
        error: err
      })
    })
})

router.delete('/remove', tokenCheck, (req, res) => {
  const userId = req.userId

  dbUserPool.connect()
    .then(client => {
      client.query("BEGIN")
        .then(() => {
          const deleteQuery = format(
            "DELETE FROM users WHERE user_id = %L RETURNING *",
            userId
          )

          client.query(deleteQuery)
            .then(result => {
              if (result.rows.length === 0) {
                client.query("ROLLBACK")
                client.release()
                return res.status(404).json({
                  message: "User not found"
                })
              }

              client.query("COMMIT")
              client.release()
              return res.status(200).json({
                message: "User removed successfully"
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
      return res.status(500).json({
        message: "Database Connection Error",
        error: err
      })
    })
})


module.exports = router