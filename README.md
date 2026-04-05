#  Finance Data Processing & Access Control Backend

##  Overview

This project is a backend system for a finance dashboard that manages financial transactions, user roles, and provides analytical insights through well-structured APIs.

The system is designed with a focus on:

* Clean backend architecture
* Role-based access control
* Data validation and reliability
* Scalable API design
* CRUD and aggregrate apis
* Input validations and proper error handling
* Rate limiting (currently configured at 100 requests per ip address for a 15 minute window)

---

##  Tech Stack

* **Node.js**
* **Express.js**
* **PostgreSQL (hosted by Supabase)**
* **JWT Authentication**
* **bcryptjs (Password hashing)**

---

##  Features

###  Authentication & Authorization

* User Registration & Login
* JWT-based Authentication
* Refresh Token mechanism
* Role-based access control: (assumed based on the details shared in requirements document)
  * **Viewer** → Read-only access (own data)
  * **Analyst** → Read + analytics (all data)
  * **Admin** → Full control (CRUD + users)

---

###  Transactions Management

* Create, Update, Delete transactions
* Soft delete support (`is_active`)
* Various Input validations, such as:
  * Amount (numeric)
  * Type (income/expense)
  * Date format validation
* Partial updates supported

---

###  Dashboard APIs

#### 1. Trends

```
GET /dashboard/trends?type=weekly | monthly
```

* Weekly / Monthly data
* Total Income
* Total Expense
* Net Balance

---

#### 2. Category Insights

```
GET /dashboard/categoryInsights?category=food
```

* Category-based aggregation
* Income / Expense split

---

#### 3. Recent Activity

```
GET /dashboard/recentActivity
```

* Last 15 transactions and their insights

---

#### 4. Stats

```
GET /dashboard/stats
```

* Overall totals (income, expense, balance)

---

##  Access Control Logic

| Role    | Permissions                |
| ------- | -------------------------- |
| Viewer  | View own data              |
| Analyst | View all data + insights   |
| Admin   | Full access (CRUD + users) |

---

##  Database Design

### Users Table

* id
* name
* email
* password (hashed)
* role

### Transactions Table

* id
* user_id
* amount
* type
* category
* date
* note
* is_active

### Refresh Tokens Table

* id
* user_id
* token
* created_at


---

##  Setup Instructions

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

##  API Authentication

All protected routes require:

```
Authorization: Bearer <access_token>
```

---

##  Validation & Error Handling

* Input validation for all fields
* Proper HTTP status codes used
* Defensive programming (null/undefined checks)
* Secure queries (parameterized SQL)

---

##  Design Decisions

* Used **PostgreSQL** for structured financial data
* Implemented **JWT with refresh tokens** for scalable auth
* Used **middleware-based RBAC** for clean access control
* Designed **aggregation APIs separately from CRUD**

---

##  Assumptions

* Users have predefined roles
* Date format is standardized (`DD-MM-YYYY`)
* Transactions belong to a single user
* Soft delete is preferred over hard delete


---

##  Conclusion

This project demonstrates:

* Backend architecture design
* Role-based access control
* Data aggregation & analytics
* Clean and maintainable code practices

