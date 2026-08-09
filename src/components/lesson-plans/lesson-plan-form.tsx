"use client";

import { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Trash2, Save, Download, ArrowLeft, Send, AlertCircle, FileText, ExternalLink } from "lucide-react";

import { lessonPlanSchema, type LessonPlanInput } from "@/lib/validations/lesson-plans";
import { createLessonPlan, updateLessonPlan, updateLessonPlanStatus } from "@/server/actions/lesson-plans";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LessonPlanFormProps {
  initialData: any | null; // Prisma model shape
  classes: { id: string; name: string }[];
  sourceFileSignedUrl?: string | null;
}

export function LessonPlanForm({ initialData, classes, sourceFileSignedUrl }: LessonPlanFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDownloading, setIsDownloading] = useState(false);
  const isNew = !initialData;

  const form = useForm<LessonPlanInput>({
    resolver: zodResolver(lessonPlanSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      classGroupId: initialData.classGroupId,
      month: new Date(initialData.month),
      objectives: initialData.objectives,
      materials: initialData.materials,
      procedure: initialData.procedure, // JSON array from Prisma perfectly matches Zod
      assessmentNotes: initialData.assessmentNotes,
      additionalNotes: initialData.additionalNotes || "",
    } : {
      title: "",
      classGroupId: classes[0]?.id || "",
      month: new Date(),
      objectives: "",
      materials: "",
      procedure: [{ value: "" }],
      assessmentNotes: "",
      additionalNotes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "procedure",
  });

  const onSubmit = (data: LessonPlanInput) => {
    startTransition(async () => {
      try {
        if (isNew) {
          const res = await createLessonPlan(data);
          if (res.success) {
            toast.success("Lesson plan created");
            router.push(`/lesson-plans/${res.data.id}`);
          }
        } else {
          const res = await updateLessonPlan(initialData.id, data);
          if (res.success) {
            toast.success("Draft saved");
            router.refresh();
          }
        }
      } catch (err) {
        toast.error("Failed to save lesson plan");
      }
    });
  };

  const handleStatusChange = (newStatus: "SUBMITTED" | "DRAFT") => {
    if (isNew) return;
    startTransition(async () => {
      try {
        const res = await updateLessonPlanStatus(initialData.id, newStatus);
        if (res.success) {
          toast.success(`Status updated to ${newStatus.toLowerCase()}`);
          router.refresh();
        }
      } catch (err) {
        toast.error("Failed to update status");
      }
    });
  };

  const handleDownloadPDF = async () => {
    if (isNew) return;
    setIsDownloading(true);
    try {
      // Create a temporary hidden anchor to trigger download from our API route
      const url = `/api/lesson-plans/${initialData.id}/pdf`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `LessonPlan_${initialData.title.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Download started");
    } catch (e) {
      toast.error("Failed to download PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/lesson-plans" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Link>
        <div className="flex items-center gap-2">
          {!isNew && (
            <>
              {initialData.status === "DRAFT" ? (
                <Button type="button" variant="outline" onClick={() => handleStatusChange("SUBMITTED")} disabled={isPending} className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
                  <Send className="mr-2 h-4 w-4" />
                  Mark as Submitted
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={() => handleStatusChange("DRAFT")} disabled={isPending}>
                  Revert to Draft
                </Button>
              )}
              <Button type="button" variant="secondary" onClick={handleDownloadPDF} disabled={isDownloading} className="bg-gray-100 text-gray-900 hover:bg-gray-200">
                <Download className="mr-2 h-4 w-4" />
                {isDownloading ? "Generating..." : "Export PDF"}
              </Button>
            </>
          )}
          <Button type="submit" disabled={isPending} className="bg-pink-600 hover:bg-pink-700">
            <Save className="mr-2 h-4 w-4" />
            {isPending ? "Saving..." : "Save Draft"}
          </Button>
        </div>
      </div>

      {/* Extraction Status Banners */}
      {initialData && initialData.extractionStatus === "PARTIAL" && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
          <div className="text-sm text-yellow-800">
            <span className="font-semibold">Review needed:</span> This plan was auto-extracted from your upload, but some sections were missing or unclear. Please review the fields below before saving.
          </div>
        </div>
      )}
      
      {initialData && initialData.extractionStatus === "FAILED" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div className="text-sm text-red-800">
            <span className="font-semibold">Extraction failed:</span> We couldn't fully process this file. Your original content was preserved in the <strong>Additional Notes</strong> section below. Please organize it into the correct fields.
          </div>
        </div>
      )}

      {/* Editor Document Container */}
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        
        {/* Source File Link */}
        {initialData && sourceFileSignedUrl && (
          <div className="mb-8 flex justify-end">
            <a 
              href={sourceFileSignedUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm font-medium text-pink-600 hover:text-pink-700 bg-pink-50 px-3 py-1.5 rounded-lg transition-colors"
            >
              <FileText className="mr-2 h-4 w-4" />
              View original uploaded file
              <ExternalLink className="ml-2 h-3 w-3" />
            </a>
          </div>
        )}

        {/* Title & Meta Header */}
        <div className="space-y-6 border-b border-gray-100 pb-8">
          <div>
            <Input
              {...form.register("title")}
              placeholder="Untitled Lesson Plan"
              className="h-auto border-transparent bg-transparent px-0 text-3xl font-bold tracking-tight text-gray-900 shadow-none focus-visible:ring-0 focus-visible:border-transparent placeholder:text-gray-300"
            />
            {form.formState.errors.title && <p className="mt-1 text-sm text-red-600">{form.formState.errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-gray-500">Class Group</Label>
              <Select onValueChange={(val) => form.setValue("classGroupId", val)} value={form.watch("classGroupId")}>
                <SelectTrigger className="border-gray-200 shadow-none focus:ring-pink-500">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs uppercase tracking-wider text-gray-500">Month</Label>
              <Input 
                type="month" 
                {...form.register("month", { valueAsDate: true })} 
                className="border-gray-200 shadow-none focus-visible:ring-pink-500" 
              />
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 pt-8">
          
          <section className="space-y-3">
            <Label className="text-lg font-semibold text-gray-900">Objectives</Label>
            <p className="text-sm text-gray-500">What will students learn or be able to do?</p>
            <Textarea 
              {...form.register("objectives")} 
              className="min-h-[100px] resize-y border-gray-200 shadow-none focus-visible:ring-pink-500" 
              placeholder="Students will be able to..."
            />
          </section>

          <section className="space-y-3">
            <Label className="text-lg font-semibold text-gray-900">Materials Needed</Label>
            <Textarea 
              {...form.register("materials")} 
              className="min-h-[80px] resize-y border-gray-200 shadow-none focus-visible:ring-pink-500" 
              placeholder="Textbooks, worksheets, props..."
            />
          </section>

          <section className="space-y-3">
            <Label className="text-lg font-semibold text-gray-900">Procedure</Label>
            <p className="text-sm text-gray-500">Break down the lesson into step-by-step instructions.</p>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-3 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-gray-50 font-medium text-gray-500 border border-gray-200">
                    {index + 1}
                  </div>
                  <Textarea
                    {...form.register(`procedure.${index}.value`)}
                    className="min-h-[40px] border-gray-200 shadow-none focus-visible:ring-pink-500"
                    placeholder={`Step ${index + 1}...`}
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="h-10 w-10 shrink-0 text-gray-400 opacity-0 group-hover:opacity-100 hover:text-red-600 hover:bg-red-50 focus:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => append({ value: "" })} className="mt-2 border-dashed border-gray-300 text-gray-600 hover:border-pink-300 hover:text-pink-700">
                <Plus className="mr-2 h-4 w-4" /> Add Step
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <Label className="text-lg font-semibold text-gray-900">Assessment & Checking for Understanding</Label>
            <Textarea 
              {...form.register("assessmentNotes")} 
              className="min-h-[100px] resize-y border-gray-200 shadow-none focus-visible:ring-pink-500" 
              placeholder="How will you know if they achieved the objective?"
            />
          </section>

          <section className="space-y-3">
            <Label className="text-lg font-semibold text-gray-900">Additional Notes <span className="text-sm font-normal text-gray-400">(Optional)</span></Label>
            <Textarea 
              {...form.register("additionalNotes")} 
              className="min-h-[80px] resize-y border-gray-200 shadow-none focus-visible:ring-pink-500" 
              placeholder="Reminders, homework assignments, differentiation..."
            />
          </section>

        </div>
      </div>
    </form>
  );
}
