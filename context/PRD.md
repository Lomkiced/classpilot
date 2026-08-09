# ClassPilot — Project Requirements Document (PRD)

## 1. Project Scope & Goals
ClassPilot is an advanced, specialized management system designed exclusively for teachers. The goal is to reduce administrative overhead and streamline the workflow of managing multiple classes, students, grades, and lesson plans, integrating AI seamlessly to assist rather than replace the teacher's workflow.

## 2. Minimum Viable Product (MVP) Features
- **Dashboard**: High-level metrics, upcoming assessments, and a chronological activity feed.
- **Class & Student Management**: Ability to create class groups (e.g., "P1 Math") and manage student rosters.
- **Configurable Grading Scales**: Thai grading requirements vary; the app must support dynamic Grade Bands (e.g., 0-49=F, 80-100=A) that the teacher configures.
- **Gradebook**: A spreadsheet-like view to enter scores for assessments and automatically calculate averages and grade bands.
- **AI Lesson Plan Management**:
  - Ability to manually create structured lesson plans.
  - Ability to drag-and-drop AI-generated raw files (PDF/DOCX/TXT) and have the system automatically structure them into database fields.
- **Remarks & Reporting**: Auto-suggest remarks based on student performance in the Gradebook.

## 3. Out of Scope (For Now)
- Student-facing portals or logins.
- Parent communication modules.
- Complex school-wide administrative tracking (this is a single-teacher tool).

## 4. Success Metrics
- **Performance**: Near-instant navigation between routes using Next.js Turbopack.
- **Accuracy**: AI extraction must not hallucinate or omit critical data from uploaded lesson plans. Graceful fallbacks must exist if extraction fails.
- **UX**: Zero hydration errors, flawless accessibility (via Base UI), and a "wow factor" UI that breaks away from traditional boring school software.
