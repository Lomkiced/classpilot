"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { lessonPlanSchema, updateLessonPlanStatusSchema, type LessonPlanInput } from "@/lib/validations/lesson-plans";
import { LessonPlanStatus, ExtractionStatus, SourceType, Prisma } from "@/generated/prisma/client";
import { uploadLessonPlanFile } from "@/lib/supabase/storage";
import { extractTextFromFile } from "@/lib/lesson-plan-extraction/parse-file";
import { structureContentWithAI } from "@/lib/lesson-plan-extraction/structure-content";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getLessonPlans() {
  const teacherId = await requireAuth();

  return prisma.lessonPlan.findMany({
    where: {
      classGroup: { teacherId },
    },
    select: {
      id: true,
      title: true,
      status: true,
      month: true,
      createdAt: true,
      updatedAt: true,
      sourceType: true,
      extractionStatus: true,
      classGroup: {
        select: { name: true, gradeLevel: true }
      }
    },
    orderBy: [
      { month: "desc" },
      { createdAt: "desc" }
    ],
  });
}

export async function getLessonPlan(id: string) {
  const teacherId = await requireAuth();

  const plan = await prisma.lessonPlan.findFirst({
    where: { 
      id,
      classGroup: { teacherId } 
    },
    include: {
      classGroup: true
    }
  });

  if (!plan) throw new Error("Lesson plan not found or unauthorized");
  return plan;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createLessonPlan(data: LessonPlanInput) {
  const teacherId = await requireAuth();
  const parsed = lessonPlanSchema.parse(data);

  // Verify class ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.classGroupId, teacherId },
  });

  if (!classGroup) throw new Error("Class not found or unauthorized");

  const plan = await prisma.lessonPlan.create({
    data: {
      classGroupId: parsed.classGroupId,
      title: parsed.title,
      month: parsed.month,
      objectives: parsed.objectives,
      materials: parsed.materials,
      procedure: parsed.procedure as Prisma.JsonArray,
      assessmentNotes: parsed.assessmentNotes,
      additionalNotes: parsed.additionalNotes,
      status: LessonPlanStatus.DRAFT,
    },
  });

  revalidatePath("/lesson-plans");
  return { success: true, data: plan };
}

export async function updateLessonPlan(id: string, data: LessonPlanInput) {
  const teacherId = await requireAuth();
  const parsed = lessonPlanSchema.parse(data);

  // Deep auth check
  const existing = await prisma.lessonPlan.findFirst({
    where: { id, classGroup: { teacherId } }
  });

  if (!existing) throw new Error("Lesson plan not found or unauthorized");

  const plan = await prisma.lessonPlan.update({
    where: { id },
    data: {
      classGroupId: parsed.classGroupId,
      title: parsed.title,
      month: parsed.month,
      objectives: parsed.objectives,
      materials: parsed.materials,
      procedure: parsed.procedure as Prisma.JsonArray,
      assessmentNotes: parsed.assessmentNotes,
      additionalNotes: parsed.additionalNotes,
    },
  });

  revalidatePath("/lesson-plans");
  revalidatePath(`/lesson-plans/${id}`);
  return { success: true, data: plan };
}

export async function updateLessonPlanStatus(id: string, status: LessonPlanStatus) {
  const teacherId = await requireAuth();
  const parsedStatus = updateLessonPlanStatusSchema.parse(status);

  const existing = await prisma.lessonPlan.findFirst({
    where: { id, classGroup: { teacherId } }
  });

  if (!existing) throw new Error("Lesson plan not found or unauthorized");

  const plan = await prisma.lessonPlan.update({
    where: { id },
    data: { status: parsedStatus as LessonPlanStatus },
  });

  revalidatePath("/lesson-plans");
  revalidatePath(`/lesson-plans/${id}`);
  return { success: true, data: plan };
}

