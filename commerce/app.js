const express = require('express')
const itemsRoute = require('./api/routes/items')
const cors = require('cors')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

const port = process.env.PORT || 3001

app.use('/items', itemsRoute)

app.get('/', (req, res) => {
  res.status(200).json({
    data: 'Namaste! Welcome to Commerce Microservice'
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
