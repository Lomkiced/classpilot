"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ActionType, ResourceType } from "@/generated/prisma/client";
import { logAuditAction } from "@/lib/audit-logger";
import {
  addStudentSchema,
  updateStudentSchema,
  createClassGroupSchema,
  type AddStudentInput,
  type UpdateStudentInput,
  type CreateClassGroupInput,
} from "@/lib/validations/classes";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getClassGroups() {
  const teacherId = await requireTeacherId();

  return prisma.classGroup.findMany({
    where: { teacherId },
    orderBy: [
      { gradeLevel: "asc" },
      { name: "asc" }
    ],
  });
}

export async function getStudentsForClass(classGroupId: string) {
  const teacherId = await requireTeacherId();

  // Combined ownership check + student fetch in a single query
  const records = await prisma.classGroupStudent.findMany({
    where: {
      classGroupId,
      classGroup: { teacherId },
    },
    include: {
      student: true,
    },
    orderBy: {
      student: { fullName: "asc" },
    },
  });

  if (records.length === 0) {
    // Verify the class actually exists and belongs to the teacher
    // (distinguishes "empty class" from "unauthorized")
    const classGroup = await prisma.classGroup.findFirst({
      where: { id: classGroupId, teacherId },
    });

    if (!classGroup) {
      throw new Error("Class not found or unauthorized");
    }
  }

  return records.map((r) => r.student);
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function addStudent(classGroupId: string, data: AddStudentInput) {
  const teacherId = await requireTeacherId();

  // Validate Input
  const parsed = addStudentSchema.parse(data);

  // Verify Ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  // Transaction: Create Student + Join Table record
  const student = await prisma.$transaction(async (tx) => {
    const newStudent = await tx.student.create({
      data: {
        fullName: parsed.fullName,
        studentNumber: parsed.studentNumber || null,
        notes: parsed.notes || null,
      },
    });

    await tx.classGroupStudent.create({
      data: {
        classGroupId,
        studentId: newStudent.id,
      },
    });

    return newStudent;
  });

  revalidatePath("/classes");
  return { success: true, data: student };
}

export async function updateStudent(studentId: string, data: UpdateStudentInput) {
  const teacherId = await requireTeacherId();

  const parsed = updateStudentSchema.parse(data);

  // Verify Ownership: student must belong to at least one class owned by teacher
  const links = await prisma.classGroupStudent.findMany({
    where: {
      studentId,
      classGroup: { teacherId },
    },
  });

  if (links.length === 0) {
    throw new Error("Student not found or unauthorized");
  }

  const updated = await prisma.student.update({
    where: { id: studentId },
    data: {
      fullName: parsed.fullName,
      studentNumber: parsed.studentNumber,
      notes: parsed.notes,
    },
  });

  revalidatePath("/classes");
  return { success: true, data: updated };
}

export async function removeStudentFromClass(classGroupId: string, studentId: string) {
  const teacherId = await requireTeacherId();

  // Verify Ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
  });

  if (!classGroup) {
    throw new Error("Class not found or unauthorized");
  }

  // Remove the join record
  await prisma.classGroupStudent.delete({
    where: {
      classGroupId_studentId: {
        classGroupId,
        studentId,
      },
    },
  });

  revalidatePath("/classes");
  return { success: true };
}

export async function createClassGroup(data: CreateClassGroupInput) {
  const teacherId = await requireTeacherId();
  const parsed = createClassGroupSchema.parse(data);

  const newClass = await prisma.classGroup.create({
    data: {
      teacherId,
      name: parsed.name,
      gradeLevel: parsed.gradeLevel,
      subject: parsed.subject,
    },
  });

  revalidatePath("/classes");
  return { success: true, data: newClass };
}
