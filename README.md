# Retain

Retain is a personal expense and monthly budget manager. Users record their expenses, set a budget for each month, and see how their spending compares. An administrator manages expense categories and sees platform-wide insights.

## Live demo

- [Live app](https://retain-web-52w2.onrender.com)
- [Test API](https://retain-api-bfzi.onrender.com/api/health)

| Role  | Email            | Password  | Notes |
|-------|------------------|-----------|-------|
| User  | demo@retain.app  | Demo@123  | Comes with sample expenses and budgets |
| Admin | admin@retain.app | Admin@123 | Category management and platform insights |

You can also sign up for a new account, which starts empty.

The API runs on Render's free plan, which goes to sleep after 15 minutes without traffic. The first request after a quiet period can take up to a minute while it wakes up.

## Features

- Sign up, sign in and sign out, with protected pages for signed-in users and an admin-only area
- Add, edit, and delete personal expenses (title, amount, category, date, payment method, notes)
- Search, filter (category, payment method, date range, amount range), sort, and paginate expenses
- A monthly budget with a status of within, approaching (80% or more), or over budget
- A dashboard with the month's spending, remaining budget, highest expense, a category breakdown, daily and 6-month spending charts, and recent expenses
- Admin category management (deleting a category moves its expenses to Uncategorized) and platform insights
- Responsive layout for phones, tablets and desktops, with a dark mode

Amounts are shown in US dollars (USD).

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Material UI, React Router, Redux Toolkit (with RTK Query), Recharts, Axios |
| Backend | Node.js, Express 5, Mongoose, Zod, JSON Web Tokens, bcrypt |
| Database | MongoDB (MongoDB Atlas in production) |

Authentication state and protected routes use React Context (`frontend/src/context/AuthContext.tsx`). Expense search, filtering, sorting, and pagination state lives in Redux (`frontend/src/store/expenseFiltersSlice.ts`).

## Project structure

- `frontend/` - the React application
- `backend/` - the REST API, database models, and seed script
- `render.yaml` - deployment configuration for Render

## Running it locally

You need Node.js 20 or newer. A MongoDB server is optional for local development.

Start the API:

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API runs on http://localhost:5000. If `MONGO_URI` in `backend/.env` is left empty, the API starts a temporary in-memory MongoDB, so no database setup is needed. It downloads MongoDB (about 100 MB) the first time, and the data is lost when the server stops. To keep data, set `MONGO_URI` to a MongoDB connection string.

Start the frontend in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and sign up, or use the demo accounts listed above. The API creates them on startup if they don't exist yet. The demo user has sample expenses and budgets; a new sign-up starts empty.

## Environment variables

Backend (`backend/.env`):

| Variable | Description |
|---|---|
| `PORT` | Port for the API (default 5000; Render sets it automatically) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string (required in production) |
| `JWT_SECRET` | Secret for signing tokens (required in production) |
| `JWT_EXPIRES_IN` | How long a login lasts, e.g. `7d` |
| `CLIENT_URL` | Frontend URL(s) allowed by CORS, comma-separated, no trailing slash |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional extra admin account created on startup |

Frontend (`frontend/.env`):

| Variable | Description |
|---|---|
| `VITE_API_URL` | API address ending in `/api` (leave empty in development) |
| `VITE_CURRENCY` | Currency code for amounts (default USD) |
| `VITE_SHOW_DEMO_ACCOUNTS` | `true` to show demo login buttons on the sign-in page |

## API reference

Base URL: https://retain-api-bfzi.onrender.com/api

Endpoints marked User or Admin need an `Authorization: Bearer <token>` header, using the token returned by register or login. Errors are returned as `{ "message": "...", "details": [...] }`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Health check |
| POST | `/auth/register` | Public | Create an account, returns `{ token, user }` |
| POST | `/auth/login` | Public | Sign in, returns `{ token, user }` |
| GET | `/auth/me` | User | The signed-in user |
| GET | `/dashboard?month=YYYY-MM` | User | Dashboard data for a month |
| GET | `/expenses` | User | Own expenses, with filters (see below) |
| POST | `/expenses` | User | Create an expense |
| GET | `/expenses/:id` | User | Get one own expense |
| PUT | `/expenses/:id` | User | Update one own expense |
| DELETE | `/expenses/:id` | User | Delete one own expense |
| GET | `/budgets` | User | Budget history with spending status |
| GET | `/budgets/:month` | User | Budget summary for a month |
| PUT | `/budgets/:month` | User | Set a month's budget, body `{ "amount": 1200 }` |
| DELETE | `/budgets/:month` | User | Remove a month's budget |
| GET | `/categories` | User | All categories |
| GET | `/categories/stats` | Admin | Categories with usage counts and totals |
| POST | `/categories` | Admin | Create a category |
| PUT | `/categories/:id` | Admin | Update a category |
| DELETE | `/categories/:id` | Admin | Delete a category (expenses move to Uncategorized) |
| GET | `/admin/insights` | Admin | Platform-wide insights |

`GET /expenses` accepts `search`, `category`, `paymentMethod`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy` (`date`, `amount`, `title`, `createdAt`), `order` (`asc`, `desc`), `page`, and `limit`.

Users can only read and change their own expenses and budgets; requests for another user's data return 404. Admin endpoints return 403 for regular users.

## Deployment

| Part | Host | Notes |
|---|---|---|
| Frontend | Render (static site) | Static Vite build |
| API | Render (free web service) | Node and Express |
| Database | MongoDB Atlas (free cluster) | Allow access from `0.0.0.0/0` in the IP access list |

Both Render services are defined in `render.yaml`. In Render, choose New, then Blueprint, and select this repository. It creates:

| Service | Root directory | Build command | Start / publish | Environment |
|---|---|---|---|---|
| `retain-api` | `backend` | `npm ci --omit=dev` | `npm start`, health check `/api/health` | `MONGO_URI`, `JWT_SECRET` (generated), `CLIENT_URL` (the frontend URL, no trailing slash) |
| `retain-web` | `frontend` | `npm ci && npm run build` | publishes `dist`, rewrites all paths to `index.html` | `VITE_API_URL` (the API address ending in `/api`) |

The demo accounts are created when the API starts, so no separate seed step is needed. `VITE_API_URL` is built into the frontend, so redeploy `retain-web` after changing it. The rewrite rule makes page refreshes on routes like `/expenses` work.
