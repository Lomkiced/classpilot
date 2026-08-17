"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { ClassSelector } from "@/components/gradebook/class-selector";
import { GradebookGrid } from "@/components/gradebook/gradebook-grid";

import type { GradebookPayload } from "@/hooks/use-gradebook";

interface GradebookContainerProps {
  classes: { id: string; name: string }[];
  initialData?: GradebookPayload | null;
}

export function GradebookContainer({ classes, initialData }: GradebookContainerProps) {
  const searchParams = useSearchParams();
  const [activeTerm, setActiveTerm] = useState<"TERM_1" | "TERM_2" | "ALL">("TERM_1");
  
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Gradebook</h1>
          <p className="text-sm text-gray-500">Manage scores and assessments for {activeClass.name}.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="inline-flex items-center rounded-lg bg-gray-100 p-1 text-sm font-medium">
            <button
              onClick={() => setActiveTerm("TERM_1")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTerm === "TERM_1" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Term 1
            </button>
            <button
              onClick={() => setActiveTerm("TERM_2")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTerm === "TERM_2" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Term 2
            </button>
            <button
              onClick={() => setActiveTerm("ALL")}
              className={`rounded-md px-3 py-1.5 transition-all ${
                activeTerm === "ALL" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Full Year
            </button>
          </div>
          <ClassSelector classes={classes} activeClassId={activeClass.id} />
        </div>
      </div>

      {/* Grid Area - The key prop guarantees complete unmount/remount on class or term change, preventing stale local state */}
      <div>
        <GradebookGrid key={`${activeClass.id}-${activeTerm}`} classGroupId={activeClass.id} activeTerm={activeTerm} initialData={activeTerm === "TERM_1" ? initialData : undefined} />
      </div>
    </div>
  );
}
