# ClassPilot — System Architecture

## 1. Top-Level System Overview
ClassPilot is built on a modern, React-centric full-stack architecture leveraging **Next.js 16** (App Router) to deliver a seamless, fast, and secure experience for teachers. It operates as a server-driven application where heavy lifting (database queries, AI processing, file parsing) occurs securely on the server via **Server Actions**, minimizing the client bundle size and maximizing performance.

## 2. Tech Stack Core
- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI & Components:** React 19, `@base-ui/react` (headless accessible components), Tailwind CSS v4, `lucide-react`
- **State Management:** `zustand` (for lightweight client-side state) & URL search params
- **Database & ORM:** PostgreSQL (Supabase), Prisma ORM (v7) with `@prisma/adapter-pg`
- **Validation:** `zod` and `@hookform/resolvers`
- **AI & Processing:** `@anthropic-ai/sdk` (Claude), `mammoth` (DOCX parsing), `pdf-parse` (PDF parsing)

## 3. Architecture Patterns & Data Flow
ClassPilot uses the **Server-Action-First** pattern:
1. **Client Layer (`src/components/`, `src/app/`)**: 
   - Uses Server Components by default to stream HTML.
   - Client Components (`"use client"`) are used strictly at the leaves of the render tree for interactivity (e.g., forms, dialogs, dropdowns).
2. **Server Action Layer (`src/server/actions/`)**:
   - Replaces traditional REST APIs.
   - All mutations (creating plans, uploading files, grading) call async Server Actions directly.
   - Actions validate input using Zod before interacting with the database.
3. **Data Access Layer (`src/generated/prisma/`)**:
   - Prisma acts as the typed ORM layer. It is generated into a custom output directory to maintain clean module boundaries and avoid edge-runtime conflicts.
4. **Database Layer (Supabase)**:
   - Supabase PostgreSQL manages relational data.
   - Supabase Storage manages uploaded raw lesson plan files securely.

## 4. Key Implementation: AI Auto-Structuring Pipeline
To prevent users from manually typing lengthy lesson plans, the system features an AI-driven extraction pipeline:
- **Input**: User uploads `.docx`, `.pdf`, `.md`, or `.txt`.
- **Parse**: Server Action reads the file as a buffer, passing it to `mammoth` or `pdf-parse` to extract raw text safely without executing macros.
- **Structure**: The raw text is streamed to Anthropic's Claude API with a strict system prompt to map the raw content into structured JSON (`Title`, `Objectives`, `Materials`, `Procedure`, `Assessment`).
- **Persistence**: Structured data is saved via Prisma, original file pushed to Supabase Storage, and the client UI is refreshed via `revalidatePath`.
