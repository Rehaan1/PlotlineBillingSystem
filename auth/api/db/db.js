require('dotenv').config()

const { Pool } = require('pg')

// Note: Ideally Create different users with
// read, write, update permissions to ensure 
// proper security measures

// Admin User with no permission Restriction

// Connection Pooling used to reduce time taken 3 way handshake
// and other overheads when connecting with database
const dbUserPool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_ADMIN_USER,
    password: process.env.POSTGRES_ADMIN_PASSWORD,
    database: process.env.POSTGRES_DB,
    max: 20,
    connectionTimeoutMillis: 0,
    idleTimeoutMillis: 0
  })
  
module.exports = {
    dbUserPool
}