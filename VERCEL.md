Vercel deployment notes

Purpose
- Quick instructions to deploy this Next.js (App Router) app to Vercel using a GitHub repository.

Prerequisites
- Push this repository to GitHub (public or private).
- A Vercel account with access to the GitHub repo.
- Database reachable from Vercel (Postgres, etc.).

Required environment variables (add these in the Vercel project settings -> Environment Variables)
- DATABASE_URL  -> Postgres connection string used by Prisma at runtime (production DB)

Optional / common envs to check in your codebase
- Any env var with the prefix `NEXT_PUBLIC_` (these are read on the client)
- If you run migrations on deploy, you may also need a `SHADOW_DATABASE_URL` or dedicated migration database depending on your workflow.

Recommended Vercel settings
- Framework Preset: Next.js
- Install Command: npm ci
- Build Command: npm run build
- Output Directory: (leave empty) or `.next`

Prisma / Database migration notes
- This project uses Prisma. You must ensure the Prisma client is generated before the app runs on Vercel.
- Two common options:
  1) Run migrations outside Vercel (recommended):
     - Run locally or in a controlled CI: `npx prisma migrate deploy` to apply migrations to production DB, then `npx prisma generate`.
  2) Run migrations during Vercel build (risky for production):
     - Set the Build Command to: `npx prisma generate && npx prisma migrate deploy && npm run build`
     - Make sure `DATABASE_URL` is configured for the Build environment and the DB can accept connections from Vercel build workers.

Deploy flow (GitHub integration)
1) Push your branch to GitHub.
2) In Vercel dashboard, choose "Import Project" -> select GitHub -> pick this repository.
3) In the setup step, verify the Build Command and Environment Variables.
4) Create the project; Vercel will run the build and create a deployment.

Post-deploy checks
- Go to the Deployment URL and exercise the management pages that use the database.
- If you see Prisma errors about migrations or missing client, run migrations manually and re-deploy.

Security
- Never commit secrets (like DATABASE_URL) to the repository. Use Vercel dashboard to store them.

Extras
- If you want me to attempt a CLI deployment from this machine, I can run it but I will need a Vercel token (or interactive login). Otherwise, connecting via GitHub is the simplest and safest flow.

Contact
- After connecting to GitHub, paste the Vercel project link and I can help verify environment settings and the first deployment logs.
