"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, MoreHorizontal, Pencil, Trash2, Users, Loader2 } from "lucide-react";

import type { Student } from "@/generated/prisma/client";
import { addStudentSchema, updateStudentSchema, type AddStudentInput, type UpdateStudentInput } from "@/lib/validations/classes";
import { useRosterQuery, useAddStudentMutation, useUpdateStudentMutation, useRemoveStudentMutation } from "@/hooks/use-roster";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RosterTableProps {
  classGroupId: string;
  initialStudents: Student[];
}

export function RosterTable({ classGroupId, initialStudents }: RosterTableProps) {
  // TanStack Query — hydrated with server-fetched initialData for instant first paint
  const { data: students = [], isLoading } = useRosterQuery(classGroupId, initialStudents);
  
  // Optimistic mutations
  const addMutation = useAddStudentMutation(classGroupId);
  const updateMutation = useUpdateStudentMutation(classGroupId);
  const removeMutation = useRemoveStudentMutation(classGroupId);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);

  // Forms
  const addForm = useForm<AddStudentInput>({
    resolver: zodResolver(addStudentSchema),
    defaultValues: { fullName: "", studentNumber: "", notes: "" },
  });

  const editForm = useForm<UpdateStudentInput>({
    resolver: zodResolver(updateStudentSchema),
  });

  // Derived pending state from any active mutation
  const isPending = addMutation.isPending || updateMutation.isPending || removeMutation.isPending;

  // ---------------------------------------------------------------------------
  // Handlers — No more router.refresh()! Mutations handle cache updates.
  // ---------------------------------------------------------------------------

  const handleAddSubmit = async (data: AddStudentInput) => {
    addMutation.mutate(data, {
      onSuccess: () => {
        setIsAddOpen(false);
        addForm.reset();
      },
    });
  };

  const handleEditSubmit = async (data: UpdateStudentInput) => {
    if (!editStudent) return;
    updateMutation.mutate(
      { studentId: editStudent.id, data },
      {
        onSuccess: () => {
          setEditStudent(null);
        },
      }
    );
  };

  const handleRemove = async () => {
    if (!studentToRemove) return;
    removeMutation.mutate(studentToRemove, {
      onSuccess: () => {
        setStudentToRemove(null);
      },
    });
  };

  const openEditDialog = (student: Student) => {
    setEditStudent(student);
    editForm.reset({
      fullName: student.fullName,
      studentNumber: student.studentNumber || "",
      notes: student.notes || "",
    });
  };

  // ---------------------------------------------------------------------------
  // Loading State (only on hard refresh, never with initialData)
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------
  if (students.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center animate-in fade-in">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-100">
          <Users className="h-6 w-6 text-pink-600" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No students yet</h3>
        <p className="mt-1 mb-6 max-w-sm text-base text-gray-500">
          Get started by adding students to this class. You can always edit or remove them later.
        </p>
        <Button onClick={() => setIsAddOpen(true)} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="mr-2 h-5 w-5" />
          Add Student
        </Button>

        {/* We still need the Add Dialog here so it renders in empty state */}
        <AddStudentDialog 
          isOpen={isAddOpen} 
          onOpenChange={setIsAddOpen} 
          form={addForm} 
          onSubmit={handleAddSubmit} 
          isPending={addMutation.isPending} 
        />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Data Table
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Roster <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">{students.length}</span>
        </h2>
        <Button onClick={() => setIsAddOpen(true)} className="bg-pink-600 hover:bg-pink-700">
          <Plus className="mr-2 h-5 w-5" />
          Add Student
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px]">Name</TableHead>
              <TableHead>Student No.</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[70px] text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => (
              <TableRow 
                key={student.id} 
                className={`group transition-colors hover:bg-gray-50 ${
                  student.id.startsWith("temp-") ? "opacity-60" : ""
                }`}
              >
                <TableCell className="font-medium text-gray-900">
                  {student.fullName}
                  {student.id.startsWith("temp-") && (
                    <Loader2 className="ml-2 inline h-3 w-3 animate-spin text-gray-400" />
                  )}
                </TableCell>
                <TableCell className="text-gray-500">
                  {student.studentNumber || "—"}
                </TableCell>
                <TableCell className="text-gray-500">
                  {student.notes || "—"}
                </TableCell>
                <TableCell className="text-right">
                  {!student.id.startsWith("temp-") && (
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex h-9 w-9 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 data-[state=open]:opacity-100 hover:bg-gray-100">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-5 w-5 text-gray-500" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[180px]">
                        <DropdownMenuItem onClick={() => openEditDialog(student)} className="py-2 text-base">
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="py-2 text-base text-red-600 focus:text-red-600 focus:bg-red-50"
                          onClick={() => setStudentToRemove(student.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddStudentDialog 
        isOpen={isAddOpen} 
        onOpenChange={setIsAddOpen} 
        form={addForm} 
        onSubmit={handleAddSubmit} 
        isPending={addMutation.isPending} 
      />

      <EditStudentDialog 
        isOpen={!!editStudent} 
        onOpenChange={(open: boolean) => !open && setEditStudent(null)} 
        form={editForm} 
        onSubmit={handleEditSubmit} 
        isPending={updateMutation.isPending} 
      />

      <ConfirmDialog
        isOpen={!!studentToRemove}
        onOpenChange={(open) => !open && setStudentToRemove(null)}
        title="Remove Student"
        description="Are you sure you want to remove this student from the class? Their attendance and gradebook records will be permanently deleted. This action cannot be undone."
        confirmText="Remove Student"
        variant="danger"
        isLoading={removeMutation.isPending}
        onConfirm={handleRemove}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialog Sub-components (for cleaner file structure)
// ---------------------------------------------------------------------------

function AddStudentDialog({ isOpen, onOpenChange, form, onSubmit, isPending }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Student</DialogTitle>
          <DialogDescription>
            Add a new student to this class roster.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="add-fullName">Full Name</Label>
            <Input id="add-fullName" {...form.register("fullName")} placeholder="Jane Doe" className="focus-visible:ring-pink-500" />
            {form.formState.errors.fullName && <p className="text-xs text-red-600">{form.formState.errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-studentNumber">Student Number (Optional)</Label>
            <Input id="add-studentNumber" {...form.register("studentNumber")} placeholder="ST-1002" className="focus-visible:ring-pink-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-notes">Notes (Optional)</Label>
            <Textarea id="add-notes" {...form.register("notes")} placeholder="Accommodations, behaviors, etc." className="resize-none focus-visible:ring-pink-500" />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-pink-600 hover:bg-pink-700">
              {isPending ? "Adding..." : "Add Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditStudentDialog({ isOpen, onOpenChange, form, onSubmit, isPending }: any) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Make changes to the student's profile.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-fullName">Full Name</Label>
            <Input id="edit-fullName" {...form.register("fullName")} className="focus-visible:ring-pink-500" />
            {form.formState.errors.fullName && <p className="text-xs text-red-600">{form.formState.errors.fullName.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-studentNumber">Student Number</Label>
            <Input id="edit-studentNumber" {...form.register("studentNumber")} className="focus-visible:ring-pink-500" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea id="edit-notes" {...form.register("notes")} className="resize-none focus-visible:ring-pink-500" />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-pink-600 hover:bg-pink-700">
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
