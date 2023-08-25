const express = require('express')
const request = require('supertest')
const authRoute = require('../api/routes/auth')
const { Pool } = require('pg')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const tokenCheck = require('../api/middlewares/tokenCheck')
const authorizeAdmin = require('../api/middlewares/authorizeAdmin')

// setup for to mock pg
jest.mock('pg', () => {
    const mPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn()
    };
    return { Pool: jest.fn(() => mPool) };
  })

jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    genSaltSync: jest.fn(),
    hashSync: jest.fn()
  }))

jest.mock('bcryptjs', () => ({
    compareSync: jest.fn(),
  }))

jest.mock('../api/middlewares/tokenCheck', () => jest.fn((req, res, next) => next()));
jest.mock('../api/middlewares/authorizeAdmin', () => jest.fn((req, res, next) => next()));

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

            const mockSalt = 'mock-salt';
            const mockHashedPassword = 'mock-hashed-password'
            bcrypt.genSaltSync = jest.fn().mockReturnValue(mockSalt)
            bcrypt.hashSync = jest.fn().mockReturnValue(mockHashedPassword)

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
            expect(bcrypt.genSaltSync).toHaveBeenCalledWith(10)
            expect(bcrypt.hashSync).toHaveBeenCalledWith('test123', mockSalt)

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


        it('POST /auth/email/login - failure - user does not exists', async () => {
            
            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0}),
                release: jest.fn(),
            }
            
            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect

            const {body, statusCode} = await request(app).post('/auth/email/login').send({
                email: "bob@gmail.com",
                password: "test123",
            })

            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(2)

            expect(statusCode).toBe(401)
            expect(body).toEqual({
                message: "Email or password is incorrect"
            })
        })

        it('POST /auth/email/login - success - user logged in', async () => {
            
            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{user_id:"mock-user-id", role:"user", password: 'mock-hashed-password' }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockToken = 'mock-token-jwt-with-user-id'
            jwt.sign.mockReturnValue(mockToken)

            const mockPasswordMatch = true;
            bcrypt.compareSync.mockReturnValue(mockPasswordMatch);

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect

            const {body, statusCode} = await request(app).post('/auth/email/login').send({
                email: "bob@gmail.com",
                password: "test123",
            })

            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(2)
            expect(bcrypt.compareSync).toHaveBeenCalledWith('test123', 'mock-hashed-password')
            expect(jwt.sign).toHaveBeenCalledWith(
                { userId: 'mock-user-id', role: 'user' },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRY }
            )
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Login successful",
                token: expect.any(String)
            })
        })

    })


    describe('Admin Endpoint Test', () => {

        it('PATCH /auth/role/update - success - role updated', async () => {
            
            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{user_id:"mock-user-id", role:"admin", password: 'mock-hashed-password' }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect

            const {body, statusCode} = await request(app).patch('/auth/role/update')
                .set('Authorization', 'Bearer valid-access-token')
                .send({
                    userId: "mock-user-id",
                    role: "admin",
                })

            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()

            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Role Updated Successfully"
            })
        })

        it('PATCH /auth/role/update - failure - missing required body - userId', async () => {
            
            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{user_id:"mock-user-id", role:"admin", password: 'mock-hashed-password' }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect

            const {body, statusCode} = await request(app).patch('/auth/role/update')
                .set('Authorization', 'Bearer valid-access-token')
                .send({
                    userId: "",
                    role: "admin",
                })

            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            
            expect(statusCode).toBe(400)
            expect(body).toEqual({
                message: "Missing Required Body Content"
            })
        })

    })

})