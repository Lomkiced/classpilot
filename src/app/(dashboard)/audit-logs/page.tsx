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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Activity Log</h1>
        <p className="mt-1 text-sm text-gray-500">Monitor system actions, changes, and security events.</p>
      </div>

      <div>
        <Suspense fallback={<div className="flex h-64 items-center justify-center text-gray-400">Loading activity...</div>}>
          <AuditLogClient initialLogs={logs} />
        </Suspense>
      </div>
    </div>
  );
}
