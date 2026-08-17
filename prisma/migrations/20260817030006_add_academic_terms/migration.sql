-- CreateEnum
CREATE TYPE "AcademicTerm" AS ENUM ('TERM_1', 'TERM_2');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AssessmentType" ADD VALUE 'MIDTERM';
ALTER TYPE "AssessmentType" ADD VALUE 'FINAL';

-- DropIndex
DROP INDEX "assessments_classGroupId_idx";

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "term" "AcademicTerm" NOT NULL DEFAULT 'TERM_1',
ADD COLUMN     "weight" DOUBLE PRECISION DEFAULT 1.0;

-- CreateIndex
CREATE INDEX "assessments_classGroupId_term_date_idx" ON "assessments"("classGroupId", "term", "date");
