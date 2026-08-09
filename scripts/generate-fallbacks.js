const fs = require('fs');
const path = require('path');

const routes = [
  'dashboard',
  'classes',
  'attendance',
  'gradebook',
  'lesson-plans',
  'remarks',
  'audit-logs',
  'settings'
];

const basePath = path.join(__dirname, '..', 'src', 'app', '(dashboard)');

const loadingContent = `export default function Loading() {
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
`;

const errorContent = `"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-red-200 bg-red-50/50 p-8 text-center animate-in fade-in">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong!</h2>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        {error.message || "An unexpected error occurred while loading this page. Please try again."}
      </p>
      <Button 
        onClick={() => reset()}
        className="bg-pink-600 hover:bg-pink-700 text-white"
      >
        Try again
      </Button>
    </div>
  );
}
`;

routes.forEach(route => {
  const routePath = path.join(basePath, route);
  if (!fs.existsSync(routePath)) {
    fs.mkdirSync(routePath, { recursive: true });
  }

  const loadingPath = path.join(routePath, 'loading.tsx');
  fs.writeFileSync(loadingPath, loadingContent, 'utf8');

  const errorPath = path.join(routePath, 'error.tsx');
  fs.writeFileSync(errorPath, errorContent, 'utf8');
});

console.log('Fallbacks generated successfully.');
