const express = require('express')
const request = require('supertest')
const authRoute = require('../api/routes/auth')
const { Pool } = require('pg');

// setup for to mock pg
jest.mock('pg', () => {
    const mPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn()
    };
    return { Pool: jest.fn(() => mPool) };
  });

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

    describe('Email Endpoint Test', () => {

        let dbUserPool
        
        beforeEach(()=>{
            dbUserPool = new Pool()
        })

        afterEach(()=>{
            jest.clearAllMocks()
        })

        it('POST /auth/email/register - failure - invalid request body missing email', async () =>{

            const {body, statusCode} = await request(app).post('/auth/email/register').send({
                email: "",
                password: "test123",
                name: "Bob Dylan",
                phone: "9121561266",
                address: "Vienna, Italy"
            })

            expect(statusCode).toBe(400)

            expect(body).toEqual({
                message:"Missing Required Body Content"
            })

        })

        it('POST /auth/email/register - success - user registered', async () => {
            
            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
                release: jest.fn(),
            }
            
            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect

            const {body, statusCode} = await request(app).post('/auth/email/register').send({
                email: "bob@gmail.com",
                password: "test123",
                name: "Bob Dylan",
                phone: "9121561266",
                address: "Vienna, Italy"
            })

            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(4)

            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "User added successfully"
            })
        })


        it('POST /auth/email/register - failure - user exists', async () => {
            
            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{email:"bob@gmail.com"}], rowCount: 1}),
                release: jest.fn(),
            }
            
            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect

            const {body, statusCode} = await request(app).post('/auth/email/register').send({
                email: "bob@gmail.com",
                password: "test123",
                name: "Bob Dylan",
                phone: "9121561266",
                address: "Vienna, Italy"
            })

            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(2)

            expect(statusCode).toBe(409)
            expect(body).toEqual({
                message: "Email already exists"
            })
        })

    })

})