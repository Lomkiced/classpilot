import { getGradingScales } from "@/server/actions/settings";
import { GradingScalesList } from "@/components/settings/grading-scales-list";
import { Settings as SettingsIcon } from "lucide-react";

export default async function SettingsPage() {
  const scales = await getGradingScales();

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center">
          <SettingsIcon className="mr-3 h-6 w-6 text-gray-400" />
          Settings
        </h1>
        <p className="text-base text-gray-500">Configure your classroom preferences and grading systems.</p>
      </div>

      {/* Sections */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Grading Scales</h2>
          <GradingScalesList initialData={scales} />
        </div>
      </div>

    </div>
  );
}
