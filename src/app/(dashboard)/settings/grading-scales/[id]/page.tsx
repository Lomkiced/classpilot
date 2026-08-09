import { notFound } from "next/navigation";
import { getGradingScale } from "@/server/actions/settings";
import { GradingScaleForm } from "@/components/settings/grading-scale-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function GradingScaleEditorPage({ params }: PageProps) {
  const awaitedParams = await params;
  const isNew = awaitedParams.id === "new";

  let scale = null;
  if (!isNew) {
    try {
      scale = await getGradingScale(awaitedParams.id);
    } catch (e) {
      notFound();
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-500 pb-20">
      <GradingScaleForm initialData={scale as any} />
    </div>
  );
}
