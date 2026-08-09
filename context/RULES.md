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
