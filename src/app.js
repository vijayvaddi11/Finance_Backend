import dotenv from "dotenv";
dotenv.config({
     quiet: true
});

import express from "express";
import createClient from "./db/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyJWT from "./middlewares/verifyTokenMiddleware.js";
import { createUser, fetchUserDetailsByEmail ,createTransaction, fetchTransactionsById, updateTransactionByID, softDeleteTransactionByID, deleteTransactionByID,viewTransactions} from "./db/dbFunctions.js";
import transactionRouter from "./routes/transactionRoutes.js";

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

// making dbclient accessible to all routes, instead of creating a new client everytime
app.use((req, res, next) => {
  req.client = client;
  next();
});

app.use('/transactions',transactionRouter)

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


app.listen(process.env.PORT, () => {
  console.log(`backend is running on ${process.env.PORT}`);
});
