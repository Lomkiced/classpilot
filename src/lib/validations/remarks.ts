import { z } from "zod";

export const upsertRemarkSchema = z.object({
  studentId: z.string().uuid(),
  classGroupId: z.string().uuid(),
  gradingPeriod: z.string().min(1, "Grading period is required"),
  content: z.string(),
  gradeBandId: z.string().uuid().optional().nullable(),
});

export type UpsertRemarkInput = z.infer<typeof upsertRemarkSchema>;
