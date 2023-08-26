const express = require('express')
const request = require('supertest')
const { Pool } = require('pg')
const tokenCheck = require('../api/middlewares/tokenCheck')
const authorizeAdmin = require('../api/middlewares/authorizeAdmin')
const cartRoute = require('../api/routes/cart')
const ordersRoute = require('../api/routes/orders')
const uploadImage = require('../api/services/uploadHelper')

jest.mock('fs', () => jest.createMockFromModule('fs'))
const fs = require('fs')

jest.mock('pg', () => {
    const mPool = {
      connect: jest.fn(),
      query: jest.fn(),
      end: jest.fn()
    };
    return { Pool: jest.fn(() => mPool) };
  })

jest.mock('../api/services/uploadHelper', (filePath, fileName) => jest.fn(() => { return Promise.resolve('mocked-image-url')}));

jest.mock('../api/services/createInvoice', () => ({
    createInvoice: jest.fn((invoice, outputPath) => {
      return Promise.resolve(true)
    }),
}))

fs.unlinkSync = jest.fn()

jest.mock('../api/middlewares/tokenCheck', () => jest.fn((req, res, next) => next()));
jest.mock('../api/middlewares/authorizeAdmin', () => jest.fn((req, res, next) => next()));

const app = express()

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use('/cart', cartRoute)
app.use('/orders', ordersRoute)

