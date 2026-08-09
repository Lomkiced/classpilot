export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded-md bg-gray-200"></div>
          <div className="h-4 w-72 rounded-md bg-gray-100"></div>
        </div>
        <div className="h-10 w-32 rounded-md bg-gray-200 hidden sm:block"></div>
      </div>

      {/* Content Skeleton */}
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-6 w-1/4 rounded-md bg-gray-200"></div>
          <div className="h-32 w-full rounded-md bg-pink-50/50"></div>
          <div className="h-32 w-full rounded-md bg-gray-50"></div>
        </div>
      </div>
    </div>
  );
}
