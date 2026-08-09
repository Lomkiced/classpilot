"use client";

import { useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { gradingScaleSchema, type GradingScaleInput } from "@/lib/validations/settings";
import { upsertGradingScale } from "@/server/actions/settings";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface GradingScaleFormProps {
  initialData: any | null; 
}

export function GradingScaleForm({ initialData }: GradingScaleFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<GradingScaleInput>({
    resolver: zodResolver(gradingScaleSchema),
    defaultValues: initialData ? {
      name: initialData.name,
      bands: initialData.bands,
    } : {
      name: "",
      bands: [
        { label: "Grade 4", minPercent: 80, maxPercent: 100 },
        { label: "Grade 3.5", minPercent: 75, maxPercent: 79.9 },
        { label: "Grade 3", minPercent: 70, maxPercent: 74.9 },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bands",
  });

  const onSubmit = (data: GradingScaleInput) => {
    startTransition(async () => {
      try {
        const res = await upsertGradingScale(initialData?.id || null, data);
        if (res.success) {
          toast.success("Grading scale saved");
          router.push("/settings");
          router.refresh();
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to save grading scale");
      }
    });
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/settings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to settings
        </Link>
        <Button type="submit" disabled={isPending} className="bg-pink-600 hover:bg-pink-700">
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save Scale"}
        </Button>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
        <div className="space-y-8">
          
          <div>
            <Label className="text-lg font-semibold text-gray-900 mb-2 block">Scale Name</Label>
            <Input
              {...form.register("name")}
              placeholder="e.g. Thai Primary Scale"
              className="max-w-md h-12 text-lg border-gray-200 focus-visible:ring-pink-500"
            />
            {form.formState.errors.name && <p className="mt-1 text-sm text-red-600">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <Label className="text-lg font-semibold text-gray-900 block">Grade Bands</Label>
                <p className="text-sm text-gray-500">Define the percentage ranges for each band.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ label: "", minPercent: 0, maxPercent: 0 })} className="text-gray-600 border-dashed hover:border-pink-300 hover:text-pink-600">
                <Plus className="mr-1 h-4 w-4" /> Add Band
              </Button>
            </div>

            <div className="space-y-3">
              {form.formState.errors.bands?.root && (
                <p className="text-sm text-red-600">{form.formState.errors.bands.root.message}</p>
              )}
              
              <div className="grid grid-cols-12 gap-3 text-xs font-medium uppercase tracking-wider text-gray-500 px-1">
                <div className="col-span-5">Label (e.g. "Grade 4", "A")</div>
                <div className="col-span-3">Min %</div>
                <div className="col-span-3">Max %</div>
                <div className="col-span-1"></div>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-12 gap-3 group items-center bg-gray-50/50 p-2 rounded-md border border-gray-100">
                  <div className="col-span-5">
                    <Input
                      {...form.register(`bands.${index}.label`)}
                      placeholder="Label"
                      className="h-9 border-gray-200 focus-visible:ring-pink-500 bg-white"
                    />
                  </div>
                  <div className="col-span-3 relative">
                    <Input
                      type="number"
                      step="0.1"
                      {...form.register(`bands.${index}.minPercent`)}
                      className="h-9 border-gray-200 focus-visible:ring-pink-500 bg-white pr-6"
                    />
                    <span className="absolute right-2 top-2 text-gray-400 text-sm">%</span>
                  </div>
                  <div className="col-span-3 relative">
                    <Input
                      type="number"
                      step="0.1"
                      {...form.register(`bands.${index}.maxPercent`)}
                      className="h-9 border-gray-200 focus-visible:ring-pink-500 bg-white pr-6"
                    />
                    <span className="absolute right-2 top-2 text-gray-400 text-sm">%</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => remove(index)}
                      disabled={fields.length === 1}
                      className="h-9 w-9 text-gray-400 hover:text-red-600 hover:bg-red-50 focus:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </form>
  );
}
