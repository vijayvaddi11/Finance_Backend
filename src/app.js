// loading env variables on priority
import dotenv from 'dotenv';
dotenv.config({
	quiet: true,
});

import express from 'express';
import rateLimit from 'express-rate-limit';
import createDatabaseClient from './db/db.js';
import transactionRouter from './routes/transactionRoutes.js';
import authRouter from './routes/authRouter.js';
import dashboardRouter from './routes/dashboardRouter.js';

const app = express();
const PORT = process.env['PORT'] || 4000;
const databaseClient = await createDatabaseClient();

// rate limiting
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes window
	max: 100, // limit each IP to 100 requests per window
	message: 'Too many requests, please try again later.',
});
app.use(limiter);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// making database client accessible to all routes, 
// instead of creating a new client everytime
app.use((req, res, next) => {
	req.client = databaseClient;
	next();
});

app.use('/transactions', transactionRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);

app.listen(PORT, () => {
	console.log(`server running on port: ${PORT}`);
});