describe('Integration Tests for Orders and Billings API', () => {

    describe('Cart Test',() => {

        let dbUserPool
        
        beforeEach(()=>{
            dbUserPool = new Pool()
        })

        afterEach(()=>{
            jest.clearAllMocks()
        })

        it('POST /cart/add - success - add item to cart', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/cart/add')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                itemId: "mock-item-id",
                quantity: "mock-quantity",
                type: "product"
            })

            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(4)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Data Inserted Successfully"
            })
            
        })

        it('GET /cart/ - success - get all item from cart', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id:"mock-item-id",name:"mock-name"}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).get('/cart/')
            .set('Authorization', 'Bearer valid-access-token')

            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "User cart fetched successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        item_id:"mock-item-id",
                        name:"mock-name"
                    })
                ])
            })
            
        })


        it('GET /cart/cartValue - success - get cart value', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{
                    item_id:"mock-item-id",
                    user_id:"mock-user-id",
                    cart_item_id:"mock-cid",
                    name:"mock-name",
                    quantity:"124",
                    image:"mock",
                    price:"mock",
                    total_tax: "mock",
                    total_price_after_tax: "mock"
                }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).get('/cart/cartValue')
            .set('Authorization', 'Bearer valid-access-token')

            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "User cart value fetched successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        item_id: expect.any(String),
                        user_id: expect.any(String),
                        cart_item_id: expect.any(String),
                        name: expect.any(String),
                        quantity: expect.any(String),
                        image: expect.any(String),
                        price: expect.any(String),
                        total_tax: expect.any(String),
                        total_price_after_tax: expect.any(String),
                    })
                ])
            })
            
        })



        it('DELETE /cart/removeItem - failure - missing body', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).delete('/cart/removeItem')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                cartItemId: ""
            })
    
            expect(tokenCheck).toHaveBeenCalled()

            expect(statusCode).toBe(400)

            expect(body).toEqual({
                message: "Missing Required Body Content"
            })

        })

        it('DELETE /cart/removeItem - success - remove item from cart', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id:'mock-item-id', name: 'mock-name'}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).delete('/cart/removeItem')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                cartItemId: "mock-item-id"
            })
    
            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)

            expect(statusCode).toBe(200)

            expect(body).toEqual({
                message: "Item Deleted Successfully",
                data: expect.objectContaining({
                    item_id: expect.any(String),
                    name: expect.any(String)
                })
            })

        })


        it('DELETE /cart/clear - success - clear cart', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id:'mock-item-id', name: 'mock-name'}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).delete('/cart/clear')
            .set('Authorization', 'Bearer valid-access-token')
    
            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)

            expect(statusCode).toBe(200)

            expect(body).toEqual({
                message: "Cart cleared Successfully",
                data: expect.any(Number)
            })

        })


        it('GET /cart/placeOrder - success - place order', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{item_id:"mock-item-id",name:"mock-name", total_order_value: "mock-value", order_id: "mock-order-id"}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).get('/cart/placeOrder')
            .set('Authorization', 'Bearer valid-access-token')
            
            expect(tokenCheck).toHaveBeenCalled()
            expect(uploadImage).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(12)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Ordered Placed Successfully",
                data: expect.any(Number),
                orderId: expect.any(String),
                invoice_link: expect.any(String)
            })
            
        })

    })

    describe('Order Test', ()=>{
        let dbUserPool
        
        beforeEach(()=>{
            dbUserPool = new Pool()
        })

        afterEach(()=>{
            jest.clearAllMocks()
        })


        it('GET /orders/ - success - get orders', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{order_id:"mock-order-id", user_id:"mock-user-id"}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).get('/orders')
            .set('Authorization', 'Bearer valid-access-token')

            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Orders Fetched Successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        order_id: expect.any(String),
                        user_id: expect.any(String),
                    })
                ])
            })
            
        })

        it('POST /orders/order - success - get order details', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{
                    item_id:"mock",
                    quantity: "mock",
                    name: "mock",
                    price: "mock",
                    item_type: "mock",
                    tax_a: "mock",
                    tax_b: "mock",
                    tax_c: "mock",
                    total_item_value: "mock",
                    total_order_value: "mock"
                }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/orders/order')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                orderId: "mock-item-id",
            })

            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(4)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Orders Fetched Successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        item_id: expect.any(String),
                        quantity: expect.any(String),
                        name: expect.any(String),
                        price: expect.any(String),
                        item_type: expect.any(String),
                        tax_a: expect.any(String),
                        tax_b: expect.any(String),
                        tax_c: expect.any(String),
                        total_item_value: expect.any(String),
                        total_order_value: expect.any(String)
                    })
                ])
            })
            
        })


        it('POST /orders/bill - success - get bill details', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{
                    item_id:"mock",
                    quantity: "mock",
                    name: "mock",
                    price: "mock",
                    item_type: "mock",
                    tax_a: "mock",
                    tax_b: "mock",
                    tax_c: "mock",
                    total_item_value: "mock",
                    total_order_value: "mock"
                }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/orders/bill')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                billId: "mock-item-id",
            })

            expect(tokenCheck).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Bill Fetched Successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        item_id: expect.any(String),
                        quantity: expect.any(String),
                        name: expect.any(String),
                        price: expect.any(String),
                        item_type: expect.any(String),
                        tax_a: expect.any(String),
                        tax_b: expect.any(String),
                        tax_c: expect.any(String),
                        total_item_value: expect.any(String),
                        total_order_value: expect.any(String)
                    })
                ])
            })
            
        })

        it('GET /orders/admin-get-order - success - get all orders', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{order_id:"mock-order-id", user_id:"mock-user-id", bill_id:"mock-bill-id"}], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).get('/orders/admin-get-orders')
            .set('Authorization', 'Bearer valid-access-token')

            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Orders Fetched Successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        order_id: expect.any(String),
                        user_id: expect.any(String),
                        bill_id: expect.any(String)
                    })
                ])
            })
            
        })


        it('POST /orders/admin-order-details - success - get order details', async ()=>{

            const mockClient = {
                query: jest.fn().mockResolvedValue({ rows: [{
                    item_id:"mock",
                    quantity: "mock",
                    name: "mock",
                    price: "mock",
                    item_type: "mock",
                    tax_a: "mock",
                    tax_b: "mock",
                    tax_c: "mock",
                    total_item_value: "mock",
                    total_order_value: "mock"
                }], rowCount: 1 }),
                release: jest.fn(),
            }

            const mockConnect = jest.fn().mockResolvedValue(mockClient)

            const dbUserPool = new Pool()
            dbUserPool.connect = mockConnect


            const{body, statusCode} = await request(app).post('/orders/admin-order-details')
            .set('Authorization', 'Bearer valid-access-token')
            .send({
                orderId: "mock-item-id",
            })

            expect(tokenCheck).toHaveBeenCalled()
            expect(authorizeAdmin).toHaveBeenCalled()
            expect(mockConnect).toHaveBeenCalled()
            expect(mockClient.query).toHaveBeenCalledTimes(3)
            
            expect(statusCode).toBe(200)
            expect(body).toEqual({
                message: "Orders Fetched Successfully",
                data: expect.arrayContaining([
                    expect.objectContaining({
                        item_id: expect.any(String),
                        quantity: expect.any(String),
                        name: expect.any(String),
                        price: expect.any(String),
                        item_type: expect.any(String),
                        tax_a: expect.any(String),
                        tax_b: expect.any(String),
                        tax_c: expect.any(String),
                        total_item_value: expect.any(String),
                        total_order_value: expect.any(String)
                    })
                ])
            })
            
        })


    })

})
