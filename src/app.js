import express from "express";
import dotenv from "dotenv"
import client from "./db/db.js";

const app = express()
dotenv.config()

app.get('/',async (req,res)=>{
     const users = await client.query('SELECT * FROM users ;')
     return res.json(
          users.rows
     )
})

app.get('/createUser', async (req, res)=>{
     // const {name, email, password, role} = req.body
     const result = await client.query({
          text: 'INSERT INTO users(name, email, password, role) VALUES($1, $2, $3, $4)',
          values: ['vijay', 'vijay@gmail.com', 'vijay123', 'admin'],
     })
     return res.json(
          result
     )
})

app.listen(process.env.PORT,()=>{
     console.log(`backend is running on ${process.env.PORT}`)
})