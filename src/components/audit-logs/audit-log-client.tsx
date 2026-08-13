"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, Activity, FileText, Clock, User, ShieldAlert, ChevronRight } from "lucide-react";
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
      log.teacher?.name.toLowerCase().includes(term)
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

  // Helper to nicely format camelCase keys to Title Case
  const formatKey = (key: string) => {
    return key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
  };

  // Helper to format values for readability
  const formatValue = (key: string, value: any) => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (key.toLowerCase().includes("date") && typeof value === "string") {
      try {
        return format(new Date(value), "PPP");
      } catch (e) {
        return value;
      }
    }
    if (typeof value === "object") {
      return Array.isArray(value) ? `[${value.length} items]` : "{ ... }";
    }
    return String(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="p-4 flex flex-col sm:flex-row gap-4 justify-between border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            type="text"
            placeholder="Search activity by action, resource, or actor..."
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
                <th className="px-6 py-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
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
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-pink-600 hover:text-pink-700 hover:bg-pink-50 font-medium"
                            onClick={() => setSelectedLog(log)}
                          >
                            View Details
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        }
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                            <Activity className="h-5 w-5 text-pink-500" />
                            Activity Details
                          </DialogTitle>
                        </DialogHeader>
                        
                        <div className="mt-6 space-y-6">
                          {/* Core Meta Info */}
                          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                            <div>
                              <p className="text-xs text-gray-500 font-medium mb-1">Actor</p>
                              <p className="text-sm font-semibold text-gray-900">{selectedLog?.teacher?.name || "System"}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 font-medium mb-1">Date & Time</p>
                              <p className="text-sm font-semibold text-gray-900">{selectedLog && format(new Date(selectedLog.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-medium mb-1">Action Type</p>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border inline-block ${selectedLog ? getActionColor(selectedLog.action) : ""}`}>
                                {selectedLog?.action}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 font-medium mb-1">Resource Affected</p>
                              <p className="text-sm font-semibold text-gray-900">{selectedLog?.resourceType}</p>
                            </div>
                          </div>
                          
                          {/* Structured Payload Info (No Code Blocks) */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              Recorded Data
                            </h4>
                            {selectedLog?.details && Object.keys(selectedLog.details).length > 0 ? (
                              <div className="grid grid-cols-2 gap-3">
                                {Object.entries(selectedLog.details).map(([key, value]) => {
                                  // Skip system IDs from UI to keep it clean
                                  if (key.toLowerCase().endsWith("id")) return null;
                                  
                                  return (
                                    <div key={key} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                      <p className="text-xs text-gray-500 font-medium mb-1 truncate">{formatKey(key)}</p>
                                      <p className="text-sm font-semibold text-gray-900 truncate" title={formatValue(key, value)}>
                                        {formatValue(key, value)}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-6 rounded-xl text-sm text-gray-500 flex flex-col items-center justify-center gap-2 border border-dashed border-gray-200">
                                <ShieldAlert className="h-5 w-5 text-gray-400" />
                                <p>No additional data was recorded for this action.</p>
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
