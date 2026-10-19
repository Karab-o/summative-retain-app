# Retain - Expense & Budget Manager

I built Retain as a web app for keeping track of personal expenses and staying within a monthly budget. You log your expenses, set a budget for each month and get a warning when you are close to it or over it. Admins manage the expense categories and can see overall stats for the platform.

## Live app

- App: https://retain-web-52w2.onrender.com
- API: https://retain-api-bfzi.onrender.com/api (health check: https://retain-api-bfzi.onrender.com/api/health)

You can try it with these demo accounts:

| Role  | Email            | Password  |
|-------|------------------|-----------|
| User  | demo@retain.app  | Demo@123  |
| Admin | admin@retain.app | Admin@123 |

You can also sign up with your own account. I deployed the backend on Render's free plan, so it goes to sleep when nobody is using it. If the app seems slow at first, give it up to a minute to wake up.

## Tech stack

Frontend: React 19, TypeScript, Vite, Material UI, Redux Toolkit and RTK Query, React Context, React Router, Recharts

Backend: Node.js, Express 5, MongoDB with Mongoose, JWT, bcrypt, Zod

Hosting: Render for the frontend and backend, MongoDB Atlas for the database

## Features

### For users

- You can sign up, sign in and sign out, and you stay signed in after refreshing the page.
- The dashboard shows, for each month:
  - total spent, budget remaining, number of expenses and average expense
  - a budget progress bar, with a warning at 80% of the budget and an alert when you go over it
  - charts for spending by category, daily spending and the last 6 months
  - your biggest expense of the month and your latest expenses
- On the expenses page you can:
  - add, edit and delete expenses (title, amount, category, date, payment method and notes)
  - search by title or notes
  - filter by category, payment method, date range and amount range
  - sort by date, title or amount, with pagination
- On the budgets page you can set, change or remove the budget for any month. Each month shows whether you are on track, close to the limit or over budget.
- The app works on phones, tablets and desktops, and has a dark mode.

### For admins

- The insights page shows:
  - total users, total expenses and total amount recorded
  - expenses recorded this month
  - spending per category
  - the most and least used categories
  - recent expenses and newest users
- On the categories page you can create, rename, recolour and delete categories. When you delete a category, its expenses are moved to "Uncategorized" so no one loses data. The "Uncategorized" category itself can't be deleted or renamed.

### Security

- I hash passwords with bcrypt, and the API never sends them back.
- Users can only see and change their own expenses and budgets. If you request someone else's data, the API returns 404.
- Admin endpoints check the user's role on the server, not only in the UI.
- Login and sign-up are rate limited, and I validate all input with Zod.

## How I managed state

- I used React Context for authentication (session, login, logout, roles and protected routes): `frontend/src/context/AuthContext.tsx`. The route guards in `components/layout/RouteGuards.tsx` read from it.
- I used a Redux Toolkit slice for expense search, filters, sorting and pagination: `frontend/src/store/expenseFiltersSlice.ts`.
- I used RTK Query to fetch and cache data from the API: `frontend/src/store/api.ts`.
- The light/dark theme setting is a small Redux slice: `frontend/src/store/uiSlice.ts`.

## Project structure

```
backend/
  src/
    config/        env variables and database connection
    controllers/   auth, expenses, budgets, categories, dashboard, admin
    middleware/    JWT auth, role checks, error handling
    models/        User, Expense, Budget, Category
    routes/        all API routes
    services/      shared logic (monthly spending, seeding)
    scripts/       seed script
frontend/
  src/
    api/           axios client and TypeScript types for API responses
    context/       AuthContext
    store/         Redux store, slices and RTK Query endpoints
    components/    layout, dialogs, charts and shared UI
    pages/         dashboard, expenses, budgets, admin and auth pages
    theme/         Material UI theme
    utils/         formatting helpers
render.yaml        Render deployment config
```

## Running it locally

You need Node.js 20 or newer.

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The API runs on http://localhost:5000.

If you leave `MONGO_URI` empty in `.env`, the backend starts a temporary in-memory MongoDB with demo data (the same demo accounts as above). The first time, it downloads MongoDB, which is about 100 MB, and the data is lost when you stop the server. If you want your data to stay, put a MongoDB Atlas connection string in `MONGO_URI`.

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open http://localhost:5173. In development Vite forwards `/api` requests to the backend, so you don't need to set anything else up.

