const express = require('express')
const authRoute = require('./api/routes/auth')
const userRoute = require('./api/routes/users')
const cors = require('cors')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

const port = process.env.PORT || 4001

app.use('/auth', authRoute)
app.use('/user',userRoute)

app.get('/', (req, res) => {
  res.status(200).json({
    data: 'Namaste! Welcome to Auth Microservice'
  })
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
