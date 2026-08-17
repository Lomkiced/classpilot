# ClassPilot — System Architecture

## 1. Top-Level System Overview
ClassPilot is built on a modern, React-centric full-stack architecture leveraging **Next.js 16** (App Router) to deliver a seamless, fast, and secure experience for teachers. It operates as a server-driven application where heavy lifting (database queries, AI processing, file parsing) occurs securely on the server via **Server Actions**, minimizing the client bundle size and maximizing performance.

## 2. Tech Stack Core
- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI & Components:** React 19, `@base-ui/react` (headless accessible components), Tailwind CSS v4, `lucide-react`
- **State Management:** `zustand` (for lightweight client-side state), `@tanstack/react-query` (for server state on interactive pages), & URL search params
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

## 4. Authentication & Authorization
Authentication is centralized through `src/lib/auth.ts` using React's `cache()` function:
- **`getAuthenticatedUser()`**: Returns the Supabase user for the current request, cached and deduplicated across the entire request lifecycle (middleware → layout → page → server action).
- **`requireTeacherId()`**: Convenience wrapper returning just the user ID. Used in all server actions.
- **Rule**: Never call `supabase.auth.getUser()` directly in server actions — always import from `@/lib/auth`.

## 5. Data Fetching Patterns

### Server Components (SSR-First)
Pages fetch data in Server Components for fast initial paint. Data is passed as `initialData` to client-side TanStack Query hooks on interactive pages.

### TanStack Query (Client-Side for Interactive Pages)
High-interaction pages (Classes/Roster, Gradebook) use TanStack Query for:
- **Server-Side Hydration**: The server must fetch the initial dataset in `page.tsx` and pass it to the client components as `initialData` to eliminate client-side loading waterfalls (no loading spinners on initial load).
- **Optimistic mutations**: Instant UI updates before server confirmation.
- **Cache management**: Smart invalidation on mutations, configurable stale times.
- **Error rollback**: Automatic revert to previous state on mutation failure.

Pattern:
1. Server Component fetches initial data during SSR.
2. Client Component hydrates TanStack Query with `initialData` via custom hooks.
3. Mutations use optimistic updates — no `router.refresh()`.

### Query Parallelization
Independent database queries within a single server action are parallelized using `Promise.all()`. Example:
```typescript
const [students, assessments, scores, gradingScale] = await Promise.all([...]);
```

### Real-Time Updates
When live collaboration or immediate consistency across multiple clients is necessary, the architecture supports **Supabase Realtime (WebSockets)**.
- Use `supabase.channel` to subscribe to database changes (e.g., `INSERT`, `UPDATE`, `DELETE`).
- Invalidate specific TanStack Query keys when a real-time payload is received, rather than manually patching complex states, unless patching is trivial and performance-critical.

## 6. Key Implementation: AI Auto-Structuring Pipeline
To prevent users from manually typing lengthy lesson plans, the system features an AI-driven extraction pipeline:
- **Input**: User uploads `.docx`, `.pdf`, `.md`, or `.txt`.
- **Parse**: Server Action reads the file as a buffer, passing it to `mammoth` or `pdf-parse` to extract raw text safely without executing macros.
- **Structure**: The raw text is streamed to Anthropic's Claude API with a strict system prompt to map the raw content into structured JSON (`Title`, `Objectives`, `Materials`, `Procedure`, `Assessment`).
- **Persistence**: Structured data is saved via Prisma, original file pushed to Supabase Storage, and the client UI is refreshed via `revalidatePath`.

## 7. Gradebook & Multi-Term Architecture
To handle large assessment volumes (e.g. 50–100+ assessments per school year across 2 distinct terms):
- **Term-Scoped Queries & Caching**: TanStack Query keys are scoped by class and term: `["gradebook", classGroupId, term]`. Queries fetch only active term assessments by default, drastically reducing initial payload and memory footprint.
- **Cumulative Mode**: When "All Terms / Full Year" view is selected, queries aggregate Term 1 and Term 2 data, computing weighted term averages alongside yearly final grades.
- **Virtualized High-Density Grid**: For high column counts, virtualized row and column windowing via `@tanstack/react-virtual` renders only visible cells within the viewport, maintaining 60fps scrolling.
- **Collapsible Category Columns**: Assessments can be collapsed by `AssessmentType` (e.g. collapse 20 Quizzes into a single "Quiz Subtotal (35%)" column) to reduce visual clutter.
- **Granular Local State & Optimistic Debounce**: Grade inputs maintain localized state and commit optimistic updates on blur/enter with keyboard navigation (arrow keys, Tab, Enter) for frictionless grading.
