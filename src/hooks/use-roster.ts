"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getStudentsForClass,
  addStudent,
  updateStudent,
  removeStudentFromClass,
} from "@/server/actions/classes";
import type { AddStudentInput, UpdateStudentInput } from "@/lib/validations/classes";
import type { Student } from "@/generated/prisma/client";

// =============================================================================
// Query: Fetch students for a class
// =============================================================================

export function useRosterQuery(classGroupId: string, initialData?: Student[]) {
  return useQuery({
    queryKey: ["roster", classGroupId],
    queryFn: () => getStudentsForClass(classGroupId),
    initialData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

// =============================================================================
// Mutation: Add Student (Optimistic)
// =============================================================================

export function useAddStudentMutation(classGroupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddStudentInput) => {
      const result = await addStudent(classGroupId, data);
      if (!result.success) throw new Error("Failed to add student");
      return result.data;
    },
    onMutate: async (newStudentData) => {
      await queryClient.cancelQueries({ queryKey: ["roster", classGroupId] });
      const previous = queryClient.getQueryData<Student[]>(["roster", classGroupId]);

      // Optimistic: instantly append a placeholder student to the list
      if (previous) {
        const optimisticStudent: Student = {
          id: `temp-${Date.now()}`,
          fullName: newStudentData.fullName,
          studentNumber: newStudentData.studentNumber || null,
          notes: newStudentData.notes || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        queryClient.setQueryData<Student[]>(
          ["roster", classGroupId],
          [...previous, optimisticStudent].sort((a, b) =>
            a.fullName.localeCompare(b.fullName)
          )
        );
      }

      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["roster", classGroupId], context.previous);
      }
      toast.error("Failed to add student. Changes have been reverted.");
    },
    onSuccess: () => {
      toast.success("Student added successfully");
    },
    onSettled: () => {
      // Always refetch to get the real server data (replaces temp-id)
      queryClient.invalidateQueries({ queryKey: ["roster", classGroupId] });
    },
  });
}

// =============================================================================
// Mutation: Update Student (Optimistic)
// =============================================================================

export function useUpdateStudentMutation(classGroupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ studentId, data }: { studentId: string; data: UpdateStudentInput }) => {
      const result = await updateStudent(studentId, data);
      if (!result.success) throw new Error("Failed to update student");
      return result.data;
    },
    onMutate: async ({ studentId, data }) => {
      await queryClient.cancelQueries({ queryKey: ["roster", classGroupId] });
      const previous = queryClient.getQueryData<Student[]>(["roster", classGroupId]);

      if (previous) {
        queryClient.setQueryData<Student[]>(
          ["roster", classGroupId],
          previous.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  fullName: data.fullName ?? s.fullName,
                  studentNumber: data.studentNumber ?? s.studentNumber,
                  notes: data.notes ?? s.notes,
                  updatedAt: new Date(),
                }
              : s
          )
        );
      }

      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["roster", classGroupId], context.previous);
      }
      toast.error("Failed to update student. Changes have been reverted.");
    },
    onSuccess: () => {
      toast.success("Student updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", classGroupId] });
    },
  });
}

// =============================================================================
// Mutation: Remove Student (Optimistic)
// =============================================================================

export function useRemoveStudentMutation(classGroupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (studentId: string) => {
      const result = await removeStudentFromClass(classGroupId, studentId);
      if (!result.success) throw new Error("Failed to remove student");
      return result;
    },
    onMutate: async (studentId) => {
      await queryClient.cancelQueries({ queryKey: ["roster", classGroupId] });
      const previous = queryClient.getQueryData<Student[]>(["roster", classGroupId]);

      if (previous) {
        queryClient.setQueryData<Student[]>(
          ["roster", classGroupId],
          previous.filter((s) => s.id !== studentId)
        );
      }

      return { previous };
    },
    onError: (_err, _data, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["roster", classGroupId], context.previous);
      }
      toast.error("Failed to remove student. Changes have been reverted.");
    },
    onSuccess: () => {
      toast.success("Student removed");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["roster", classGroupId] });
    },
  });
}
