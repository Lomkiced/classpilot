"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";

export async function getDashboardMetrics() {
  const teacherId = await requireTeacherId();

  // Parallelize all independent queries with Promise.all()
  const [
    totalClasses,
    totalStudents,
    lessonPlansDue,
    pendingScores,
    recentLessonPlans,
    recentAssessments,
  ] = await Promise.all([
    // 1. Total Classes
    prisma.classGroup.count({
      where: { teacherId },
    }),

    // 2. Total Students — use count() instead of findMany().length
    prisma.student.count({
      where: {
        classGroups: {
          some: {
            classGroup: { teacherId },
          },
        },
      },
    }),

    // 3. Lesson Plans Due (DRAFT or SUBMITTED)
    prisma.lessonPlan.count({
      where: {
        classGroup: { teacherId },
        status: {
          in: ["DRAFT", "SUBMITTED"],
        },
      },
    }),

    // 4. Pending Scores (null values)
    prisma.score.count({
      where: {
        value: null,
        assessment: {
          classGroup: { teacherId },
        },
      },
    }),

    // 5. Recent Lesson Plans
    prisma.lessonPlan.findMany({
      where: {
        classGroup: { teacherId },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        classGroup: {
          select: { name: true, gradeLevel: true, subject: true },
        },
      },
    }),

    // 6. Recent Assessments
    prisma.assessment.findMany({
      where: { classGroup: { teacherId } },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        name: true,
        updatedAt: true,
        classGroup: { select: { name: true } },
      },
    }),
  ]);

  // Map to a common activity format
  const activityFeed = [
    ...recentLessonPlans.slice(0, 3).map(lp => ({
      id: `lp-${lp.id}`,
      description: `${lp.classGroup.name} lesson plan updated`,
      date: lp.updatedAt,
      type: "lesson_plan",
    })),
    ...recentAssessments.map(a => ({
      id: `as-${a.id}`,
      description: `${a.classGroup.name} assessment "${a.name}" recorded`,
      date: a.updatedAt,
      type: "assessment",
    })),
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
