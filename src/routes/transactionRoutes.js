import express from 'express';
import { StatusCodes } from 'http-status-codes';
import verifyJWT from '../middlewares/verifyTokenMiddleware.js';
import {
	createTransaction,
	deleteTransactionByID,
	fetchTransactionsById,
	softDeleteTransactionByID,
	updateTransactionByID,
	viewTransactions,
} from '../db/dbFunctions.js';
import { isNumeric, isValidDate, toBoolean } from '../utils/utils.js';

const router = express.Router();

// GET: / - view transactions
router.get('/', verifyJWT, async (req, res) => {
	try {
		if (!['viewer', 'analyst', 'admin'].includes(req.role)) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ msg: 'Unauthorized to access transactions data' });
		}
		const user = req.userId;
		const role = req.role;
		const filter = req.query;
		const transactions = await viewTransactions(req.client, user, role, filter);
		return res.status(StatusCodes.OK).json(transactions.rows);
	} catch (err) {
		console.log('Error in viewing transactions', err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Error viewing transaction',
		});
	}
});

// POST: /create - create transactions
router.post('/create', verifyJWT, async (req, res) => {
	try {
		if (!role=='admin') {
			return res.status(StatusCodes.UNAUTHORIZED).json({ msg: 'Access denied' });
		}

		const { amount, type, category, date, note } = req.body;

		if (!amount || !type || !category || !date) {
			return res.status(StatusCodes.BAD_REQUEST).json({
				msg: 'Missing required fields',
			});
		}

		for (const [k, v] of Object.entries(req.body)) {
			switch (k) {
				case 'amount': {
					if (!isNumeric(v)) {
						return res.status(StatusCodes.BAD_REQUEST).json({
							msg: 'Please send a valid numeric for amount',
						});
					}
					break;
				}
				case 'type': {
					if (!['income', 'expense'].includes(v)) {
						return res.status(StatusCodes.BAD_REQUEST).json({
							msg: 'type can either be income or expense only',
						});
					}
					break;
				}
				case 'date': {
					if (!isValidDate(v)) {
						return res
							.status(StatusCodes.BAD_REQUEST)
							.json({ msg: 'invalid date format' });
					}
					break;
				}
				default:
					break;
			}
		}
		const result = await createTransaction(
			req.client,
			req.userId,
			amount,
			type,
			category,
			date,
			note
		);
		return res.status(StatusCodes.OK).json(result.rows[0]);
	} catch (err) {
		console.log('Error in creating transactions', err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			msg: 'Error creating transaction',
		});
	}
});

// PUT: /edit/:id - update transactions
router.put('/edit/:id', verifyJWT, async (req, res) => {
	try {
		if (!['admin', 'viewer'].includes(req.role)) {
			return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Access denied' });
		}
		const { id } = req.params;

		for (const [k, v] of Object.entries(req.body)) {
			switch (k) {
				case 'amount': {
					if (!isNumeric(v)) {
						return res.status(StatusCodes.BAD_REQUEST).json({
							msg: 'Please send a valid numeric for amount',
						});
					}
					break;
				}
				case 'date': {
					if (!isValidDate(v)) {
						return res
							.status(StatusCodes.BAD_REQUEST)
							.json({ msg: 'invalid date format' });
					}
					break;
				}

				case 'type': {
					if (!['income', 'expense'].includes(v)) {
						return res.status(StatusCodes.BAD_REQUEST).json({
							msg: 'type can either be income or expense only',
						});
					}
					break;
				}
				case 'category':
				case 'note': {
					if (v.trim() == '') {
						return res
							.status(StatusCodes.BAD_REQUEST)
							.json({ msg: 'Cannot update to empty string' });
					}
					break;
				}
				default:
					break;
			}
		}
		const existingTransaction = await fetchTransactionsById(req.client, id);
		console.log(existingTransaction);
		if (!existingTransaction) {
			return res
				.status(StatusCodes.BAD_REQUEST)
				.json({ msg: 'No records exist for given id' });
		}
		const invalidKeys = [];
		for (const [k, v] of Object.entries(req.body)) {
			if (['amount', 'type', 'category', 'date', 'note'].includes(k)) {
				existingTransaction[k] = v;
			} else {
				invalidKeys.push(k);
			}
		}
		const result = await updateTransactionByID(req.client, id, existingTransaction);
		const responseJson = {
			updatedTransaction: result.rows[0],
		};
		if (invalidKeys.length > 0) {
			responseJson['msg'] =
				`unable to update data for invalid keys: ${invalidKeys.join(',')}`;
		}
		return res.json(responseJson);
	} catch (err) {
		console.log(err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Error updating transaction' });
	}
});

// DELETE: /delete/:id - delete transaction
router.delete('/delete/:id', verifyJWT, async (req, res) => {
	try {
		if (!['admin', 'viewer'].includes(req.role)) {
			return res.status(StatusCodes.FORBIDDEN).json({ msg: 'Access denied' });
		}
		const { id } = req.params;
		const requestBody = req.body;

		const softDelete = toBoolean(requestBody['softDelete']);
		// if softDelete is selected,
		// we'll disable the transaction instead of completely deleting the record.
		let response;
		if (softDelete) {
			response = await softDeleteTransactionByID(req.client, id);
		} else {
			response = await deleteTransactionByID(req.client, id);
		}

		if (response.rowCount > 0) {
			return res.status(StatusCodes.OK).json({
				msg: `Transaction deleted successfully for id: ${id}`,
			});
		} else {
			return res
				.status(StatusCodes.NOT_MODIFIED)
				.json({ msg: `Failed to deleted transaction for id: ${id}` });
		}
	} catch (err) {
		console.log(err);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ msg: 'Error updating transaction' });
	}
});

export default router;
