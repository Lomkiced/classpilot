import { GlobalLoader } from "@/components/ui/global-loader";

export default function DashboardLoading() {
  return (
    <div className="flex-1 w-full h-full bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <GlobalLoader />
    </div>
  );
}
