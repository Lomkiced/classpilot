import type { Assessment, Score, GradeBand, GradingScale } from "@/generated/prisma/client";

export type StudentAveragesPayload = {
  term1Average: number;
  term2Average: number;
  cumulativeAverage: number;
  gradeBand: GradeBand | null;
};

/**
 * Calculates the raw percentage average for a given list of assessments and scores.
 * @param assessments List of assessments (can be filtered by term)
 * @param scores List of scores for the student
 * @returns Average as a percentage (0-100)
 */
export function calculateAverage(assessments: Assessment[], scores: Score[]): number {
  let earned = 0;
  let totalPossible = 0;

  for (const assessment of assessments) {
    const scoreRecord = scores.find(s => s.assessmentId === assessment.id);
    if (scoreRecord && scoreRecord.value !== null) {
      earned += scoreRecord.value;
      totalPossible += assessment.maxScore;
    }
  }

  if (totalPossible === 0) return 0;
  return (earned / totalPossible) * 100;
}

/**
 * Calculates Term 1, Term 2, and Cumulative Averages for a student.
 */
export function calculateStudentGrades(
  studentId: string,
  assessments: Assessment[],
  scores: Score[],
  activeGradingScale?: GradingScale & { bands: GradeBand[] } | null
): StudentAveragesPayload {
  const studentScores = scores.filter(s => s.studentId === studentId);

  const term1Assessments = assessments.filter(a => a.term === "TERM_1");
  const term2Assessments = assessments.filter(a => a.term === "TERM_2");

  const term1Average = calculateAverage(term1Assessments, studentScores);
  const term2Average = calculateAverage(term2Assessments, studentScores);

  const cumulativeAverage = calculateAverage(assessments, studentScores);

  let gradeBand: GradeBand | null = null;
  if (activeGradingScale && activeGradingScale.bands.length > 0) {
    gradeBand = activeGradingScale.bands.find(
      b => cumulativeAverage >= b.minPercent && cumulativeAverage <= b.maxPercent
    ) || activeGradingScale.bands[activeGradingScale.bands.length - 1] || null;
  }

  return {
    term1Average,
    term2Average,
    cumulativeAverage,
    gradeBand
  };
}
