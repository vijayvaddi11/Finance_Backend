import express from 'express';
import { StatusCodes } from 'http-status-codes';
import verifyJWT from '../middlewares/verifyTokenMiddleware.js';
import { getInsights } from '../utils/utils.js';
import {
	fetchRecordsByDate,
	fetchByCategory,
	fetchRecent,
	fetchAll,
} from '../db/dbFunctions.js';

const router = express.Router();

router.get('/trends', verifyJWT, async (req, res) => {
	try {
		const { type } = req.query;
		if (!['weekly', 'monthly'].includes(type)) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ msg: 'type must be weekly or monthly' });
		}

		const today = new Date();
		const fromDate = new Date();

		if (type === 'weekly') {
			fromDate.setDate(today.getDate() - 7);
		} else if (type == 'monthly') {
			fromDate.setMonth(today.getMonth() - 1);
		} else {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ msg: `Invalid query param ${type}` });
		}
		const result = await fetchRecordsByDate(req.client, fromDate);
		const records = result.rows;
		const insights = getInsights(records);
		return res.json({
			...insights,
			transactions: records,
		});
	} catch (err) {
		console.log('Error in showcasing dashboard trends', err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Error showcasing dashboard trends',
		});
	}
});

router.get('/categoryInsights', verifyJWT, async (req, res) => {
	try {
		const { category } = req.query;
		if (!category?.trim()) {
			return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Category required' });
		}
		const result = await fetchByCategory(req.client, category);
		const records = result.rows;
		const insights = getInsights(records);

		return res.json({
			...insights,
			transactions: records,
		});
	} catch (err) {
		console.log(err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Error in category insights',
		});
	}
});

router.get('/recentActivity', verifyJWT, async (req, res) => {
	try {
		const result = await fetchRecent(req.client);
		const records = result.rows;
		const insights = getInsights(records);
		return res.json({
			...insights,
			transactions: records,
		});
	} catch (err) {
		console.log(err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Error in recent activity',
		});
	}
});

router.get('/stats', verifyJWT, async (req, res) => {
	try {
		const result = await fetchAll(req.client);
		const records = result.rows;
		const insights = getInsights(records);
		return res.json(insights);
	} catch (err) {
		console.log(err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Error in stats API',
		});
	}
});

export default router;
