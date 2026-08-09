"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, getDaysInMonth } from "date-fns";
import { toast } from "sonner";
import { Calendar as CalendarIcon, CheckCircle2, Clock, XCircle, FileWarning, Download, LayoutList, CalendarDays } from "lucide-react";
import { upsertAttendanceRecord, batchMarkAttendance } from "@/server/actions/attendance";

const AttendanceStatus = {
  PRESENT: "PRESENT",
  LATE: "LATE",
  ABSENT: "ABSENT",
  EXCUSED: "EXCUSED"
} as const;

type AttendanceStatus = typeof AttendanceStatus[keyof typeof AttendanceStatus];

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AttendanceRecord = {
  id: string;
  classGroupId: string;
  studentId: string;
  date: Date;
  status: AttendanceStatus;
  notes: string | null;
};

type StudentData = {
  student: {
    id: string;
    fullName: string;
    studentNumber: string | null;
  };
  record: AttendanceRecord | null;
};

interface AttendanceClientProps {
  classes: any[];
  mode: "daily" | "monthly";
  dailyData: StudentData[];
  monthlyData: any;
  selectedClassId: string;
  selectedDate: string; // ISO String
}

export function AttendanceClient({ classes, mode, dailyData, monthlyData, selectedClassId, selectedDate }: AttendanceClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticData, setOptimisticData] = useState<StudentData[]>(dailyData);

  // Sync state if props change (when navigating)
  if (dailyData !== optimisticData && !isPending && mode === "daily") {
    setOptimisticData(dailyData);
  }

  const currentDateObj = new Date(selectedDate);
  const currentYear = currentDateObj.getUTCFullYear();
  const currentMonth = currentDateObj.getUTCMonth() + 1;

  const handleClassChange = (classId: string | null) => {
    if (!classId) return;
    router.push(`/attendance?mode=${mode}&classId=${classId}&date=${format(currentDateObj, "yyyy-MM-dd")}`);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    router.push(`/attendance?mode=${mode}&classId=${selectedClassId}&date=${e.target.value}`);
  };

  const handleModeChange = (newMode: "daily" | "monthly") => {
    router.push(`/attendance?mode=${newMode}&classId=${selectedClassId}&date=${format(currentDateObj, "yyyy-MM-dd")}`);
  };

  const handleDownloadPDF = () => {
    window.open(`/api/attendance/pdf?classId=${selectedClassId}&year=${currentYear}&month=${currentMonth}`, "_blank");
  };

  const handleMarkStatus = async (studentId: string, status: AttendanceStatus) => {
    // Optimistic Update
    const previousData = [...optimisticData];
    setOptimisticData((prev) =>
      prev.map((item) =>
        item.student.id === studentId
          ? {
              ...item,
              record: {
                ...item.record,
                status,
                studentId,
                classGroupId: selectedClassId,
                date: currentDateObj,
              } as AttendanceRecord,
            }
          : item
      )
    );

    startTransition(async () => {
      try {
        const result = await upsertAttendanceRecord({
          classGroupId: selectedClassId,
          studentId,
          date: currentDateObj,
          status,
        });

        if (!result.success) {
          toast.error("Failed to mark attendance.");
          setOptimisticData(previousData);
        }
      } catch (e) {
        toast.error("An error occurred.");
        setOptimisticData(previousData);
      }
    });
  };

  const handleMarkAllPresent = () => {
    // Optimistic Update for unmarked students
    const previousData = [...optimisticData];
    setOptimisticData((prev) =>
      prev.map((item) =>
        item.record ? item : {
          ...item,
          record: {
            id: "temp",
            status: AttendanceStatus.PRESENT,
            studentId: item.student.id,
            classGroupId: selectedClassId,
            date: currentDateObj,
            notes: null
          }
        }
      )
    );

    startTransition(async () => {
      try {
        const result = await batchMarkAttendance({
          classGroupId: selectedClassId,
          date: currentDateObj,
          status: AttendanceStatus.PRESENT,
        });

        if (result.success) {
          toast.success(`Marked ${result.count} students as Present.`);
        }
      } catch (e) {
        toast.error("Failed to batch mark attendance.");
        setOptimisticData(previousData);
      }
    });
  };

  if (classes.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12 text-center">
        <div className="rounded-full bg-gray-100 p-4">
          <CalendarIcon className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900">No classes found</h3>
        <p className="mt-2 text-gray-500">Create a class group first to start tracking attendance.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Top Bar: Tabs & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg w-full sm:w-auto">
          <button
            onClick={() => handleModeChange("daily")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === "daily" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <LayoutList className="h-4 w-4" />
            Daily Mode
          </button>
          <button
            onClick={() => handleModeChange("monthly")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              mode === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            Monthly Report
          </button>
        </div>

        {/* Global Action Button based on mode */}
        {mode === "daily" ? (
          <Button 
            onClick={handleMarkAllPresent}
            disabled={isPending || optimisticData.every(s => s.record !== null)}
            className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
          >
            Mark Remaining Present
          </Button>
        ) : (
          <Button 
            onClick={handleDownloadPDF}
            className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
        )}
      </div>

      {/* Filters Bar */}
      <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label className="text-gray-600">Class Group</Label>
          <Select disabled={isPending} value={selectedClassId} onValueChange={handleClassChange}>
            <SelectTrigger className="w-full sm:max-w-xs border-gray-200 bg-gray-50">
              <span className="flex flex-1 text-left line-clamp-1">
                {selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : "Select class"}
              </span>
            </SelectTrigger>
            <SelectContent>
              {classes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-1.5">
          <Label className="text-gray-600">{mode === "daily" ? "Date" : "Month"}</Label>
          <Input 
            type={mode === "daily" ? "date" : "month"} 
            value={mode === "daily" 
              ? format(currentDateObj, "yyyy-MM-dd") 
              : format(currentDateObj, "yyyy-MM")}
            onChange={handleDateChange}
            disabled={isPending}
            className="w-full sm:max-w-xs border-gray-200 bg-gray-50"
          />
        </div>
      </Card>

      {/* Roster View */}
      {mode === "daily" ? (
        <Card className="overflow-hidden border-gray-200 shadow-sm">
          <div className="divide-y divide-gray-100">
            {optimisticData.map(({ student, record }) => (
              <div key={student.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex flex-col mb-4 sm:mb-0">
                  <span className="font-semibold text-gray-900">{student.fullName}</span>
                  {student.studentNumber && (
                    <span className="text-sm text-gray-500">#{student.studentNumber}</span>
                  )}
                </div>

                {/* Segmented Control for Status */}
                <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100/50 p-1">
                  <StatusButton 
                    label="Present" 
                    icon={CheckCircle2}
                    isActive={record?.status === AttendanceStatus.PRESENT}
                    activeClass="bg-green-100 text-green-700 shadow-sm border border-green-200"
                    onClick={() => handleMarkStatus(student.id, AttendanceStatus.PRESENT)}
                  />
                  <StatusButton 
                    label="Late" 
                    icon={Clock}
                    isActive={record?.status === AttendanceStatus.LATE}
                    activeClass="bg-yellow-100 text-yellow-700 shadow-sm border border-yellow-200"
                    onClick={() => handleMarkStatus(student.id, AttendanceStatus.LATE)}
                  />
                  <StatusButton 
                    label="Absent" 
                    icon={XCircle}
                    isActive={record?.status === AttendanceStatus.ABSENT}
                    activeClass="bg-red-100 text-red-700 shadow-sm border border-red-200"
                    onClick={() => handleMarkStatus(student.id, AttendanceStatus.ABSENT)}
                  />
                  <StatusButton 
                    label="Excused" 
                    icon={FileWarning}
                    isActive={record?.status === AttendanceStatus.EXCUSED}
                    activeClass="bg-blue-100 text-blue-700 shadow-sm border border-blue-200"
                    onClick={() => handleMarkStatus(student.id, AttendanceStatus.EXCUSED)}
                  />
                </div>
              </div>
            ))}
            {optimisticData.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No students enrolled in this class.
              </div>
            )}
          </div>
        </Card>
      ) : (
        <MonthlyGrid monthlyData={monthlyData} year={currentYear} month={currentMonth} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers & Sub-components
// ---------------------------------------------------------------------------

function StatusButton({ label, icon: Icon, isActive, activeClass, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
        isActive 
          ? activeClass 
          : "text-gray-500 hover:bg-gray-200/50 hover:text-gray-900"
      }`}
    >
      <Icon className={`h-4 w-4 ${isActive ? "" : "opacity-60"}`} />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{label.charAt(0)}</span>
    </button>
  );
}

function MonthlyGrid({ monthlyData, year, month }: { monthlyData: any, year: number, month: number }) {
  if (!monthlyData) return null;

  const daysInMonth = getDaysInMonth(new Date(year, month - 1));
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return "text-green-700 bg-green-100 border border-green-200/50";
      case AttendanceStatus.LATE: return "text-yellow-700 bg-yellow-100 border border-yellow-200/50";
      case AttendanceStatus.ABSENT: return "text-red-700 bg-red-100 border border-red-200/50";
      case AttendanceStatus.EXCUSED: return "text-blue-700 bg-blue-100 border border-blue-200/50";
      default: return "bg-gray-50/50 border border-gray-100";
    }
  };

  const getStatusChar = (status: string) => {
    switch (status) {
      case AttendanceStatus.PRESENT: return "P";
      case AttendanceStatus.LATE: return "L";
      case AttendanceStatus.ABSENT: return "A";
      case AttendanceStatus.EXCUSED: return "E";
      default: return "";
    }
  };

  return (
    <Card className="border-gray-200 shadow-sm bg-white overflow-hidden">
      {/* We use a flex layout to ensure it fits the container exactly, squeezing if necessary */}
      <div className="flex flex-col w-full">
        {/* Header */}
        <div className="flex border-b border-gray-200 bg-gray-50/80">
          <div className="w-[180px] shrink-0 p-3 text-xs font-semibold text-gray-700 border-r border-gray-200 flex items-center">
            Student Name
          </div>
          <div className="flex flex-1">
            {days.map(day => (
              <div key={day} className="flex-1 border-r border-gray-100 flex items-center justify-center p-1">
                <span className="text-[10px] font-medium text-gray-500">{day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-col divide-y divide-gray-100">
          {monthlyData.students.map((item: any) => {
            const recordMap = new Map<number, string>(item.records.map((r: any) => [new Date(r.date).getUTCDate(), r.status]));
            
            return (
              <div key={item.student.id} className="flex hover:bg-gray-50/50 transition-colors group">
                <div className="w-[180px] shrink-0 p-3 border-r border-gray-200 flex items-center">
                  <span className="text-xs font-medium text-gray-900 truncate pr-2 group-hover:text-blue-600 transition-colors">
                    {item.student.fullName}
                  </span>
                </div>
                <div className="flex flex-1">
                  {days.map(day => {
                    const status = recordMap.get(day);
                    return (
                      <div key={day} className="flex-1 border-r border-gray-100 flex items-center justify-center p-[2px] sm:p-1">
                        <div className={`w-full aspect-square max-w-[24px] max-h-[24px] flex items-center justify-center rounded-[4px] text-[10px] font-bold transition-all ${getStatusStyle(status || "")}`}>
                          {getStatusChar(status || "")}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {monthlyData.students.length === 0 && (
            <div className="p-8 text-center text-sm text-gray-500">
              No students enrolled in this class.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
