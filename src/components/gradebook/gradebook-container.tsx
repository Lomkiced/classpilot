"use client";

import { useSearchParams } from "next/navigation";
import { ClassSelector } from "@/components/gradebook/class-selector";
import { GradebookGrid } from "@/components/gradebook/gradebook-grid";

interface GradebookContainerProps {
  classes: { id: string; name: string }[];
}

export function GradebookContainer({ classes }: GradebookContainerProps) {
  const searchParams = useSearchParams();
  
  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm ring-1 ring-gray-950/5 text-center">
        <h2 className="text-xl font-bold text-gray-900">No classes found</h2>
        <p className="mt-2 text-sm text-gray-500">Add classes first to use the gradebook.</p>
      </div>
    );
  }

  // Derive active class from client URL state
  const classIdParam = searchParams.get("class");
  const activeClass = classes.find((c) => c.id === classIdParam) || classes[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gradebook</h1>
          <p className="text-sm text-gray-500">Manage scores and assessments for {activeClass.name}.</p>
        </div>

        <div className="flex items-center gap-3">
          <ClassSelector classes={classes} activeClassId={activeClass.id} />
        </div>
      </div>

      {/* Grid Area - The key prop guarantees complete unmount/remount on class change, preventing stale local state */}
      <div>
        <GradebookGrid key={activeClass.id} classGroupId={activeClass.id} />
      </div>
    </div>
  );
}
