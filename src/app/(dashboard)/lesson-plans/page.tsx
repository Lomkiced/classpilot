import Link from "next/link";
import { Plus, FileText, Calendar } from "lucide-react";
import { getLessonPlans } from "@/server/actions/lesson-plans";
import { getClassGroups } from "@/server/actions/classes";

import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { UploadLessonPlanClient } from "./upload-client";

export default async function LessonPlansPage() {
  const plans = await getLessonPlans();
  const classes = await getClassGroups();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Lesson Plans</h1>
          <p className="text-base text-gray-500">Create, manage, and export your lesson plans.</p>
        </div>

        <div>
          <UploadLessonPlanClient classes={classes} />
        </div>
      </div>

      {/* Grid of Plans */}
      {plans.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-50">
            <FileText className="h-6 w-6 text-pink-300" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No lesson plans found</h3>
          <p className="mt-1 mb-6 max-w-sm text-base text-gray-500">
            Get started by creating your first lesson plan.
          </p>
          <Link href="/lesson-plans/new">
            <Button className="bg-pink-600 hover:bg-pink-700">
              <Plus className="mr-2 h-5 w-5" />
              Create Lesson Plan
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Link key={plan.id} href={`/lesson-plans/${plan.id}`}>
              <div className="group flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-pink-300 hover:shadow-md">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium uppercase tracking-wider text-pink-600">
                      {plan.classGroup.name}
                    </span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors line-clamp-2">
                      {plan.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {plan.sourceType === "UPLOADED" && (
                      <span title="Uploaded AI Draft" className="flex items-center justify-center h-6 w-6 rounded-full bg-purple-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-600"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                      </span>
                    )}
                    <Badge status={plan.status} />
                  </div>
                </div>
                
                <div className="mt-auto pt-6 flex items-center text-sm text-gray-500">
                  <Calendar className="mr-2 h-5 w-5" />
                  {format(new Date(plan.month), "MMMM yyyy")}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  if (status === "DRAFT") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        Draft
      </span>
    );
  }
  if (status === "SUBMITTED") {
    return (
      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
        Submitted
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
      Approved
    </span>
  );
}
