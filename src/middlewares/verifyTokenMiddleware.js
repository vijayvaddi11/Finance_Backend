import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

const routeRoles = {
	// auth routes
	'POST /auth/register': ['admin'],
	'POST /auth/login': ['admin', 'viewer', 'analyst'],
	'POST /auth/refreshToken': ['admin', 'viewer', 'analyst'],

	// transaction routes
	'GET /transactions/': ['analyst', 'admin'],
	'POST /transactions/create': ['admin'],
	'PUT /transactions/edit/:id': ['admin'],
	'DELETE /transactions/delete': ['admin'],

	// dashboard routes
	'GET /dashboard/trends': ['admin', 'viewer', 'analyst'],
	'GET /dashboard/categoryInsights': ['admin', 'viewer', 'analyst'],
	'GET /dashboard/recentActivity': ['admin', 'viewer', 'analyst'],
	'GET /dashboard/stats': ['admin', 'viewer', 'analyst'],
};

const verifyToken = (req, res, next) => {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Token missing' });
	}

	const token = authHeader.split(' ')[1];
	try {
		const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
		req.userId = decoded.userId;
		req.name = decoded.name;
		req.role = decoded.role;

		const routeKey = `${req.method} ${req.baseUrl}${req.route.path}`;
		const allowedRoles = routeRoles[routeKey];
		if (allowedRoles && !allowedRoles.includes(req.role)) {
			return res
				.status(StatusCodes.UNAUTHORIZED)
				.json({ msg: 'Unauthorized to access this route.' });
		}

		next();
	} catch (err) {
		return res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid token' });
	}
};

export default verifyToken;
