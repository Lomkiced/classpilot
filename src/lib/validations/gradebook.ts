import { z } from "zod";

export const assessmentTypeSchema = z.enum(["QUIZ", "ACTIVITY", "HOMEWORK", "PARTICIPATION"]);

export const createAssessmentSchema = z.object({
  classGroupId: z.string().uuid(),
  name: z.string().min(1, "Assessment name is required"),
  type: assessmentTypeSchema,
  maxScore: z.coerce.number().positive("Max score must be greater than 0"),
  date: z.date(),
});

export const updateAssessmentSchema = z.object({
  name: z.string().min(1, "Assessment name is required"),
  type: assessmentTypeSchema,
  maxScore: z.coerce.number().positive("Max score must be greater than 0"),
  date: z.date(),
});

export const upsertScoreSchema = z.object({
  assessmentId: z.string().uuid(),
  studentId: z.string().uuid(),
  value: z.coerce.number().min(0, "Score cannot be negative").nullable(),
});

export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type UpsertScoreInput = z.infer<typeof upsertScoreSchema>;
