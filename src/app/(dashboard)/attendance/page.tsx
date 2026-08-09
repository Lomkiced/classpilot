import { Suspense } from "react";
import { getClassGroups } from "@/server/actions/classes";
import { getAttendanceForDate, getMonthlyAttendance } from "@/server/actions/attendance";
import { AttendanceClient } from "@/components/attendance/attendance-client";

export const metadata = {
  title: "ClassPilot - Attendance",
};

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ classId?: string; date?: string; mode?: string }>;
}) {
  const params = await searchParams;
  const classes = await getClassGroups();

  const selectedClassId = params.classId || (classes.length > 0 ? classes[0].id : "");
  const mode = params.mode || "daily";
  
  // Default to today if no date provided
  let selectedDate = new Date();
  if (params.date) {
    const parsed = new Date(params.date);
    if (!isNaN(parsed.getTime())) {
      selectedDate = parsed;
    }
  }
  
  // Normalize date for safe fetching
  selectedDate.setUTCHours(0, 0, 0, 0);

  let dailyData: any[] = [];
  let monthlyData: any = null;

  if (selectedClassId) {
    try {
      if (mode === "daily") {
        dailyData = await getAttendanceForDate(selectedClassId, selectedDate);
      } else {
        monthlyData = await getMonthlyAttendance(selectedClassId, selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + 1);
      }
    } catch (error) {
      console.error("Failed to load attendance", error);
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50/50">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">Track and manage daily student attendance.</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <Suspense fallback={<div className="flex h-64 items-center justify-center text-gray-400">Loading roster...</div>}>
          <AttendanceClient
            classes={classes}
            mode={mode as "daily" | "monthly"}
            dailyData={dailyData}
            monthlyData={monthlyData}
            selectedClassId={selectedClassId}
            selectedDate={selectedDate.toISOString()}
          />
        </Suspense>
      </div>
    </div>
  );
}
