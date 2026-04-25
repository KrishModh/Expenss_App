# Expense Tracker Web Application

Full-stack expense tracker built with React, Vite, Node.js, Express, MongoDB, JWT authentication, and Google OAuth email verification.

## Setup

1. Copy environment files:
   - `backend/.env.example` to `backend/.env`
   - `frontend/.env.example` to `frontend/.env`
2. Fill every environment variable with your local or deployment values.
3. Install dependencies:
   - `cd backend && npm install`
   - `cd frontend && npm install`
4. Start development servers:
   - Backend: `npm run dev`
   - Frontend: `npm run dev`

## Environment Variables

Backend:
- `PORT`
- `MONGO_URI`
- `JWT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLIENT_URL`

Frontend:
- `VITE_API_URL`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_CURRENCY`

## Features

- Google OAuth email verification during signup
- Username/password login with JWT-protected REST APIs
- Unique username checks
- Expense and income CRUD
- Category/date filters
- Dashboard totals, charts, and recent transactions
- INR currency formatting with Indian number grouping
- Responsive modern UI with dark mode
- Secure password generation
- CSV export for expenses
