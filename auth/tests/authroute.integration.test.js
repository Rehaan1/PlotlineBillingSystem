const express = require('express')
const request = require('supertest')
const authRoute = require('../api/routes/auth')

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())


app.use('/auth', authRoute)


describe('Integration Tests for Auth API', ()=>{

    describe('Base Endpoint Test', () => {
        
        it('GET /auth - success - base endpoint', async ()=>{

            const{body, statusCode} = await request(app).get('/auth')
    
            expect(body).toEqual({
                message:"You are in user endpoint"
            })
    
            expect(statusCode).toBe(200)
    
        })

    })

})