export async function deleteLessonPlan(id: string) {
  const teacherId = await requireAuth();

  const existing = await prisma.lessonPlan.findFirst({
    where: { id, classGroup: { teacherId } }
  });

  if (!existing) throw new Error("Lesson plan not found or unauthorized");

  await prisma.lessonPlan.delete({ where: { id } });

  revalidatePath("/lesson-plans");
  return { success: true };
}

// ---------------------------------------------------------------------------
// AI Upload & Extraction Pipeline
// ---------------------------------------------------------------------------

export async function uploadAndExtractLessonPlan(formData: FormData) {
  const teacherId = await requireAuth();

  const file = formData.get("file") as File;
  const classGroupId = formData.get("classGroupId") as string;
  const monthStr = formData.get("month") as string;

  if (!file || !classGroupId || !monthStr) {
    throw new Error("Missing required fields for upload.");
  }

  // Verify class ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
  });
  if (!classGroup) throw new Error("Class not found or unauthorized");

  const month = new Date(monthStr);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  // 1. Upload to Supabase Storage
  let sourceFileUrl: string | null = null;
  try {
    sourceFileUrl = await uploadLessonPlanFile(fileBuffer, file.name, file.type, teacherId);
  } catch (error) {
    console.error("Failed to upload file to storage:", error);
    // Proceed anyway, we just won't have the original file saved
  }

  // 2. Parse Raw Text
  let rawText = "";
  try {
    rawText = await extractTextFromFile(fileBuffer, file.type, file.name);
  } catch (error: any) {
    // If parsing fails entirely (e.g., image-only PDF), we can't extract structured data.
    // We create a FAILED record with whatever info we have.
    const plan = await prisma.lessonPlan.create({
      data: {
        classGroupId,
        month,
        title: file.name.replace(/\.[^/.]+$/, ""), // Strip extension
        objectives: "",
        materials: "",
        procedure: [{ value: "" }] as Prisma.JsonArray,
        assessmentNotes: "",
        additionalNotes: `File extraction failed: ${error.message}`,
        status: LessonPlanStatus.DRAFT,
        sourceType: SourceType.UPLOADED,
        sourceFileName: file.name,
        sourceFileUrl,
        extractionStatus: ExtractionStatus.FAILED,
      },
    });
    revalidatePath("/lesson-plans");
    return { success: true, data: plan };
  }

  // 3. Structure with AI
  let extracted;
  let status = ExtractionStatus.SUCCESS;
  try {
    extracted = await structureContentWithAI(rawText);
    
    // Check for partial success (missing core fields)
    if (!extracted.objectives || !extracted.procedure || extracted.procedure.length === 0) {
      status = ExtractionStatus.PARTIAL;
    }
  } catch (error: any) {
    // JSON parse failure or Anthropic API failure
    console.error("AI Structuring failed:", error);
    status = ExtractionStatus.FAILED;
    extracted = {
      title: file.name.replace(/\.[^/.]+$/, ""),
      objectives: "",
      materials: "",
      procedure: [],
      assessmentNotes: "",
      additionalNotes: `AI Extraction Failed.\n\nRaw Text:\n${rawText}`,
    };
  }

  // 4. Save to Database
  const plan = await prisma.lessonPlan.create({
    data: {
      classGroupId,
      month,
      title: extracted.title || file.name.replace(/\.[^/.]+$/, ""),
      objectives: extracted.objectives,
      materials: extracted.materials,
      procedure: (extracted.procedure.length > 0 
        ? extracted.procedure.map(step => ({ value: step })) 
        : [{ value: "" }]) as Prisma.JsonArray,
      assessmentNotes: extracted.assessmentNotes,
      additionalNotes: extracted.additionalNotes,
      status: LessonPlanStatus.DRAFT,
      sourceType: SourceType.UPLOADED,
      sourceFileName: file.name,
      sourceFileUrl,
      extractionStatus: status,
    },
  });

  revalidatePath("/lesson-plans");
  return { success: true, data: plan };
}

