import { z } from "zod";

export const addStudentSchema = z.object({
  fullName: z.string().min(1, "Student name is required"),
  studentNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const updateStudentSchema = addStudentSchema.partial();

export const createClassGroupSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  gradeLevel: z.enum(["P1", "P2", "P3", "P4", "P5_6"]),
  subject: z.string().min(1, "Subject is required"),
});

export type AddStudentInput = z.infer<typeof addStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateClassGroupInput = z.infer<typeof createClassGroupSchema>;
