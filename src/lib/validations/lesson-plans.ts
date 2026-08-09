import { z } from "zod";

export const procedureStepSchema = z.object({
  value: z.string().min(1, "Step description cannot be empty"),
});

export const lessonPlanSchema = z.object({
  title: z.string().min(1, "Title is required"),
  classGroupId: z.string().uuid("Class must be selected"),
  month: z.date(),
  objectives: z.string(),
  materials: z.string(),
  procedure: z.array(procedureStepSchema),
  assessmentNotes: z.string(),
  additionalNotes: z.string().optional(),
});

export const updateLessonPlanStatusSchema = z.enum(["DRAFT", "SUBMITTED", "APPROVED"]);

export type LessonPlanInput = z.infer<typeof lessonPlanSchema>;
export type ProcedureStep = z.infer<typeof procedureStepSchema>;
