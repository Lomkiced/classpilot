"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Check, Loader2, Users, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { Assessment } from "@/generated/prisma/client";

import { useGradebookQuery, useScoreMutation, type GradebookPayload } from "@/hooks/use-gradebook";
import { createAssessment, updateAssessment, deleteAssessment } from "@/server/actions/gradebook";
import { createAssessmentSchema, updateAssessmentSchema, type CreateAssessmentInput, type UpdateAssessmentInput } from "@/lib/validations/gradebook";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface GradebookGridProps {
  classGroupId: string;
}

export function GradebookGrid({ classGroupId }: GradebookGridProps) {
  const { data, isLoading, isError } = useGradebookQuery(classGroupId);
  const scoreMutation = useScoreMutation(classGroupId);
  const queryClient = useQueryClient();

  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  const [editAssessment, setEditAssessment] = useState<Assessment | null>(null);
  const [isEditingAssessment, setIsEditingAssessment] = useState(false);
  const [deleteAssessmentId, setDeleteAssessmentId] = useState<string | null>(null);
  const [isDeletingAssessment, setIsDeletingAssessment] = useState(false);

  const form = useForm<CreateAssessmentInput>({
    resolver: zodResolver(createAssessmentSchema) as any,
    defaultValues: {
      classGroupId,
      name: "",
      type: "QUIZ",
      maxScore: 100,
      date: new Date(),
    },
  });

  const editForm = useForm<UpdateAssessmentInput>({
    resolver: zodResolver(updateAssessmentSchema) as any,
  });

  const handleCreateAssessment = async (values: CreateAssessmentInput) => {
    setIsAddingAssessment(true);
    try {
      const result = await createAssessment(values);
      if (result.success) {
        toast.success("Assessment created");
        setIsAddAssessmentOpen(false);
        form.reset();
        // Invalidate cache to fetch the new assessment column
        queryClient.invalidateQueries({ queryKey: ["gradebook", classGroupId] });
      }
    } catch (e) {
      toast.error("Failed to create assessment");
    } finally {
      setIsAddingAssessment(false);
    }
  };

  const handleEditAssessment = async (values: UpdateAssessmentInput) => {
    if (!editAssessment) return;
    setIsEditingAssessment(true);
    try {
      const result = await updateAssessment(editAssessment.id, values);
      if (result.success) {
        toast.success("Assessment updated");
        setEditAssessment(null);
        queryClient.invalidateQueries({ queryKey: ["gradebook", classGroupId] });
      }
    } catch (e) {
      toast.error("Failed to update assessment");
    } finally {
      setIsEditingAssessment(false);
    }
  };

  const handleDeleteAssessment = async () => {
    if (!deleteAssessmentId) return;
    setIsDeletingAssessment(true);
    try {
      const result = await deleteAssessment(deleteAssessmentId);
      if (result.success) {
        toast.success("Assessment deleted");
        setDeleteAssessmentId(null);
        queryClient.invalidateQueries({ queryKey: ["gradebook", classGroupId] });
      }
    } catch (e) {
      toast.error("Failed to delete assessment");
    } finally {
      setIsDeletingAssessment(false);
    }
  };

  const openEditDialog = (assessment: Assessment) => {
    setEditAssessment(assessment);
    editForm.reset({
      name: assessment.name,
      type: assessment.type as any,
      maxScore: assessment.maxScore,
      date: assessment.date,
    });
  };

  const handleCellBlur = (assessmentId: string, studentId: string, rawValue: string, previousValue: number | null) => {
    const value = rawValue === "" ? null : parseFloat(rawValue);
    if (value === previousValue) return; // No change

    // Fire mutation (optimistic update happens instantly in the hook)
    scoreMutation.mutate({ assessmentId, studentId, value });
  };

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------
  
  const studentAverages = useMemo(() => {
    if (!data) return new Map<string, number>();

    const map = new Map<string, number>();
    
    for (const student of data.students) {
      let earned = 0;
      let totalPossible = 0;

      for (const assessment of data.assessments) {
        const scoreRecord = data.scores.find(
          (s) => s.studentId === student.id && s.assessmentId === assessment.id
        );

        if (scoreRecord && scoreRecord.value !== null) {
          earned += scoreRecord.value;
          totalPossible += assessment.maxScore;
        }
      }

      const average = totalPossible > 0 ? (earned / totalPossible) * 100 : 0;
      map.set(student.id, average);
    }

    return map;
  }, [data]);

  // ---------------------------------------------------------------------------
  // Render States
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-gray-200 bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-600">
        Failed to load gradebook data.
      </div>
    );
  }

  if (data.students.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
          <Users className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No students found</h3>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          Add students to this class in the Classes tab before using the Gradebook.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => setIsAddAssessmentOpen(true)} className="bg-pink-600 hover:bg-pink-700">
            <Plus className="mr-2 h-4 w-4" />
            New Assessment
          </Button>

          {/* Sync Status Indicator */}
          <div className="flex items-center text-sm">
            {scoreMutation.isPending ? (
              <span className="flex items-center text-gray-500">
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Saving...
              </span>
            ) : scoreMutation.isError ? (
              <span className="text-red-600">Failed to save</span>
            ) : scoreMutation.isSuccess ? (
              <span className="flex items-center text-green-600 transition-opacity">
                <Check className="mr-1 h-4 w-4" /> All changes saved
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Gradebook Grid */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5">
        <Table className="w-full min-w-max">
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              {/* Sticky Student Name Column */}
              <TableHead className="sticky left-0 z-10 w-[200px] bg-gray-50/95 font-semibold text-gray-900 shadow-[1px_0_0_0_#e5e7eb] backdrop-blur-sm">
                Student
              </TableHead>

              {/* Assessment Columns */}
              {data.assessments.map((assessment) => (
                <TableHead key={assessment.id} className="min-w-[140px] px-2 text-center align-bottom group relative">
                  <div className="flex flex-col items-center gap-1 w-full relative">
                    <span className="truncate max-w-[100px] text-sm font-medium text-gray-900" title={assessment.name}>
                      {assessment.name}
                    </span>
                    <span className="text-[10px] uppercase text-gray-500">{assessment.type}</span>
                    <span className="text-xs text-gray-400">/{assessment.maxScore}</span>
                    
                    <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:text-gray-900 hover:bg-gray-100 p-0 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-1">
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[180px]">
                          <DropdownMenuItem onClick={() => openEditDialog(assessment)} className="py-2 text-base">
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => setDeleteAssessmentId(assessment.id)} 
                            className="py-2 text-base text-red-600 focus:text-red-600 focus:bg-red-50"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </TableHead>
              ))}

              {/* Computed Average Column */}
              <TableHead className="w-[100px] text-right font-semibold text-gray-900">
                Average
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.students.map((student) => {
              const average = studentAverages.get(student.id) || 0;
              const hasGrades = average > 0;

              return (
                <TableRow key={student.id} className="group hover:bg-gray-50">
                  {/* Sticky Student Name */}
                  <TableCell className="sticky left-0 z-10 bg-white font-medium text-gray-900 shadow-[1px_0_0_0_#e5e7eb] group-hover:bg-gray-50">
                    {student.fullName}
                  </TableCell>

                  {/* Score Inputs */}
                  {data.assessments.map((assessment) => {
                    const score = data.scores.find(
                      (s) => s.studentId === student.id && s.assessmentId === assessment.id
                    );
                    const valueStr = score?.value !== null && score?.value !== undefined ? String(score.value) : "";
                    const prevVal = score?.value ?? null;

                    return (
                      <TableCell key={assessment.id} className="p-1">
                        <GradebookCell
                          initialValue={valueStr}
                          maxScore={assessment.maxScore}
                          onSave={(val) => handleCellBlur(assessment.id, student.id, val, prevVal)}
                        />
                      </TableCell>
                    );
                  })}

                  {/* Computed Average */}
                  <TableCell className="text-right font-medium">
                    {hasGrades ? (
                      <div className="flex items-center justify-end gap-2">
                        <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                          {average.toFixed(1)}%
                        </span>
                        {(() => {
                          if (!data.activeGradingScale) return null;
                          const band = data.activeGradingScale.bands.find(
                            (b: any) => average >= b.minPercent && average <= b.maxPercent
                          );
                          if (band) {
                            return (
                              <span className="text-xs font-medium text-pink-600 bg-pink-50 px-2 py-1 rounded-md">
                                {band.label}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* New Assessment Dialog */}
      <Dialog open={isAddAssessmentOpen} onOpenChange={setIsAddAssessmentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Assessment</DialogTitle>
            <DialogDescription>
              Create a new assessment column in the gradebook.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateAssessment as any)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Name</Label>
              <Input id="add-name" {...form.register("name")} placeholder="e.g. Midterm Exam" className="focus-visible:ring-pink-500" />
              {form.formState.errors.name && <p className="text-xs text-red-600">{form.formState.errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-type">Type</Label>
                <Select
                  onValueChange={(val) => form.setValue("type", val as any)}
                  value={form.watch("type")}
                >
                  <SelectTrigger id="add-type" className="focus:ring-pink-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="ACTIVITY">Activity</SelectItem>
                    <SelectItem value="HOMEWORK">Homework</SelectItem>
                    <SelectItem value="PARTICIPATION">Participation</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.type && <p className="text-xs text-red-600">{form.formState.errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-maxScore">Max Score</Label>
                <Input id="add-maxScore" type="number" {...form.register("maxScore")} className="focus-visible:ring-pink-500" />
                {form.formState.errors.maxScore && <p className="text-xs text-red-600">{form.formState.errors.maxScore.message}</p>}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddAssessmentOpen(false)} disabled={isAddingAssessment}>
                Cancel
              </Button>
              <Button type="submit" disabled={isAddingAssessment} className="bg-pink-600 hover:bg-pink-700">
                {isAddingAssessment ? "Creating..." : "Create Assessment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Assessment Dialog */}
      <Dialog open={!!editAssessment} onOpenChange={(open) => !open && setEditAssessment(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Assessment</DialogTitle>
            <DialogDescription>
              Modify this assessment's details. Changing the max score will affect students' averages.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditAssessment as any)} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input id="edit-name" {...editForm.register("name")} className="focus-visible:ring-pink-500" />
              {editForm.formState.errors.name && <p className="text-xs text-red-600">{editForm.formState.errors.name.message}</p>}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Type</Label>
                <Select
                  onValueChange={(val) => editForm.setValue("type", val as any)}
                  value={editForm.watch("type")}
                >
                  <SelectTrigger id="edit-type" className="focus:ring-pink-500">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="QUIZ">Quiz</SelectItem>
                    <SelectItem value="ACTIVITY">Activity</SelectItem>
                    <SelectItem value="HOMEWORK">Homework</SelectItem>
                    <SelectItem value="PARTICIPATION">Participation</SelectItem>
                  </SelectContent>
                </Select>
                {editForm.formState.errors.type && <p className="text-xs text-red-600">{editForm.formState.errors.type.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-maxScore">Max Score</Label>
                <Input id="edit-maxScore" type="number" {...editForm.register("maxScore")} className="focus-visible:ring-pink-500" />
                {editForm.formState.errors.maxScore && <p className="text-xs text-red-600">{editForm.formState.errors.maxScore.message}</p>}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setEditAssessment(null)} disabled={isEditingAssessment}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditingAssessment} className="bg-pink-600 hover:bg-pink-700">
                {isEditingAssessment ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteAssessmentId} onOpenChange={(open) => !open && setDeleteAssessmentId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Assessment</DialogTitle>
            <DialogDescription className="pt-4 text-gray-700">
              Are you sure you want to delete this assessment? <br/><br/>
              <strong>Warning:</strong> Deleting this assessment will also delete <strong>all recorded scores</strong> for this assessment. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setDeleteAssessmentId(null)} disabled={isDeletingAssessment}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAssessment} disabled={isDeletingAssessment}>
              {isDeletingAssessment ? "Deleting..." : "Delete Assessment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Gradebook Cell Sub-component
// ---------------------------------------------------------------------------

function GradebookCell({ 
  initialValue, 
  maxScore, 
  onSave 
}: { 
  initialValue: string; 
  maxScore: number; 
  onSave: (val: string) => void;
}) {
  const [val, setVal] = useState(initialValue);

  // Sync state if external initialValue changes (e.g., from server or rollback)
  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  return (
    <Input
      type="number"
      step="0.5"
      min="0"
      max={maxScore}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onBlur={() => onSave(val)}
      className="h-8 border-transparent bg-transparent text-center text-sm shadow-none focus-visible:border-pink-500 focus-visible:ring-1 focus-visible:ring-pink-500"
      placeholder="-"
    />
  );
}
