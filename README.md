# Retain — Expense & Budget Manager

Retain is a full-stack web app for tracking personal expenses against a monthly budget. Users record what they spend, set a budget for each month, and get warned as they approach or exceed it. Administrators manage the shared expense categories and see platform-wide insights.

- **Frontend:** React 19, TypeScript, Vite, Material UI, Redux Toolkit (with RTK Query), React Router, Recharts
- **Backend:** Node.js, Express 5, MongoDB with Mongoose, JWT authentication, Zod validation

## Features

### Users
- Sign up and sign in with JWT-based authentication; the session survives page refreshes.
- **Dashboard** for any month:
  - total spent, budget remaining, number of expenses and average expense
  - budget progress bar, plus alerts when spending is approaching (80%+) or over the budget
  - spending by category (donut chart), daily spending, and a 6-month trend
  - the month's highest expense and the most recent expenses
- **Expenses**:
  - create, edit and delete expenses (title, amount, category, date, payment method, notes)
  - search title and notes
  - filter by category, payment method, date range and amount range
  - sort by date, title or amount, with pagination
  - filters are kept in the URL, so they survive a refresh and can be bookmarked
- **Budgets:** set, edit or remove a budget for any month, and see past months marked "on track", "approaching limit" or "over budget".
- Light and dark mode, responsive layout for phones, tablets and desktops.

### Administrators
- **Insights:**
  - registered users, total expenses, total value recorded, and expenses recorded this month
  - spending per category
  - the most and least used categories
  - recent activity and newest members
- **Categories:** create, rename, recolour and delete categories. Deleting a category moves its expenses to the default **Uncategorized** category, so no user data is lost. The default category itself can't be deleted or renamed.

### Security
- Passwords are hashed with bcrypt and never returned by the API.
- Every expense and budget query is scoped to the signed-in user; other users' records return `404`.
- Admin routes are protected by role on the server, not just hidden in the UI.
- Login and registration are rate-limited; requests are validated with Zod and pass through Helmet headers and a CORS allow-list.

## Project structure

```
react-summative/
├── backend/            Express REST API
│   └── src/
│       ├── config/       environment + database connection
│       ├── controllers/  route handlers (auth, expenses, budgets, categories, dashboard, admin)
│       ├── middleware/   JWT auth, role checks, error handling
│       ├── models/       Mongoose models (User, Expense, Budget, Category)
│       ├── routes/       route table
│       ├── services/     shared logic (spending summaries, seeding)
│       └── scripts/      seed script
├── frontend/           React single-page app
│   └── src/
│       ├── api/          axios client + API types
│       ├── store/        Redux store, auth/ui slices, RTK Query endpoints
│       ├── components/   layout, dialogs, charts, shared UI
│       ├── pages/        Dashboard, Expenses, Budgets, admin pages, auth pages
│       ├── theme/        Material UI theme (light/dark)
│       └── utils/        formatting helpers
└── render.yaml         one-click deployment to Render
```

## Running locally

Requirements: **Node.js 20 or newer**.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API starts on <http://localhost:5000>.

If `MONGO_URI` in `.env` is left empty, the backend starts a temporary **in-memory MongoDB** filled with demo data. The first start downloads MongoDB (~100 MB), and all data is lost when the server stops. To use MongoDB Atlas instead, paste its connection string into `MONGO_URI`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. During development Vite forwards `/api` requests to the backend, so no extra configuration is needed.

### Demo accounts

These are created automatically with the in-memory database, or with `npm run seed`:

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| User  | `demo@retain.app`  | `Demo@123`  |
| Admin | `admin@retain.app` | `Admin@123` |

In development, the sign-in page has buttons that fill these in.

### Seeding a real database

With `MONGO_URI` set in `backend/.env`:

```bash
npm run seed         # adds demo users, categories, budgets and expenses
npm run seed:reset   # wipes the database first, then seeds
```

## Environment variables

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `PORT` | Port to listen on (default `5000`; Render sets this automatically) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string (required in production) |
| `JWT_SECRET` | Secret used to sign tokens (required in production) |
| `JWT_EXPIRES_IN` | Token lifetime, e.g. `7d` |
| `CLIENT_URL` | Comma-separated frontend URLs allowed by CORS |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional admin account created on startup |
| `SEED_DEMO_DATA` | `true` to add demo data when the database is empty |

**Frontend (`frontend/.env`)**

| Variable | Description |
|---|---|
| `VITE_API_URL` | API base URL including `/api` (leave empty in development) |
| `VITE_CURRENCY` | Currency code for displaying amounts (default `USD`) |
| `VITE_SHOW_DEMO_ACCOUNTS` | `true` to show the demo account buttons in production |

## API reference

All endpoints are under `/api`. Endpoints marked 🔒 need an `Authorization: Bearer <token>` header; 🛡️ means admin only. Errors have the shape `{ "message": string, "details"?: [{ "field", "message" }] }`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/auth/register` | Create a user account → `{ token, user }` |
| POST | `/auth/login` | Sign in → `{ token, user }` |
| GET | `/auth/me` 🔒 | Current user |
| GET | `/dashboard?month=YYYY-MM` 🔒 | All dashboard data for a month |
| GET | `/expenses` 🔒 | List own expenses. Query: `search`, `category`, `paymentMethod`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy` (`date`/`amount`/`title`/`createdAt`), `order`, `page`, `limit` |
| POST | `/expenses` 🔒 | Create an expense |
| GET / PUT / DELETE | `/expenses/:id` 🔒 | Read, update or delete an own expense |
| GET | `/budgets` 🔒 | Budget history with spending status |
| GET / PUT / DELETE | `/budgets/:month` 🔒 | Read, set (`{ amount }`) or remove a month's budget |
| GET | `/categories` 🔒 | All categories |
| GET | `/categories/stats` 🔒🛡️ | Categories with usage counts and totals |
| POST | `/categories` 🔒🛡️ | Create a category (`{ name, color?, description? }`) |
| PUT / DELETE | `/categories/:id` 🔒🛡️ | Update or delete a category (expenses move to Uncategorized) |
| GET | `/admin/insights` 🔒🛡️ | Platform-wide statistics |

## Deployment (MongoDB Atlas + Render)

1. **Database:** create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas). Then:
   - add a database user
   - under **Network Access**, allow `0.0.0.0/0` (Render's IP addresses change)
   - copy the connection string
2. **Push this project to GitHub.**
3. **Render:** choose **New → Blueprint** and select the repository. `render.yaml` creates two services:
   - `retain-api`, the Express API
   - `retain-web`, the static React site
4. Fill in the values Render asks for:
   - `retain-api`:
     - `MONGO_URI`: your Atlas connection string
     - `CLIENT_URL`: the `retain-web` URL, e.g. `https://retain-web.onrender.com`
     - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: your administrator account
   - `retain-web`:
     - `VITE_API_URL`: the `retain-api` URL followed by `/api`, e.g. `https://retain-api.onrender.com/api`
5. After the first deploy, redeploy `retain-web` if you changed `VITE_API_URL`, because Vite bakes it in at build time.

To give reviewers ready-made data, set `SEED_DEMO_DATA=true` on the API and `VITE_SHOW_DEMO_ACCOUNTS=true` on the site, or run `npm run seed` locally against the Atlas database. Note that the demo passwords are public, so remove those accounts from any real deployment.

> Render's free plan puts the API to sleep after inactivity, so the first request after a while can take up to a minute.
