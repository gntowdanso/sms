# Deploying smsapp2025 to Vercel

Follow these steps to deploy this Next.js + Prisma app to Vercel.

## Prerequisites
- GitHub repo: gntowdanso/sms (this project lives in the `smsapp2025` folder)
- A Postgres database (Vercel Postgres, Neon, Supabase, RDS, etc.)

## 1) Import the GitHub repo
1. In Vercel, click "Add New Project" → Import your GitHub repository.
2. Root Directory: select `smsapp2025` (monorepo setup).
3. Framework Preset: Next.js.

## 2) Environment variables
Set in Project → Settings → Environment Variables for both Preview and Production:
- `DATABASE_URL` = your Prisma connection string.
  - If using Vercel Postgres, set `DATABASE_URL` to the value of `POSTGRES_PRISMA_URL` from the integration.

Notes:
- Use a pooled connection where possible (Vercel Postgres or providers with pooling) to avoid serverless connection limits.
- This project runs `prisma migrate deploy` during build, so the database must be reachable.

## 3) Build & Runtime settings
- Node.js version: 18.x or 20.x (Project → Settings → General)
- Install Command: default (Vercel will run `npm ci`)
- Build Command: `npm run build`
  - `prebuild`: `prisma generate`
  - `build`: `prisma migrate deploy && next build`
  - `postinstall`: `prisma generate`
- Output directory: default (Next.js)

## 4) Deploy
- Click Deploy and monitor logs for:
  - Prisma Generate
  - `prisma migrate deploy` applying migrations
  - Next.js build completion

## 5) Smoke test
Open your deployment URL and test key pages:
- `/dashboard`
- `/management/schools`, `/management/departments`, `/management/staff`
- `/student/student`, `/student/studentdetail?id=<id>`
- `/studentacademics/*`, `/finance/*`

## Troubleshooting
- Build fails with Prisma init or client errors:
  - We already use a lazy Prisma client (dynamic import) to avoid build-time issues.
  - Ensure `DATABASE_URL` is set for the environment being built (Preview/Prod).
- Connection timeouts/too many connections:
  - Prefer pooled Postgres. Reduce connection churn in heavy traffic.
- Migrations fail:
  - Confirm DB credentials and that the DB user can apply migrations.

## Optional: Local verification
```pwsh
# install deps
npm ci

# check Prisma client & build
npm run build

# run locally (optional)
npm run start
```
