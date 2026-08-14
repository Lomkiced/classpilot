# ClassPilot — Coding & Implementation Rules

## 1. SOLID Principles
- **Single Responsibility**: Each file should do one thing well. A Server Action file should only handle database mutations. A UI component should only handle rendering.
- **Open/Closed**: Components should be designed to be extended (e.g., using `children` and `className` props) rather than modified with endless boolean flags.

## 2. DRY (Don't Repeat Yourself)
- If a utility function, UI component, or complex Prisma query is repeated **4x or more**, it must be extracted into a shared `src/lib/` or `src/components/` module.
- Do not abstract prematurely; wait for the 4x threshold to avoid creating overly rigid abstractions early in development.

## 3. KISS (Keep It Simple, Stupid)
- Avoid over-engineering. We do not need Redux, GraphQL, or microservices. 
- Use standard Next.js Server Components and Server Actions.
- If a feature can be accomplished with standard HTML/CSS and minimal JS, prefer that over importing a heavy third-party library.

## 4. Component Rules
- Default all Next.js App Router files to **Server Components**.
- Only add `"use client"` when hooks (`useState`, `useEffect`, `useForm`) or event listeners (`onClick`) are strictly necessary. Push the `"use client"` directive as far down the component tree as possible.
- Avoid nesting interactive client components unnecessarily. 

## 5. Error Handling & Server Actions
- Server Actions must wrap their database calls in `try/catch` blocks.
- Never throw raw database errors to the client.
- Return structured responses: `return { success: true, data }` or `return { success: false, error: "Friendly message" }`.
- Use `sonner` for toast notifications on the client side based on these responses.

## 6. Authentication Rule
- **Always** use `requireTeacherId()` or `getAuthenticatedUser()` from `@/lib/auth`.
- **Never** call `supabase.auth.getUser()` directly in server actions or utility files.
- These helpers use `React.cache()` to deduplicate auth calls within a single request, eliminating redundant Supabase network roundtrips.

## 7. Query Performance Rules
- **No N+1 Queries**: Never loop through an array and execute `await prisma...` inside the loop. Use `include` or parallelize with `Promise.all()` for independent queries.
- Independent database queries within a single server action **must** use `Promise.all()` for parallel execution. Sequential queries are only acceptable when one depends on the result of another.
- Use `prisma.model.count()` instead of `findMany().length` for counting records.
- Avoid duplicate queries — if you need data in multiple places within an action, fetch it once and pass it through.

## 8. Mutation & Real-Time Rules
- High-interaction pages (Classes/Roster, Gradebook, Attendance) **must** use TanStack Query with optimistic updates instead of `router.refresh()`.
- Low-interaction pages (Dashboard, Settings, Lesson Plans list) can continue using `revalidatePath()` for simplicity.
- Optimistic mutations must include `onError` rollback and `onSettled` invalidation for data consistency.

## 9. Frontend Performance Rules
- **Caching**: Ensure TanStack Query uses appropriate `staleTime` values (e.g., 5-15 minutes for non-volatile data) instead of the default 0 or aggressive 1-minute timers to prevent unnecessary refetches.
- **Virtualization & Memoization**: Use `@tanstack/react-virtual` and `React.memo()` for lists or grids exceeding 50 items to prevent the entire tree from re-rendering on optimistic updates.
