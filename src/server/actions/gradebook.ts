"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createAssessmentSchema, updateAssessmentSchema, upsertScoreSchema, type CreateAssessmentInput, type UpdateAssessmentInput, type UpsertScoreInput } from "@/lib/validations/gradebook";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getGradebookData(classGroupId: string) {
  const teacherId = await requireTeacherId();

  // Verify Ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  // Parallelize all 4 independent queries — no duplicate student fetch
  const [students, assessments, scores, activeGradingScale] = await Promise.all([
    // Students for this class (single fetch, not duplicated)
    prisma.classGroupStudent.findMany({
      where: { classGroupId },
      include: { student: true },
      orderBy: { student: { fullName: "asc" } },
    }).then(records => records.map(cgs => cgs.student)),

    // Assessments for this class
    prisma.assessment.findMany({
      where: { classGroupId },
      orderBy: { date: "asc" },
    }),

    // All scores for assessments in this class (filtered server-side)
    prisma.score.findMany({
      where: {
        assessment: { classGroupId },
      },
    }),

    // Active grading scale — inlined to avoid separate requireAuth() call
    prisma.gradingScale.findFirst({
      where: { teacherId, isActive: true },
      include: {
        bands: {
          orderBy: { order: "asc" },
        },
      },
    }),
  ]);

  return {
    students,
    assessments,
    scores,
    activeGradingScale,
  };
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createAssessment(data: CreateAssessmentInput) {
  const teacherId = await requireTeacherId();
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
  const teacherId = await requireTeacherId();
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
  const teacherId = await requireTeacherId();
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
  const teacherId = await requireTeacherId();

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
