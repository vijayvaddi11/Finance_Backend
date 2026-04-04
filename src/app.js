import dotenv from "dotenv";
dotenv.config({
     quiet: true
});

import express from "express";
import createClient from "./db/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyJWT from "./middlewares/verifyTokenMiddleware.js";
import { getStatusCode, StatusCodes } from "http-status-codes";
import { createUser, fetchUserDetailsByEmail ,createTransaction, fetchTransactionsById, updateTransactionByID, softDeleteTransactionByID, deleteTransactionByID,viewTransactions} from "./db/dbFunctions.js";
import {isNumeric,isValidDate, toBoolean} from './utils/utils.js'
const app = express();
const client = await createClient(); 

/**
 * transactions/
 *   - Filtering records based on criteria such as date, category, or type
 *   - Pagination
 * transactions/edit
 * transactions/create
 * transactions/delete
 * transactions/search
 *
 * dashboard/
 *
 *
 * auth/login
 * auth/register
 * auth/refreshToken
 *
 */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/getUserDetails", verifyJWT, async (req, res) => {
  const userRole = req.role;
  if (userRole != "admin") {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      msg: "Not authorized to access user details",
    });
  }

  const userId = req.userId;
  const users = await client.query(
     `SELECT * FROM users WHERE id = $1`,
     [userId]
);
  return res.json(users.rows);
});



app.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    //user validation
    if (!name?.trim() || !email?.trim() || !password.trim()) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "require valid user details" });
    }

    if (password.trim().length < 6) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Password must be at least 6 characters" });
    }

    //check email alredy exist or not
    const checkEmailExist = await fetchUserDetailsByEmail(client, email);

    if (checkEmailExist.rowCount > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email already Exist" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await createUser(client, name, email, hashedPassword, role);
    res.json({
      message: "user registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.log("Error in registering user", err);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Error registering user" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await fetchUserDetailsByEmail(client,email);

    if (existingUser.rows.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({ msg: "User not found" });
    }
    const user = existingUser.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid Password" });
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" },
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" },
    );

    await client.query(
      `INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)`,
      [user.id, refreshToken],
    );

    return res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.log('Error in login', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Login Error' });
  }
});


app.post("/refreshToken", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Refresh token missing'});
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    const tokenCheck = await client.query(
          `SELECT * FROM refresh_tokens WHERE token = $1`,
          [refreshToken]
     );
     if (tokenCheck.rowCount === 0) {
          return res.status(StatusCodes.FORBIDDEN).json({ message: 'Invalid refresh token' });
     }

    const newAccessToken = jwt.sign(
     {
        userId: user.id,
        name: user.name,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" },
    );

    res.json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    res.status(403).json({ message: 'Refresh token expired or invalid'});
  }
});



//transactions

app.get('/transactions/',verifyJWT,async(req,res)=>{
  try{
    if(!['admin','analyst','admin'].includes(req.role)){
      return res.status(StatusCodes.UNAUTHORIZED).json({msg:'Unauthorized to access transactions data'})
    }
    const user = req.userId

    const transactions = await viewTransactions(client,user);

    return res.status(StatusCodes.OK).json(transactions.rows)



  }catch(err){
    console.log('Error in viewing transactions',err)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'Error viewing transaction'})
  }

});


app.post('/transactions/create',verifyJWT,async(req,res)=>{
     try{
          if(req.role != 'admin'){
               return res.status(StatusCodes.UNAUTHORIZED).json({msg:'Access denied'})
          }

          const {amount,type,category,date,note}=req.body

          for(const[k,v] of Object.entries(req.body)){
            switch(k){
              case 'amount':{
                if(!isNumeric(v)||v.trim().length===0){
                  return res.status(StatusCodes.BAD_REQUEST).json({msg:'Please send a valid numeric for amount'})
                }
                break;
              }
              case 'type':{
                if(!(['income', 'expense'].includes(v))){
                    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'type can either be income or expense only'})
               }
               break;
              }
              case 'date':{
                if(!isValidDate(v)){
                  return res.status(StatusCodes.BAD_REQUEST).json({msg:'invalid date format'})
                }
                break;
              }
              default:
                break;
            }
          }
          const result = await createTransaction(client, req.userId,amount,type,category,date,note)
          return res.status(StatusCodes.OK).json(result.rows[0]);

     }catch(err){
          console.log('Error in creating transactions', err)
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({msg:'Error creating transaction'})
     }
})


app.put("/transactions/edit/:id", verifyJWT, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access denied" });
    }
    const { id } = req.params;
    
    for(const [k,v] of Object.entries(req.body)){
     switch(k){
          case 'amount': {
               if(!isNumeric(v)||v.trim().length===0){
                    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'Please send a valid numeric for amount'})
               }
               break;
          }
          case 'date': {
              if(!isValidDate(v)){
                  return res.status(StatusCodes.BAD_REQUEST).json({msg:'invalid date format'})
                }
                break;
          }
          
          case 'type': {
               if(!(['income', 'expense'].includes(v))){
                    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'type can either be income or expense only'})
               }
               break;
          }
          case 'category':
          case 'note': {
               if(v.trim() == ''){
                    return res.status(StatusCodes.BAD_REQUEST).json({msg: 'Cannot update to empty string'})
               }
               break;
          }
          default:
          break;
     }
    }
    const existingTransaction = await fetchTransactionsById(client, id)
    if(!existingTransaction){
     return res.status(StatusCodes.BAD_REQUEST).json({msg: 'No records exist for given id'})
    }
    const invalidKeys = []
    for(const [k,v] of Object.entries(req.body)){
     if(['amount', 'type', 'category', 'date', 'note'].includes(k)){
          existingTransaction[k] = v
     }else{
          invalidKeys.push(k)
     }
    }
    const result = await updateTransactionByID(client, id, existingTransaction)
    const responseJson = {
     "updatedTransaction": result.rows[0],
    }
    if(invalidKeys.length > 0){
     responseJson['msg'] = `unable to update data for invalid keys: ${invalidKeys.join(',')}`
    }
    return res.json(responseJson);
  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error updating transaction" });
  }
});

app.delete("/transactions/delete/:id", verifyJWT, async (req, res) => {
  try {
    if (req.role !== "admin") {
      return res.status(StatusCodes.FORBIDDEN).json({ msg: "Access denied" });
    }
    const { id } = req.params;
    const requestBody = req.body;

    const softDelete = toBoolean(requestBody['softDelete'])
    // if softDelete is selected, we'll disable the transaction instead of completely deleting the record.
    let response;
    if(softDelete){
          response = await softDeleteTransactionByID(client, id)
    }else{
          response = await deleteTransactionByID(client, id)
    }

    if(response.rowCount > 0) {
        return res.status(StatusCodes.OK).json({msg: `Transaction deleted successfully for id: ${id}`});
    }else{
        return res.status(StatusCodes.NOT_MODIFIED).json({msg: `Failed to deleted transaction for id: ${id}`});
    }

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Error updating transaction" });
  }
});


app.listen(process.env.PORT, () => {
  console.log(`backend is running on ${process.env.PORT}`);
});
