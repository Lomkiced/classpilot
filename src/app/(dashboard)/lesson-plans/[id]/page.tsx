import { notFound } from "next/navigation";
import { getLessonPlan } from "@/server/actions/lesson-plans";
import { getClassGroups } from "@/server/actions/classes";
import { LessonPlanForm } from "@/components/lesson-plans/lesson-plan-form";
import { getLessonPlanFileUrl } from "@/lib/supabase/storage";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LessonPlanEditorPage({ params }: PageProps) {
  const awaitedParams = await params;
  const isNew = awaitedParams.id === "new";

  let plan = null;
  if (!isNew) {
    try {
      plan = await getLessonPlan(awaitedParams.id);
    } catch (e) {
      notFound();
    }
  }

  let signedUrl = null;
  if (plan && plan.sourceFileUrl) {
    try {
      signedUrl = await getLessonPlanFileUrl(plan.sourceFileUrl);
    } catch (err) {
      console.error("Failed to generate signed url:", err);
    }
  }

  const classes = await getClassGroups();

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-500 pb-20">
      <LessonPlanForm initialData={plan as any} classes={classes} sourceFileSignedUrl={signedUrl} />
    </div>
  );
}
