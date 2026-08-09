"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Activity, FileJson, Clock, User, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AuditLogClientProps {
  initialLogs: any[];
}

export function AuditLogClient({ initialLogs }: AuditLogClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const filteredLogs = initialLogs.filter((log) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.action.toLowerCase().includes(term) ||
      log.resourceType.toLowerCase().includes(term) ||
      log.teacher?.name.toLowerCase().includes(term) ||
      (log.resourceId && log.resourceId.toLowerCase().includes(term))
    );
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE": return "bg-green-100 text-green-700 border-green-200";
      case "UPDATE": return "bg-blue-100 text-blue-700 border-blue-200";
      case "DELETE": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="text"
            placeholder="Search logs by action, resource, or actor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-gray-50 border-gray-200"
          />
        </div>
      </Card>

      <Card className="overflow-hidden border-gray-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm:ss")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{log.teacher?.name || "System"}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900">{log.resourceType}</span>
                      <span className="text-xs text-gray-400 font-mono truncate max-w-[150px]">
                        {log.resourceId || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => setSelectedLog(log)}
                          />
                        }
                      >
                        <FileJson className="h-4 w-4 mr-2" />
                        View
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-gray-500" />
                            Log Details
                          </DialogTitle>
                        </DialogHeader>
                        <div className="mt-4 space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div><span className="text-gray-500">ID:</span> <span className="font-mono text-gray-900">{selectedLog?.id}</span></div>
                            <div><span className="text-gray-500">Date:</span> <span className="font-medium text-gray-900">{selectedLog && format(new Date(selectedLog.createdAt), "PPpp")}</span></div>
                            <div><span className="text-gray-500">Actor:</span> <span className="font-medium text-gray-900">{selectedLog?.teacher?.name} ({selectedLog?.teacher?.email})</span></div>
                            <div><span className="text-gray-500">Resource:</span> <span className="font-medium text-gray-900">{selectedLog?.resourceType}</span></div>
                            <div className="col-span-2"><span className="text-gray-500">Target ID:</span> <span className="font-mono text-gray-900">{selectedLog?.resourceId}</span></div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Payload Data</h4>
                            {selectedLog?.details ? (
                              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs font-mono overflow-x-auto shadow-inner">
                                {JSON.stringify(selectedLog.details, null, 2)}
                              </pre>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-500 flex items-center gap-2 border border-dashed border-gray-300">
                                <ShieldAlert className="h-4 w-4" />
                                No payload details were provided for this action.
                              </div>
                            )}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Activity className="mx-auto h-8 w-8 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-900">No activity logs found</p>
                    <p className="text-sm text-gray-400 mt-1">Actions performed by users will appear here.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
