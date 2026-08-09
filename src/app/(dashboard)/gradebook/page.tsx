import Link from "next/link";
import { getClassGroups } from "@/server/actions/classes";
import { GradebookGrid } from "@/components/gradebook/gradebook-grid";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// We need a small client wrapper for the Select to manipulate the URL, 
// or we can just use pills like the Classes page for consistency. 
// The prompt mentioned "class + assessment-type selector dropdowns at the top (shadcn Select)".
import { ClassSelector } from "@/components/gradebook/class-selector";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function GradebookPage({ searchParams }: PageProps) {
  const classes = await getClassGroups();
  const awaitedSearchParams = await searchParams;

  // No classes state (before running seed script)
  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm ring-1 ring-gray-950/5 text-center">
        <h2 className="text-xl font-bold text-gray-900">No classes found</h2>
        <p className="mt-2 text-sm text-gray-500">Add classes first to use the gradebook.</p>
      </div>
    );
  }

  // Determine active class from URL search param `?class=<id>`
  const activeClassParam = awaitedSearchParams.class as string;
  const activeClass = classes.find((c) => c.id === activeClassParam) || classes[0];

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

      {/* Grid Area */}
      <div>
        <GradebookGrid classGroupId={activeClass.id} />
      </div>

    </div>
  );
}
