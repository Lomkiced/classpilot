# ClassPilot — Project Requirements Document (PRD)

## 1. Project Scope & Goals
ClassPilot is an advanced, specialized management system designed exclusively for teachers. The goal is to reduce administrative overhead and streamline the workflow of managing multiple classes, students, grades, and lesson plans, integrating AI seamlessly to assist rather than replace the teacher's workflow.

## 2. Minimum Viable Product (MVP) Features
- **Dashboard**: High-level metrics, upcoming assessments, and a chronological activity feed.
- **Class & Student Management**: Ability to create class groups (e.g., "P1 Math") and manage student rosters.
- **Configurable Grading Scales**: Thai grading requirements vary; the app must support dynamic Grade Bands (e.g., 0-49=F, 80-100=A) that the teacher configures.
- **Gradebook & Assessment Architecture**:
  - High-performance, spreadsheet-like interactive matrix supporting 100+ assessments per class without UI lag.
  - Multi-Term Partitioning: Full support for standard 2-term academic school years (Term 1, Term 2, Cumulative Year view).
  - Assessment Categorization & Weighting (Quiz, Activity, Homework, Participation, Midterm, Final).
  - Dynamic grade computation per Term and Year-End cumulative averages with dynamic Grade Band resolution.
  - Gradebook filtering, collapsible category groupings, and column sorting/virtualization.
- **AI Lesson Plan Management**:
  - Ability to manually create structured lesson plans.
  - Ability to drag-and-drop AI-generated raw files (PDF/DOCX/TXT) and have the system automatically structure them into database fields.
- **Remarks & Reporting**: Auto-suggest remarks based on student performance in the Gradebook per Term or Academic Year.

## 3. Out of Scope (For Now)
- Student-facing portals or logins.
- Parent communication modules.
- Complex school-wide administrative tracking (this is a single-teacher tool).

## 4. Success Metrics
- **Performance**: Sub-100ms UI interaction latency in the Gradebook even with 50+ students and 100+ assessments via virtualized rendering and granular cell updates.
- **Data Integrity**: Accurate mathematical grade aggregation across terms with custom weights or raw point totals.
- **Accuracy**: AI extraction must not hallucinate or omit critical data from uploaded lesson plans. Graceful fallbacks must exist if extraction fails.
- **UX**: Zero hydration errors, flawless accessibility (via Base UI), keyboard navigation for fast grade entry, and a "wow factor" UI that breaks away from traditional boring school software.
