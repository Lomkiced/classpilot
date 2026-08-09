"use client";

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
