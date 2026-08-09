import Link from "next/link";
import { format } from "date-fns";
import { ensureTeacher } from "@/server/actions/teacher";
import { getDashboardMetrics } from "@/server/actions/dashboard";
import { FileText, Users, GraduationCap, CheckSquare, ChevronRight, Activity } from "lucide-react";

export default async function DashboardPage() {
  const teacher = await ensureTeacher();
  const teacherName = teacher?.name || "Educator";
  const firstName = teacherName.split(" ")[0];

  const metrics = await getDashboardMetrics();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Overview</h1>
          <p className="mt-1 text-base text-gray-500">Welcome back, {firstName}. Here's your summary for today.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <SummaryCard 
          value={metrics.lessonPlansDue} 
          label="Lesson Plans Due" 
          icon={<FileText className="h-5 w-5 text-pink-500" />} 
        />
        <SummaryCard 
          value={metrics.totalClasses} 
          label="Classes" 
          icon={<Users className="h-5 w-5 text-blue-500" />} 
        />
        <SummaryCard 
          value={metrics.totalStudents} 
          label="Total Students" 
          icon={<GraduationCap className="h-5 w-5 text-green-500" />} 
        />
        <SummaryCard 
          value={metrics.pendingScores} 
          label="Pending Scores" 
          icon={<CheckSquare className="h-5 w-5 text-orange-500" />} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lesson Plan Status Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Lesson Plan Status</h3>
            <Link href="/lesson-plans" className="text-sm font-medium text-pink-600 hover:text-pink-700">
              View All
            </Link>
          </div>
          
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/5">
            {metrics.recentLessonPlans.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/50">
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Class</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Subject</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {metrics.recentLessonPlans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {plan.classGroup.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {plan.classGroup.subject}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={plan.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                No lesson plans found.
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm ring-1 ring-black/5">
            {metrics.recentActivity.length > 0 ? (
              <>
                <ul className="space-y-6">
                  {metrics.recentActivity.map((activity) => (
                    <li key={activity.id} className="flex justify-between items-start gap-4">
                      <div className="flex gap-3">
                        <div className="mt-0.5 rounded-full bg-gray-100 p-1.5 shrink-0">
                          {activity.type === "lesson_plan" ? (
                            <FileText className="h-4 w-4 text-gray-600" />
                          ) : (
                            <Activity className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0 mt-1">
                        {format(new Date(activity.date), "MMM d")}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link 
                  href="#" 
                  className="mt-8 flex w-full items-center justify-center rounded-lg border border-gray-200 bg-gray-50 py-2.5 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  View All Activity
                </Link>
              </>
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                No recent activity.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function SummaryCard({ value, label, icon }: { value: number | string; label: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className="rounded-full bg-gray-50 p-2">
          {icon}
        </div>
      </div>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  let styles = "bg-gray-100 text-gray-700";
  let label = "Draft";

  if (status === "SUBMITTED") {
    styles = "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20";
    label = "Submitted";
  } else if (status === "APPROVED") {
    styles = "bg-pink-50 text-pink-700 ring-1 ring-pink-600/20";
    label = "Approved";
  } else {
    styles = "bg-gray-50 text-gray-700 ring-1 ring-gray-600/20";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      {label}
    </span>
  );
}
