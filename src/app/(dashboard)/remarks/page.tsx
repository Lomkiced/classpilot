import { redirect } from "next/navigation";
import { getClassGroups } from "@/server/actions/classes";
import { getRemarksForClass } from "@/server/actions/remarks";
import { ClassSelector } from "@/components/gradebook/class-selector";
import { RemarksList } from "@/components/remarks/remarks-list";
import { Download } from "lucide-react";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RemarksPage({ searchParams }: PageProps) {
  const classes = await getClassGroups();
  const awaitedSearchParams = await searchParams;

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
        <h2 className="text-xl font-bold text-gray-900">No classes found</h2>
        <p className="mt-2 text-base text-gray-500">You need to have classes before writing remarks.</p>
      </div>
    );
  }

  const activeClassId = (awaitedSearchParams.class as string) || classes[0].id;
  // Let the user specify grading period in URL or default to Term 1
  const activePeriod = (awaitedSearchParams.period as string) || "Term 1"; 

  const remarksData = await getRemarksForClass(activeClassId, activePeriod);
  const activeClass = classes.find(c => c.id === activeClassId)!;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-gray-200 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Report Remarks</h1>
          <p className="text-base text-gray-500">Write and manage end-of-term comments for your students.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* We reuse ClassSelector since it just updates the ?class param */}
          <ClassSelector classes={classes} activeClassId={activeClassId} />
        </div>
      </div>

      {/* Main List */}
      <RemarksList 
        initialData={remarksData} 
        classGroup={activeClass} 
        gradingPeriod={activePeriod} 
      />

    </div>
  );
}
