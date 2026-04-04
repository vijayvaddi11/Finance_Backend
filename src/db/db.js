import {config as dotenvConfig} from 'dotenv'
dotenvConfig()

import pg from 'pg'
const { Client } = pg

const connectionString = process.env['DATABASE_URL']
const client = new Client({
  connectionString
})
await client.connect().catch(err=>{
  console.error(`failed to connect to database: ${err}`)
})
export default client
