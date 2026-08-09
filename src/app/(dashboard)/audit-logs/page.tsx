import { Suspense } from "react";
import { getAuditLogs } from "@/server/actions/audit-logs";
import { AuditLogClient } from "@/components/audit-logs/audit-log-client";

export const metadata = {
  title: "ClassPilot - Activity Log",
};

export default async function AuditLogsPage() {
  let logs: any[] = [];
  try {
    logs = await getAuditLogs(200);
  } catch (error) {
    console.error("Failed to load audit logs:", error);
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-gray-50/50">
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Activity Log</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor system actions, changes, and security events.</p>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <Suspense fallback={<div className="flex h-64 items-center justify-center text-gray-400">Loading activity...</div>}>
          <AuditLogClient initialLogs={logs} />
        </Suspense>
      </div>
    </div>
  );
}
