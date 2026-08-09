"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { upsertRemarkSchema, type UpsertRemarkInput } from "@/lib/validations/remarks";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateGenericRemark(firstName: string, average: number): string {
  if (average >= 90) return `${firstName} is an outstanding student who consistently exceeds expectations.`;
  if (average >= 80) return `${firstName} has shown strong performance this term.`;
  if (average >= 70) return `${firstName} is making steady progress and participates well.`;
  if (average >= 60) return `${firstName} has shown effort, but occasionally struggles with complex topics.`;
  return `${firstName} has had a challenging term and needs more support with fundamental concepts.`;
}

function generateBandRemark(firstName: string, bandLabel: string): string {
  // We can vary the tone based on the label, but since labels are arbitrary, 
  // we'll keep it simple and explicit so the teacher can see the band was used.
  return `${firstName} has achieved a ${bandLabel} this term. They have worked hard and shown good participation in class.`;
}

// ---------------------------------------------------------------------------
// Queries & Mutations
// ---------------------------------------------------------------------------

export async function getRemarksForClass(classGroupId: string, gradingPeriod: string) {
  const teacherId = await requireAuth();

  // Verify ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: classGroupId, teacherId },
    include: {
      students: {
        include: {
          student: true
        }
      }
    }
  });

  if (!classGroup) throw new Error("Class not found or unauthorized");

  const studentIds = classGroup.students.map((s) => s.studentId);

  // 1. Fetch existing remarks for this period
  const existingRemarks = await prisma.remark.findMany({
    where: {
      classGroupId,
      gradingPeriod,
      studentId: { in: studentIds }
    }
  });

  const remarksMap = new Map(existingRemarks.map(r => [r.studentId, r]));

  // 2. Fetch all scores for these students in this class
  // To compute the average for the grading period, we'll fetch all assessments for this class
  // In a real app, you might filter assessments by date to match the gradingPeriod.
  const scores = await prisma.score.findMany({
    where: {
      studentId: { in: studentIds },
      assessment: { classGroupId }
    },
    include: {
      assessment: true
    }
  });

  // Calculate averages
  const averagesMap = new Map<string, number>();
  
  studentIds.forEach(studentId => {
    const studentScores = scores.filter(s => s.studentId === studentId && s.value !== null);
    if (studentScores.length === 0) {
      averagesMap.set(studentId, 0);
      return;
    }

    let earned = 0;
    let total = 0;
    studentScores.forEach(s => {
      earned += s.value!;
      total += s.assessment.maxScore;
    });

    const avg = total > 0 ? (earned / total) * 100 : 0;
    averagesMap.set(studentId, Math.round(avg * 10) / 10); // 1 decimal place
  });

  // 3. Assemble the response payload
  return classGroup.students.map(cs => {
    const student = cs.student;
    const avg = averagesMap.get(student.id) || 0;
    const remark = remarksMap.get(student.id);

    return {
      student,
      average: avg,
      remark: remark || null
    };
  }).sort((a, b) => a.student.fullName.localeCompare(b.student.fullName));
}

export async function upsertRemark(data: UpsertRemarkInput) {
  const teacherId = await requireAuth();
  const parsed = upsertRemarkSchema.parse(data);

  // Verify class ownership
  const classGroup = await prisma.classGroup.findFirst({
    where: { id: parsed.classGroupId, teacherId },
  });

  if (!classGroup) throw new Error("Unauthorized");

  // Check if it already exists
  const existing = await prisma.remark.findFirst({
    where: {
      studentId: parsed.studentId,
      classGroupId: parsed.classGroupId,
      gradingPeriod: parsed.gradingPeriod
    }
  });

  if (existing) {
    return prisma.remark.update({
      where: { id: existing.id },
      data: {
        content: parsed.content,
        gradeBandId: parsed.gradeBandId,
      }
    });
  }

  return prisma.remark.create({
    data: {
      studentId: parsed.studentId,
      classGroupId: parsed.classGroupId,
      gradingPeriod: parsed.gradingPeriod,
      content: parsed.content,
      gradeBandId: parsed.gradeBandId,
    }
  });
}

export async function suggestRemark(studentId: string, classGroupId: string, gradingPeriod: string) {
  const teacherId = await requireAuth();

  // We could strictly filter scores by dates corresponding to the gradingPeriod if we wanted to
  // But for this simple implementation, we'll get their overall class average.
  const scores = await prisma.score.findMany({
    where: {
      studentId,
      assessment: { classGroupId }
    },
    include: {
      assessment: true
    }
  });

  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });

  if (!student) throw new Error("Student not found");

  const validScores = scores.filter(s => s.value !== null);
  let earned = 0;
  let total = 0;
  
  validScores.forEach(s => {
    earned += s.value!;
    total += s.assessment.maxScore;
  });

  const avg = total > 0 ? (earned / total) * 100 : 0;
  const firstName = student.fullName.split(" ")[0];

  // Try to use active grading scale
  const activeScale = await prisma.gradingScale.findFirst({
    where: { teacherId, isActive: true },
    include: { bands: true }
  });

  let suggestion = "";
  if (activeScale && activeScale.bands.length > 0) {
    const band = activeScale.bands.find(b => avg >= b.minPercent && avg <= b.maxPercent) 
              || activeScale.bands[activeScale.bands.length - 1]; // fallback to lowest if math is weird
    
    suggestion = generateBandRemark(firstName, band.label);
  } else {
    suggestion = generateGenericRemark(firstName, avg);
  }

  return { suggestion, average: avg };
}
