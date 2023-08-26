const express = require('express')
const request = require('supertest')
const itemsRoute = require('../api/routes/items')
const { Pool } = require('pg')
const jwt = require('jsonwebtoken')
const tokenCheck = require('../api/middlewares/tokenCheck')
const authorizeAdmin = require('../api/middlewares/authorizeAdmin')

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

jest.mock('../api/middlewares/tokenCheck', () => jest.fn((req, res, next) => next()));
jest.mock('../api/middlewares/authorizeAdmin', () => jest.fn((req, res, next) => next()));


const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/items', itemsRoute)

describe('Integration Tests for Commerce API', () => {

    describe('Items Test', ()=>{

        let dbUserPool
        
        beforeEach(()=>{
            dbUserPool = new Pool()
        })

        afterEach(()=>{
            jest.clearAllMocks()
        })

        it('POST /items/add - failure - missing body', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/items/add')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                name: "",
                detail: "mock-detail",
                price: "mock-price",
                quantity: "mock-quantity",
                type: "mock-type"
            })
    
            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            expect(statusCode).toBe(400)

            expect(body).toEqual({
                message:"Missing Required Body Content"
            })

        })

        
        it('POST /items/add - success - add item ', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id:"mock-item-id",name: "mock-name" }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/items/add')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                name: "mock-name",
                detail: "mock-detail",
                price: "mock-price",
                quantity: "mock-quantity",
                type: "product"
            })

            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(4)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Data Inserted Successfully"
            })
            
        })


        it('DELETE /items/remove - failure - missing body', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id:'mock-item-id', name: 'mock-name'}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).delete('/items/remove')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                itemId: ""
            })
    
            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            expect(statusCode).toBe(400)

            expect(body).toEqual({
                message:"Missing Required Body Content"
            })

        })

        
        it('DELETE /items/remove - success - delete item successfully ', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id:'mock-item-id', name: 'mock-name'}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).delete('/items/remove')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                itemId: "1sdads-123wadsda-asfwddwe"
            })
            
            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Item Deleted Successfully",
                data: expect.objectContaining({
                    item_id: expect.any(String), 
                    name: expect.any(String), 
                })
            })
            
        })

        it('PATCH /items/update - success - update item successfully ', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id: "mock-itemId", item_type: "product"}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).patch('/items/update')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                itemId: "mock-itemId",
                name:"mock-name",
                detail:"mock-detail",
                price:"mock-price",
                quantity:"mock-quantity"
            })
            
            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(5)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Data Updated Successfully"
            })
            
        })


        it('POST /items - success - get item details successfully ', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id: "mock-itemId", name:"mock-name", item_type: "product"}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/items/')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                itemId: "mock-itemId"
            })
            
            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Item Fetched Successfully",
                data: expect.objectContaining({
                    item_id: expect.any(String), 
                    name: expect.any(String), 
                    item_type: expect.any(String)
                })
            })
            
        })


        it('POST /items/all - success - get all items ', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id: "mock-itemId", name:"mock-name", item_type: "product"}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/items/all')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                lastTimeStamp: "-1",
                itemType: "product"
            })
            
            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "products Fetched Successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                    item_id: expect.any(String), 
                    name: expect.any(String), 
                    item_type: expect.any(String)
                })])
            })
            
        })

    })

})