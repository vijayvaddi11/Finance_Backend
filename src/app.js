import dotenv from "dotenv";
dotenv.config({
     quiet: true
});

import express from "express";
import createClient from "./db/db.js";
import verifyJWT from "./middlewares/verifyTokenMiddleware.js";
import transactionRouter from "./routes/transactionRoutes.js";
import authRouter from './routes/authRouter.js'
import rateLimit from "express-rate-limit";

const app = express();
const client = await createClient(); 

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 100, // limit each IP to 100 requests per window
  message: "Too many requests, please try again later."
});
app.use(limiter);


app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// making dbclient accessible to all routes, instead of creating a new client everytime
app.use((req, res, next) => {
  req.client = client;
  next();
});


app.use('/transactions',transactionRouter)
app.use('/auth',authRouter)

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



app.listen(process.env.PORT, () => {
  console.log(`backend is running on ${process.env.PORT}`);
});
