import dotenv from "dotenv";
dotenv.config({
     quiet: true
});

import express from "express";
import createClient from "./db/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import verifyJWT from "./middlewares/verifyTokenMiddleware.js";
import { StatusCodes } from "http-status-codes";
import { createUser, getUserDetailsByEmail } from "./db/dbFunctions.js";

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
  const users = await client.query(`SELECT * FROM users WHERE id = ${userId};`);
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
    const checkEmailExist = await getUserDetailsByEmail(client, email);

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

    const existingUser = await client.query(
      `SELECT * FROM users WHERE email = $1`,
      [email],
    );

    if (existingUser.rows.length === 0) {
      return res.status(400).json({ msg: "User not found" });
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
      message: "Login successful",
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.log("Error in login", err);
    res.status(500).json({ msg: "Login Error" });
  }
});

app.post("/refreshToken", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ message: "Refresh token missing" });
  }

  try {
    // Check token valid or not
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

    // Check token exists in DB
    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    res.json({
      accessToken: newAccessToken,
    });
  } catch (err) {
    res.status(403).json({ message: "Refresh token expired or invalid" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`backend is running on ${process.env.PORT}`);
});
