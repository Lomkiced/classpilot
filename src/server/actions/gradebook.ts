"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { createAssessmentSchema, updateAssessmentSchema, upsertScoreSchema, type CreateAssessmentInput, type UpdateAssessmentInput, type UpsertScoreInput } from "@/lib/validations/gradebook";
import { getActiveGradingScale } from "@/server/actions/settings";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getGradebookData(classGroupId: string) {
  const teacherId = await requireAuth();

  // Verify Ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
    include: {
      students: {
        include: { student: true },
        orderBy: { student: { fullName: "asc" } },
      }
    }
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  // 1. Fetch all students in this class
  const classGroupStudents = await prisma.classGroupStudent.findMany({
    where: { classGroupId },
    include: { student: true },
    orderBy: { student: { fullName: "asc" } },
  });

  const students = classGroupStudents.map(cgs => cgs.student);

  // 2. Fetch all assessments for this class
  const assessments = await prisma.assessment.findMany({
    where: { classGroupId },
    orderBy: { date: "asc" },
  });

  // 3. Fetch all scores for these assessments
  const assessmentIds = assessments.map(a => a.id);
  const scores = await prisma.score.findMany({
    where: { assessmentId: { in: assessmentIds } },
  });

  const activeGradingScale = await getActiveGradingScale();

  // 4. Shape the payload for the grid
  return {
    students,
    assessments,
    scores,
    activeGradingScale
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createAssessment(data: CreateAssessmentInput) {
  const teacherId = await requireAuth();
  const parsed = createAssessmentSchema.parse(data);

  // Verify Ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  const assessment = await prisma.assessment.create({
    data: {
      classGroupId: parsed.classGroupId,
      name: parsed.name,
      type: parsed.type,
      maxScore: parsed.maxScore,
      date: parsed.date,
    },
  });

  revalidatePath("/gradebook");
  return { success: true, data: assessment };
}

export async function upsertScore(data: UpsertScoreInput) {
  const teacherId = await requireAuth();
  const parsed = upsertScoreSchema.parse(data);

  // Deep Auth Check: Ensure the assessment belongs to a class owned by the teacher
  const assessment = await prisma.assessment.findFirst({
    where: {
      id: parsed.assessmentId,
      classGroup: { teacherId },
    },
  });

  if (!assessment) {
    throw new Error("Assessment not found or unauthorized");
  }

  const score = await prisma.score.upsert({
    where: {
      assessmentId_studentId: {
        assessmentId: parsed.assessmentId,
        studentId: parsed.studentId,
      },
    },
    update: {
      value: parsed.value,
    },
    create: {
      assessmentId: parsed.assessmentId,
      studentId: parsed.studentId,
      value: parsed.value,
    },
  });

  // Don't revalidate path here — we rely on TanStack Query cache!
  return { success: true, data: score };
}

export async function updateAssessment(id: string, data: UpdateAssessmentInput) {
  const teacherId = await requireAuth();
  const parsed = updateAssessmentSchema.parse(data);

  // Deep auth check
  const existing = await prisma.assessment.findFirst({
    where: {
      id,
      classGroup: { teacherId },
    },
  });

  if (!existing) {
    throw new Error("Assessment not found or unauthorized");
  }

  const updated = await prisma.assessment.update({
    where: { id },
    data: {
      name: parsed.name,
      type: parsed.type,
      maxScore: parsed.maxScore,
      date: parsed.date,
    },
  });

  // Revalidate cache instead of relying solely on TanStack since this changes columns
  revalidatePath("/gradebook");
  return { success: true, data: updated };
}

export async function deleteAssessment(id: string) {
  const teacherId = await requireAuth();

  // Deep auth check
  const existing = await prisma.assessment.findFirst({
    where: {
      id,
      classGroup: { teacherId },
    },
  });

  if (!existing) {
    throw new Error("Assessment not found or unauthorized");
  }

  // Deleting the assessment will cascade delete the scores based on the Prisma schema 
  // (Assuming onDelete: Cascade is configured on the Score model for assessmentId, 
  // but Prisma handles it if specified or we can just delete directly)
  await prisma.assessment.delete({
    where: { id },
  });

  revalidatePath("/gradebook");
  return { success: true };
}
