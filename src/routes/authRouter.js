import express from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fetchUserDetailsByEmail, createUser } from '../db/dbFunctions.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a User
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: Vijay
 *               email:
 *                 type: string
 *                 example: vijay@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456
 *               role:
 *                 type: string
 *                 example: admin
 *     responses:
 *       200:
 *         description: User created successfully
 */
router.post('/register', async (req, res) => {
	try {
		const { name, email, password, role } = req.body;
		//user validation
		if (!name?.trim() || !email?.trim() || !password.trim()) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ message: 'require valid user details' });
		}

		//checking for valid email
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid email' });
		}

		if (password.trim().length < 6) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ message: 'Password must be at least 6 characters' });
		}

		//check email alredy exist or not
		const checkEmailExist = await fetchUserDetailsByEmail(req.client, email);

		if (checkEmailExist.rowCount > 0) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ message: 'Email already Exist' });
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await createUser(req.client, name, email, hashedPassword, role);
		res.status(StatusCodes.OK).json({
			message: 'user registered successfully',
			user: result.rows[0],
		});
	} catch (err) {
		console.log('Error in registering user', err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Error registering user',
		});
	}
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: User Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: testadmin@gmail.com
 *               password:
 *                 type: string
 *                 example: testadmin123
 *     responses:
 *       200:
 *         description: User created successfully
 */
router.post('/login', async (req, res) => {
	try {
		const { email, password } = req.body;
		const existingUser = await fetchUserDetailsByEmail(req.client, email);

		if (existingUser.rows.length === 0) {
			return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'User not found' });
		}
		const user = existingUser.rows[0];

		const isMatch = await bcrypt.compare(password, user.password);

		if (!isMatch) {
			return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid Password' });
		}

		const accessToken = jwt.sign(
			{
				userId: user.id,
				name: user.name,
				role: user.role,
			},
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1h' }
		);

		const refreshToken = jwt.sign(
			{
				userId: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
			},
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '7d' }
		);

		await req.client.query(
			`INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)`,
			[user.id, refreshToken]
		);

		return res.json({
			message: 'Login successful',
			accessToken,
			refreshToken,
		});
	} catch (err) {
		console.log('Error in login', err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Login Error',
		});
	}
});

/**
 * @swagger
 * /auth/refreshToken:
 *   post:
 *     summary: refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: User created successfully
 */
router.post('/refreshToken', async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: 'Refresh token missing' });
  }

  try {
    
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Check DB
    const tokenCheck = await req.client.query(
      `SELECT * FROM refresh_tokens WHERE token = $1`,
      [refreshToken]
    );

    if (tokenCheck.rowCount === 0) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: 'Invalid refresh token' });
    }

    // Fetch user
    const userResult = await req.client.query(
      `SELECT id, name, role FROM users WHERE id = $1`,
      [decoded.userId]
    );

    const user = userResult.rows[0];

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        userId: user.id,
        name: user.name,
        role: user.role,
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ accessToken: newAccessToken });

  } catch (err) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Refresh token expired or invalid',
    });
  }
});
});

export default router;
