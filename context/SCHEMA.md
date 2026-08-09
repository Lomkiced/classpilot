# ClassPilot — Database Schema & Data Models

## 1. Overview
The database is powered by PostgreSQL hosted on Supabase, utilizing Prisma ORM for schema management and type generation. Prisma connects via the transaction connection pooler for runtime, and direct connection for migrations.

## 2. Entity Relationship Diagram (ERD) Summary

### Core Entities
- **Teacher**: The root entity, mapped 1:1 with Supabase Auth users. Owns ClassGroups and GradingScales.
- **Student**: Global to the teacher, can belong to multiple ClassGroups.
- **ClassGroup**: Represents a specific subject and grade (e.g., "P1 Math"). Contains Students (M:N via `ClassGroupStudent`), LessonPlans, Assessments, and Remarks.

### Academic Tracking
- **GradingScale & GradeBand**: Allows teachers to define dynamic grading rubrics (e.g., A = 80-100%).
- **Assessment & Score**: Assessments belong to a ClassGroup and have a max score. Scores are individual records linking a Student to an Assessment with a recorded value.
- **Remark**: End-of-period written comments for students, linking dynamically to GradeBands for context.

### Lesson Planning
- **LessonPlan**: Stores structured data (`objectives`, `procedure`, `materials`, etc.).
- Includes metadata for AI integration (`sourceType`, `sourceFileUrl`, `extractionStatus`).

## 3. Critical Enums
- **LessonPlanStatus**: `DRAFT`, `SUBMITTED`, `APPROVED`
- **SourceType**: `MANUAL` (created by hand), `UPLOADED` (AI-extracted from document)
- **ExtractionStatus**: `NOT_APPLICABLE`, `PENDING`, `SUCCESS`, `PARTIAL`, `FAILED`

## 4. Best Practices & Policies
- **Cascading Deletes**: `onDelete: Cascade` is heavily utilized to prevent orphan records. For example, deleting an `Assessment` automatically deletes all associated `Score` records. Deleting a `Student` removes their join table links.
- **UUIDs**: All primary keys are `String @default(uuid()) @db.Uuid`.
- **Prisma Output**: The Prisma client is generated into `../src/generated/prisma` to prevent module conflicts in Next.js Turbopack.
