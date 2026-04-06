# Finance Data Processing & Access Control Backend

Deployed API URL - https://finance-backend-self.vercel.app/

Deployed API DOCS (Swagger) - https://finance-backend-self.vercel.app/api-docs
```
	# use these credentials in '/login' to login and generate jwt to access the protected routes
	# (admin, viewer and analyst creds are shared below, you can also be created using the /register route as an admin)

	# admin
	email: testadmin@gmail.com
	password: testadmin123

	# analyst
	email: testanalyst123@gmail.com
	password: testanalyst123

	#viewer
	email: testuser2@gmail.com
	password: testuser2

```

Postman collection - [Finance Backend - Zorvyn Postman Collection](https://github.com/vijayvaddi11/Finance_Backend/blob/main/postman/Finance%20backend%20-%20zorvyn.postman_collection.json)

## Overview

This project is a backend system for a finance dashboard that manages financial transactions, user roles, and provides analytical insights through well-structured APIs.

The system is designed with a focus on:

- Clean backend architecture
- Role-based access control
- Data validation and reliability
- Scalable API design
- CRUD and aggregrate apis
- Input validations and proper error handling
- Rate limiting (currently configured at 100 requests per ip address for a 15 minute window)

---

## Tech Stack

- **Node.js**
- **Express.js**
- **PostgreSQL (hosted by Supabase)**

### Libraries used

- node-postgres or pg
- express
- jsonwebtoken
- bcryptjs
- nodemon
- prettier
- dotenv
- express-rate-limit

---

## Features

### Authentication & Authorization

- User Registration & Login
- JWT-based Authentication
- Refresh Token mechanism
- Role-based access control: (assumed based on the details shared in requirements document)

### Transactions Management

- Create transactions that can be either income or an expense
- Update and Delete transactions
- Soft delete support (`is_active`)
- Various Input validations, such as:
    - Amount (numeric)
    - Type (income/expense)
    - Date format validation
- Partial updates supported
- Access configured based on role
- Filter, Sorting and Paginated supported records API

### Dashboard

- Trends based on weekly or monthly basis
- Category Insights
- Recent activity that takes last 15 transactions and calculate insights
- overall stats

---

### Role-base Access

> Based on the requirements shared

Viewer: Can only view dashboard data.
Analyst: Can view records and access insights.
Admin: Can create, update, and manage records and users.

```json
{
	// auth routes
	"POST /auth/register": ["admin"],
	"POST /auth/login": ["admin", "viewer", "analyst"],
	"POST /auth/refreshToken": ["admin", "viewer", "analyst"],

	// transaction routes
	"GET /transactions/": ["analyst", "admin"],
	"POST /transactions/create": ["admin"],
	"PUT /transactions/edit/:id": ["admin"],
	"DELETE /transactions/delete": ["admin"],

	// dashboard routes
	"GET /dashboard/trends": ["admin", "viewer", "analyst"],
	"GET /dashboard/categoryInsights": ["admin", "viewer", "analyst"],
	"GET /dashboard/recentActivity": ["admin", "viewer", "analyst"],
	"GET /dashboard/stats": ["admin", "viewer", "analyst"]
}
```

## Database Design

<img width="728" height="486" alt="image" src="https://github.com/user-attachments/assets/ab2767ca-3ebc-444d-9416-840676fb2dad" />

---

## Setup Instructions

### 1. Clone Repository

```bash
git clone <your-repo-link>
cd finance_backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create `.env` file:

```env
PORT=5000
DATABASE_URL=your_postgres_connection
ACCESS_TOKEN_SECRET=your_secret
REFRESH_TOKEN_SECRET=your_secret
```

---

### 4. Run Server

```bash
npm run dev
```

---

## API Authentication

All protected routes require:

```
Authorization: Bearer <access_token>
```

---
## API DOCS
> API docs are availabe at https://finance-backend-self.vercel.app/api-docs
- I created swagger docs for better documenting of the request body and response structures and ease of accessing the apis without UI.
- Brief description of routes and their functionality:
	- Auth route contains APIs related to authentication.
 	- Transactions route is for creating, updating, viewing and deleting transactions.
    - Dashboard route contains APIs for Insights, Trends, Category Insights and Stats.

---

## Design Decisions

- Used **PostgreSQL** for structured financial data
- Implemented **JWT with refresh tokens** for scalable auth
- Used **middleware-based RBAC** for clean access control
- Designed **aggregation APIs separately from CRUD**
- Rate limiting to protect against DDOS attacks and Bots
- Structured routes and middlewares for code readability

---

## Assumptions

- Users have predefined roles
- Date format is standardized (`DD-MM-YYYY`)
- Only admin can crate users and users shouldn't be allowed to register themselves.
- category can be any string instead of a restricted set of values
- Transactions belong to a single user
- Soft delete is preferred over hard delete

---

## Conclusion

This project demonstrates:

- Backend architecture design
- Role-based access control
- Data aggregation & analytics
- Clean and maintainable code practices