### Adding demo data to a real database

Once `MONGO_URI` is set in `backend/.env`, run:

```bash
npm run seed
```

If you want to clear the database first, use `npm run seed:reset` instead.

## Environment variables

Backend (`backend/.env`):

| Variable | What it's for |
|---|---|
| `PORT` | Port for the API (default 5000, Render sets it automatically) |
| `NODE_ENV` | `development` or `production` |
| `MONGO_URI` | MongoDB connection string (required in production) |
| `JWT_SECRET` | Secret for signing tokens (required in production) |
| `JWT_EXPIRES_IN` | How long a login lasts, e.g. `7d` |
| `CLIENT_URL` | Frontend URL(s) allowed by CORS, separated by commas |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Optional admin account created when the server starts |
| `SEED_DEMO_DATA` | Set to `true` to add demo data when the database is empty |

Frontend (`frontend/.env`):

| Variable | What it's for |
|---|---|
| `VITE_API_URL` | API URL ending in `/api` (leave it empty in development) |
| `VITE_CURRENCY` | Currency used to show amounts (default USD) |
| `VITE_SHOW_DEMO_ACCOUNTS` | Set to `true` to show demo login buttons on the sign-in page |

## API

Base URL: https://retain-api-bfzi.onrender.com/api

For endpoints marked User or Admin, you need to send an `Authorization: Bearer <token>` header. You get the token from the register or login endpoint. Errors come back as `{ "message": "...", "details": [...] }`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/health` | Public | Check that the API is running |
| POST | `/auth/register` | Public | Create an account, returns `{ token, user }` |
| POST | `/auth/login` | Public | Log in, returns `{ token, user }` |
| GET | `/auth/me` | User | The logged-in user |
| GET | `/dashboard?month=YYYY-MM` | User | Dashboard data for one month |
| GET | `/expenses` | User | Your expenses (see query options below) |
| POST | `/expenses` | User | Add an expense |
| GET | `/expenses/:id` | User | One of your expenses |
| PUT | `/expenses/:id` | User | Update one of your expenses |
| DELETE | `/expenses/:id` | User | Delete one of your expenses |
| GET | `/budgets` | User | Your budgets with how much you spent |
| GET | `/budgets/:month` | User | Budget summary for one month |
| PUT | `/budgets/:month` | User | Set the budget for a month, body `{ "amount": 1200 }` |
| DELETE | `/budgets/:month` | User | Remove the budget for a month |
| GET | `/categories` | User | All categories |
| GET | `/categories/stats` | Admin | Categories with how often they are used |
| POST | `/categories` | Admin | Create a category |
| PUT | `/categories/:id` | Admin | Update a category |
| DELETE | `/categories/:id` | Admin | Delete a category (its expenses move to Uncategorized) |
| GET | `/admin/insights` | Admin | Stats for the whole platform |

You can use these query options with `GET /expenses`: `search`, `category`, `paymentMethod`, `startDate`, `endDate`, `minAmount`, `maxAmount`, `sortBy` (`date`, `amount`, `title` or `createdAt`), `order` (`asc` or `desc`), `page` and `limit`.

## Deployment

I deployed the app on Render using `render.yaml`, with the database on MongoDB Atlas. If you want to deploy your own copy:

1. Create a free cluster on MongoDB Atlas and add a database user. In the IP access list, allow `0.0.0.0/0`, because Render's IP addresses change. Copy the connection string.
2. Push the project to your own GitHub repository.
3. On Render, go to New, then Blueprint, and pick your repository. This creates two services: `retain-api` (the backend) and `retain-web` (the frontend).
4. Fill in the environment variables:
   - On `retain-api`: `MONGO_URI` (your Atlas connection string), `CLIENT_URL` (your retain-web URL), and `ADMIN_EMAIL` and `ADMIN_PASSWORD` for your admin account.
   - On `retain-web`: `VITE_API_URL` (your retain-api URL followed by `/api`).
5. If you change `VITE_API_URL` later, redeploy `retain-web`, because the value is built into the frontend.

To get the demo accounts on your deployment, set `SEED_DEMO_DATA=true` on the API or run `npm run seed` against your Atlas database. The demo passwords are public, so don't use them for real data.
