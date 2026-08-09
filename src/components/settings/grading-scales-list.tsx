"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus, CheckCircle2, Circle, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setActiveGradingScale, deleteGradingScale } from "@/server/actions/settings";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface GradingScalesListProps {
  initialData: any[]; // Array of GradingScale + bands
}

export function GradingScalesList({ initialData }: GradingScalesListProps) {
  const [isPending, startTransition] = useTransition();
  const [scaleToDelete, setScaleToDelete] = useState<string | null>(null);

  const handleSetActive = (id: string) => {
    startTransition(async () => {
      try {
        await setActiveGradingScale(id);
        toast.success("Active grading scale updated");
      } catch (e: any) {
        toast.error(e.message || "Failed to update active scale");
      }
    });
  };

  const handleDelete = () => {
    if (!scaleToDelete) return;
    startTransition(async () => {
      try {
        await deleteGradingScale(scaleToDelete);
        toast.success("Grading scale deleted");
        setScaleToDelete(null);
      } catch (e: any) {
        toast.error(e.message || "Failed to delete scale");
      }
    });
  };

  return (
    <div className="space-y-4">
      {initialData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center bg-gray-50/50">
          <p className="text-sm text-gray-500 mb-4">You don't have any grading scales configured.</p>
          <Link href="/settings/grading-scales/new">
            <Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="mr-2 h-4 w-4" />
              Create Grading Scale
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {initialData.map((scale) => (
            <div 
              key={scale.id} 
              className={`relative flex flex-col rounded-xl border p-6 transition-all ${
                scale.isActive 
                  ? "border-pink-500 bg-pink-50/10 shadow-sm ring-1 ring-pink-500/20" 
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-gray-900">{scale.name}</h3>
                  <p className="text-xs text-gray-500">{scale.bands.length} bands configured</p>
                </div>
                {scale.isActive ? (
                  <span className="inline-flex items-center text-xs font-medium text-pink-600">
                    <CheckCircle2 className="mr-1 h-4 w-4" /> Active
                  </span>
                ) : (
                  <button 
                    onClick={() => handleSetActive(scale.id)} 
                    disabled={isPending}
                    className="inline-flex items-center text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors"
                  >
                    <Circle className="mr-1 h-4 w-4" /> Set Active
                  </button>
                )}
              </div>

              <div className="mt-auto pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <Link href={`/settings/grading-scales/${scale.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 text-gray-500 hover:text-gray-900">
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                </Link>
                {!scale.isActive && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setScaleToDelete(scale.id)} 
                    disabled={isPending}
                    aria-label={`Delete ${scale.name}`}
                    className="h-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-6">
            <Link href="/settings/grading-scales/new">
              <Button variant="outline" className="border-gray-300 text-gray-600 hover:bg-white hover:text-gray-900">
                <Plus className="mr-2 h-4 w-4" />
                Add New Scale
              </Button>
            </Link>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!scaleToDelete}
        onOpenChange={(open) => !open && setScaleToDelete(null)}
        title="Delete Grading Scale"
        description="Are you sure you want to delete this grading scale? Any existing remarks using this scale will lose their association. This action cannot be undone."
        confirmText="Delete Scale"
        variant="danger"
        isLoading={isPending}
        onConfirm={handleDelete}
      />
    </div>
  );
}
