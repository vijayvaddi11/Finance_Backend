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

/**
 * @swagger
 * /dashboard/trends:
 *   get:
 *     summary: Get transaction trends (weekly or monthly)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         required: true
 *         description: Type of trend analysis
 *         schema:
 *           type: string
 *           enum: [weekly, monthly]
 *         example: weekly
 *     responses:
 *       200:
 *         description: Successfully fetched trends data
 *       400:
 *         description: Invalid query parameter (type must be weekly or monthly)
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /dashboard/categoryInsights:
 *   get:
 *     summary: Get insights for a specific category
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         required: true
 *         description: Category name to fetch insights for
 *         schema:
 *           type: string
 *         example: food
 *     responses:
 *       200:
 *         description: Successfully fetched category insights
 *       400:
 *         description: Category query parameter is required
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /dashboard/recentActivity:
 *   get:
 *     summary: Get recent transaction activity with insights
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched recent activity
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Internal server error
 */
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

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     summary: Get overall transaction statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully fetched transaction statistics
 *       401:
 *         description: Unauthorized (invalid or missing token)
 *       500:
 *         description: Internal server error
 */
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
