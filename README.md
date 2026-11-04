# Sober Hub — Full-Stack Web Application

Sober Hub is a youth-focused, substance-free support and productivity platform. This build contains the frontend, Vercel serverless API, MySQL persistence, role-based authentication, email verification, password recovery and membership checkout.

## Core flows
- Member/Staff signup with role tabs
- Staff signup protected by `STAFF_SIGNUP_CODE`
- Email confirmation before login
- Bcrypt password hashing
- HTTP-only JWT session cookie
- Personalised member dashboard
- Profile, check-in, community, mentor and emergency support
- Staff portal for members and support requests
- Membership selection: R50 / R75 / R100
- Demo checkout or Stripe test Checkout
- Payment history and 30-day membership activation

## Environment
Backend environment variables and deployment steps are in `backend/.env.example` and `backend/DEPLOYMENT.md`. The production database is MySQL.

## Run locally
Install backend dependencies with `npm --prefix backend install`, then run `npm --prefix backend run dev`. Open `http://localhost:3000`. With MySQL variables configured, the backend creates the database and tables automatically if they do not exist. Without MySQL variables, the app uses its built-in demo API; demo accounts are `member@soberhub.demo` / `Member123!` and `staff@soberhub.demo` / `Staff123!`. Demo data is stored in a browser cookie and is for local testing only.

## Project folders
- `frontend/` contains the website pages, assets, and preserved reference pages.
- `backend/` contains the API, database schema, server, dependencies, and deployment configuration.
