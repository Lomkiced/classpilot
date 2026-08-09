# ClassPilot

ClassPilot is a premium, AI-powered Class Management System built for modern educators. It streamlines attendance tracking, gradebook management, lesson planning, and student remarks.

## Tech Stack
- **Framework:** Next.js 16 (App Router)
- **Database:** PostgreSQL (via Supabase)
- **ORM:** Prisma
- **Auth & Storage:** Supabase
- **Styling:** Tailwind CSS v4, Radix UI (Shadcn)
- **AI Integration:** Anthropic Claude (Lesson Plan Extraction)

## Environment Variables
Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Prisma Database Connections (Supabase Postgres)
# Transactional connection for Prisma Client
DATABASE_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# Direct connection for Prisma Migrations
DIRECT_URL="postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"

# Anthropic AI
ANTHROPIC_API_KEY=your_anthropic_api_key
```

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

3. Seed the database with sample grading scales:
   ```bash
   npx prisma db seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment on Vercel

ClassPilot is optimized for Vercel deployment.

1. **Connect GitHub:** Push your code to a GitHub repository and connect it to a new Vercel project.
2. **Environment Variables:** In your Vercel project settings, add all the variables from your `.env.local` file.
3. **Build Command:** Vercel will automatically detect Next.js. We've included a `"postinstall": "prisma generate"` script in `package.json` to ensure the Prisma Client is built correctly during deployment.
4. **Run Production Migrations:** 
   Once the database is provisioned in production, run the migration command locally against the production `DIRECT_URL` (temporarily replace it in your `.env` or use a CLI flag):
   ```bash
   npx prisma migrate deploy
   ```
   *Note: Do NOT use `migrate dev` in production.*

## Features
- **Dashboard:** At-a-glance metrics for total classes, students, pending scores, and recent activity.
- **Classes:** Comprehensive student roster management.
- **Attendance:** Daily attendance tracking with bulk actions and PDF report exports.
- **Gradebook:** Dynamic spreadsheet-like gradebook with automatic percentage calculations and TanStack Query optimistic updates.
- **Lesson Plans:** AI-powered extraction of uploaded lesson plans (Word, PDF, TXT).
- **Remarks:** Generate automated student remarks based on gradebook performance.
- **Audit Logs:** Track all system actions for security and review.
