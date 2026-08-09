"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

async function requireAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function getDashboardMetrics() {
  const teacherId = await requireAuth();

  // 1. Total Classes
  const totalClasses = await prisma.classGroup.count({
    where: { teacherId }
  });

  // 2. Total Students
  // Count unique students across all classes owned by the teacher
  const students = await prisma.student.findMany({
    where: {
      classGroups: {
        some: {
          classGroup: { teacherId }
        }
      }
    },
    select: { id: true }
  });
  const totalStudents = students.length;

  // 3. Lesson Plans Due (DRAFT or SUBMITTED)
  const lessonPlansDue = await prisma.lessonPlan.count({
    where: {
      classGroup: { teacherId },
      status: {
        in: ["DRAFT", "SUBMITTED"]
      }
    }
  });

  // 4. Pending Scores
  // Count scores that are explicitly null for assessments belonging to teacher's classes
  const pendingScores = await prisma.score.count({
    where: {
      value: null,
      assessment: {
        classGroup: { teacherId }
      }
    }
  });

  // 5. Recent Lesson Plans
  const recentLessonPlans = await prisma.lessonPlan.findMany({
    where: {
      classGroup: { teacherId }
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      status: true,
      updatedAt: true,
      classGroup: {
        select: { name: true, gradeLevel: true, subject: true }
      }
    }
  });

  // 6. Recent Activity (Derived Feed)
  // Fetch recent assessments created/updated
  const recentAssessments = await prisma.assessment.findMany({
    where: { classGroup: { teacherId } },
    orderBy: { updatedAt: 'desc' },
    take: 3,
    select: {
      id: true,
      name: true,
      updatedAt: true,
      classGroup: { select: { name: true } }
    }
  });

  // Map to a common activity format
  const activityFeed = [
    ...recentLessonPlans.slice(0, 3).map(lp => ({
      id: `lp-${lp.id}`,
      description: `${lp.classGroup.name} lesson plan updated`,
      date: lp.updatedAt,
      type: "lesson_plan"
    })),
    ...recentAssessments.map(a => ({
      id: `as-${a.id}`,
      description: `${a.classGroup.name} assessment "${a.name}" recorded`,
      date: a.updatedAt,
      type: "assessment"
    }))
  ];

  // Sort combined feed descending by date
  activityFeed.sort((a, b) => b.date.getTime() - a.date.getTime());
  const recentActivity = activityFeed.slice(0, 5);

  return {
    totalClasses,
    totalStudents,
    lessonPlansDue,
    pendingScores,
    recentLessonPlans,
    recentActivity,
  };
}
