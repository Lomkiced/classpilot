import { z } from "zod";
import { AttendanceStatus } from "@/generated/prisma/client";

export const upsertAttendanceSchema = z.object({
  classGroupId: z.string().uuid(),
  studentId: z.string().uuid(),
  date: z.date(),
  status: z.nativeEnum(AttendanceStatus),
  notes: z.string().optional(),
});

export const batchMarkAttendanceSchema = z.object({
  classGroupId: z.string().uuid(),
  date: z.date(),
  status: z.nativeEnum(AttendanceStatus),
});

export type UpsertAttendanceInput = z.infer<typeof upsertAttendanceSchema>;
export type BatchMarkAttendanceInput = z.infer<typeof batchMarkAttendanceSchema>;
