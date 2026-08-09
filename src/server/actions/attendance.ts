"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { upsertAttendanceSchema, batchMarkAttendanceSchema, type UpsertAttendanceInput, type BatchMarkAttendanceInput } from "@/lib/validations/attendance";
import { AttendanceStatus, ActionType, ResourceType } from "@/generated/prisma/client";
import { logAuditAction } from "@/lib/audit-logger";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function getAttendanceForDate(classGroupId: string, date: Date) {
  const teacherId = await requireAuth();

  // Verify ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  // Get all students for the class
  const classStudents = await prisma.classGroupStudent.findMany({
    where: { classGroupId },
    include: {
      student: true,
    },
    orderBy: {
      student: { fullName: "asc" },
    },
  });

  // Get attendance records for the specific date
  // We use start of day and end of day to ensure timezone safety if passing dates
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);
  
  const records = await prisma.attendanceRecord.findMany({
    where: {
      classGroupId,
      date: startOfDay,
    },
  });

  const recordMap = new Map(records.map(r => [r.studentId, r]));

  return classStudents.map(cs => ({
    student: cs.student,
    record: recordMap.get(cs.studentId) || null,
  }));
}

export async function getMonthlyAttendance(classGroupId: string, year: number, month: number) {
  const teacherId = await requireAuth();

  // Verify ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  // Get all students for the class
  const classStudents = await prisma.classGroupStudent.findMany({
    where: { classGroupId },
    include: {
      student: true,
    },
    orderBy: {
      student: { fullName: "asc" },
    },
  });

  // Calculate start and end of the month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  const records = await prisma.attendanceRecord.findMany({
    where: {
      classGroupId,
      date: {
        gte: startDate,
        lt: endDate,
      },
    },
  });

  // Group records by studentId
  const studentRecords = new Map<string, typeof records>();
  for (const record of records) {
    if (!studentRecords.has(record.studentId)) {
      studentRecords.set(record.studentId, []);
    }
    studentRecords.get(record.studentId)!.push(record);
  }

  return {
    classGroup,
    students: classStudents.map(cs => ({
      student: cs.student,
      records: studentRecords.get(cs.studentId) || [],
    })),
  };
}

export async function upsertAttendanceRecord(data: UpsertAttendanceInput) {
  const teacherId = await requireAuth();
  const parsed = upsertAttendanceSchema.parse(data);

  // Normalize date to start of UTC day
  const normalizedDate = new Date(parsed.date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  // Verify Ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  const record = await prisma.attendanceRecord.upsert({
    where: {
      classGroupId_studentId_date: {
        classGroupId: parsed.classGroupId,
        studentId: parsed.studentId,
        date: normalizedDate,
      },
    },
    update: {
      status: parsed.status,
      notes: parsed.notes,
    },
    create: {
      classGroupId: parsed.classGroupId,
      studentId: parsed.studentId,
      date: normalizedDate,
      status: parsed.status,
      notes: parsed.notes,
    },
  });

  // Log Audit Action
  await logAuditAction({
    action: ActionType.UPDATE,
    resourceType: ResourceType.ATTENDANCE_RECORD,
    resourceId: record.id,
    details: {
      studentId: parsed.studentId,
      classGroupId: parsed.classGroupId,
      date: normalizedDate,
      status: parsed.status,
    },
  });

  revalidatePath("/attendance");
  return { success: true, data: record };
}

export async function batchMarkAttendance(data: BatchMarkAttendanceInput) {
  const teacherId = await requireAuth();
  const parsed = batchMarkAttendanceSchema.parse(data);

  const normalizedDate = new Date(parsed.date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  // Verify Ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  // Find all students currently in the class
  const classStudents = await prisma.classGroupStudent.findMany({
    where: { classGroupId: parsed.classGroupId },
  });

  // Find existing records
  const existingRecords = await prisma.attendanceRecord.findMany({
    where: {
      classGroupId: parsed.classGroupId,
      date: normalizedDate,
    },
    select: { studentId: true },
  });

  const existingStudentIds = new Set(existingRecords.map(r => r.studentId));

  // Determine which students have NO record yet
  const unmarkedStudents = classStudents.filter(cs => !existingStudentIds.has(cs.studentId));

  if (unmarkedStudents.length === 0) {
    return { success: true, message: "All students already have attendance marked." };
  }

  // Create records for unmarked students
  await prisma.attendanceRecord.createMany({
    data: unmarkedStudents.map(student => ({
      classGroupId: parsed.classGroupId,
      studentId: student.studentId,
      date: normalizedDate,
      status: parsed.status,
    })),
  });

  // Log Audit Action
  await logAuditAction({
    action: ActionType.CREATE,
    resourceType: ResourceType.ATTENDANCE_RECORD,
    details: {
      classGroupId: parsed.classGroupId,
      date: normalizedDate,
      status: parsed.status,
      studentsMarked: unmarkedStudents.length,
    },
  });

  revalidatePath("/attendance");
  return { success: true, count: unmarkedStudents.length };
}
