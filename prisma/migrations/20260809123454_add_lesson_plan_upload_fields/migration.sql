-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUAL', 'UPLOADED');

-- CreateEnum
CREATE TYPE "ExtractionStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- AlterTable
ALTER TABLE "lesson_plans" ADD COLUMN     "extractionStatus" "ExtractionStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN     "sourceFileName" TEXT,
ADD COLUMN     "sourceFileUrl" TEXT,
ADD COLUMN     "sourceType" "SourceType" NOT NULL DEFAULT 'MANUAL';
