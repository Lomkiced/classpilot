"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getGradebookData, upsertScore } from "@/server/actions/gradebook";
import type { UpsertScoreInput } from "@/lib/validations/gradebook";
import type { Student, Assessment, Score } from "@/generated/prisma/client";

export type GradebookPayload = {
  students: Student[];
  assessments: Assessment[];
  scores: Score[];
  activeGradingScale?: any;
};

export function useGradebookQuery(classGroupId: string, term: "TERM_1" | "TERM_2" | "ALL", initialData?: GradebookPayload) {
  return useQuery({
    queryKey: ["gradebook", classGroupId, { term }],
    queryFn: async () => {
      return getGradebookData(classGroupId, term);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    initialData,
  });
}

export function useScoreMutation(classGroupId: string, term: "TERM_1" | "TERM_2" | "ALL") {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpsertScoreInput) => {
      const result = await upsertScore(data);
      if (!result.success) throw new Error("Failed to save score");
      return result.data;
    },
    // Optimistic Update
    onMutate: async (newScore) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["gradebook", classGroupId, { term }] });

      // Snapshot the previous value
      const previousGradebook = queryClient.getQueryData<GradebookPayload>(["gradebook", classGroupId, { term }]);

      // Optimistically update to the new value
      if (previousGradebook) {
        queryClient.setQueryData<GradebookPayload>(["gradebook", classGroupId, { term }], (old) => {
          if (!old) return old;

          const existingScoreIndex = old.scores.findIndex(
            (s) => s.assessmentId === newScore.assessmentId && s.studentId === newScore.studentId
          );

          const newScoreRecord: Score = {
            id: existingScoreIndex >= 0 ? old.scores[existingScoreIndex].id : "temp-id",
            assessmentId: newScore.assessmentId,
            studentId: newScore.studentId,
            value: newScore.value,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          const newScores = [...old.scores];
          if (existingScoreIndex >= 0) {
            newScores[existingScoreIndex] = newScoreRecord;
          } else {
            newScores.push(newScoreRecord);
          }

          return {
            ...old,
            scores: newScores,
          };
        });
      }

      // Return a context object with the snapshotted value
      return { previousGradebook };
    },
    // If the mutation fails, use the context returned from onMutate to roll back
    onError: (err, newScore, context) => {
      if (context?.previousGradebook) {
        queryClient.setQueryData(["gradebook", classGroupId, { term }], context.previousGradebook);
      }
      toast.error("Failed to save score. It has been reverted.");
    },
    // Always refetch after error or success to ensure server sync
    // Wait, since we are optimistic, we might not want to refetch instantly on success 
    // to avoid rapid flashes. The optimistic cache is good enough until a hard refresh.
    // We will just leave it.
  });
}
