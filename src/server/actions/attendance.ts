"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { upsertAttendanceSchema, batchMarkAttendanceSchema, type UpsertAttendanceInput, type BatchMarkAttendanceInput } from "@/lib/validations/attendance";
import { AttendanceStatus, ActionType, ResourceType } from "@/generated/prisma/client";
import { logAuditAction } from "@/lib/audit-logger";

export async function getAttendanceForDate(classGroupId: string, date: Date) {
  const teacherId = await requireTeacherId();

  // Normalize date
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  // Parallelize: verify ownership + fetch students + fetch attendance records
  const [classGroup, classStudents, records] = await Promise.all([
    prisma.classGroup.findFirst({
      where: { id: classGroupId, teacherId },
    }),

    prisma.classGroupStudent.findMany({
      where: { classGroupId },
      include: {
        student: true,
      },
      orderBy: {
        student: { fullName: "asc" },
      },
    }),

    prisma.attendanceRecord.findMany({
      where: {
        classGroupId,
        date: startOfDay,
      },
    }),
  ]);

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  const recordMap = new Map(records.map(r => [r.studentId, r]));

  return classStudents.map(cs => ({
    student: cs.student,
    record: recordMap.get(cs.studentId) || null,
  }));
}

export async function getMonthlyAttendance(classGroupId: string, year: number, month: number) {
  const teacherId = await requireTeacherId();

  // Calculate start and end of the month in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 1));

  // Parallelize: verify ownership + fetch students + fetch records
  const [classGroup, classStudents, records] = await Promise.all([
    prisma.classGroup.findFirst({
      where: { id: classGroupId, teacherId },
    }),

    prisma.classGroupStudent.findMany({
      where: { classGroupId },
      include: {
        student: true,
      },
      orderBy: {
        student: { fullName: "asc" },
      },
    }),

    prisma.attendanceRecord.findMany({
      where: {
        classGroupId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    }),
  ]);

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

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
  const teacherId = await requireTeacherId();
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
  const teacherId = await requireTeacherId();
  const parsed = batchMarkAttendanceSchema.parse(data);

  const normalizedDate = new Date(parsed.date);
  normalizedDate.setUTCHours(0, 0, 0, 0);

  // Parallelize: verify ownership + fetch students + fetch existing records
  const [classGroup, classStudents, existingRecords] = await Promise.all([
    prisma.classGroup.findFirst({
      where: { id: parsed.classGroupId, teacherId },
    }),

    prisma.classGroupStudent.findMany({
      where: { classGroupId: parsed.classGroupId },
    }),

    prisma.attendanceRecord.findMany({
      where: {
        classGroupId: parsed.classGroupId,
        date: normalizedDate,
      },
      select: { studentId: true },
    }),
  ]);

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

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
