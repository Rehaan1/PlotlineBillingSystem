const express = require('express')
const cartRoute = require('./api/routes/cart')
const cors = require('cors')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

const port = process.env.PORT || 3001

app.use('/cart', cartRoute)

app.get('/', (req, res) => {
  res.status(200).json({
    data: 'Namaste! Welcome to Orders and Billings Microservice'
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
