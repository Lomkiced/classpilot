"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Sparkles, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { upsertRemark, suggestRemark } from "@/server/actions/remarks";

interface RemarksListProps {
  initialData: any[]; // Array of { student, average, remark }
  classGroup: { id: string; name: string };
  gradingPeriod: string;
}

export function RemarksList({ initialData, classGroup, gradingPeriod }: RemarksListProps) {
  const [data, setData] = useState(initialData);
  const [isExportingAll, setIsExportingAll] = useState(false);

  // Download all as PDF
  const handleExportAll = () => {
    setIsExportingAll(true);
    try {
      const url = `/api/remarks/batch/pdf?classGroupId=${classGroup.id}&gradingPeriod=${encodeURIComponent(gradingPeriod)}`;
      const a = document.createElement("a");
      a.href = url;
      a.download = `Remarks_${classGroup.name.replace(/\s+/g, '_')}_${gradingPeriod}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Batch export started");
    } catch (e) {
      toast.error("Failed to export PDFs");
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
          {classGroup.name} • {gradingPeriod} ({data.length} Students)
        </h3>
        <Button 
          onClick={handleExportAll} 
          disabled={isExportingAll}
          variant="outline" 
          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
        >
          {isExportingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Export All as PDF
        </Button>
      </div>

      <div className="grid gap-6">
        {data.map((item, idx) => (
          <RemarkCard 
            key={item.student.id} 
            item={item} 
            classGroupId={classGroup.id} 
            gradingPeriod={gradingPeriod} 
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Remark Card Sub-component
// ---------------------------------------------------------------------------

function RemarkCard({ item, classGroupId, gradingPeriod }: { item: any, classGroupId: string, gradingPeriod: string }) {
  const [content, setContent] = useState(item.remark?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);

  const handleBlur = async () => {
    // Only save if it's different from the initial and not empty
    if (content === item.remark?.content) return;
    
    setIsSaving(true);
    try {
      await upsertRemark({
        studentId: item.student.id,
        classGroupId,
        gradingPeriod,
        content
      });
      toast.success(`Saved remark for ${item.student.fullName}`);
    } catch (e) {
      toast.error("Failed to save remark");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    try {
      const res = await suggestRemark(item.student.id, classGroupId, gradingPeriod);
      setContent(res.suggestion);
      // Auto-save the suggestion
      await upsertRemark({
        studentId: item.student.id,
        classGroupId,
        gradingPeriod,
        content: res.suggestion
      });
      toast.success("Suggestion applied & saved");
    } catch (e) {
      toast.error("Failed to generate suggestion");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleExportSingle = () => {
    const url = `/api/remarks/${item.student.id}/pdf?classGroupId=${classGroupId}&gradingPeriod=${encodeURIComponent(gradingPeriod)}`;
    const a = document.createElement("a");
    a.href = url;
    a.download = `Remark_${item.student.fullName.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">{item.student.fullName}</h4>
          <p className="text-sm text-gray-500">Computed Average: <span className="font-medium text-gray-900">{item.average}%</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSuggest} 
            disabled={isSuggesting}
            className="text-pink-600 hover:text-pink-700 hover:bg-pink-50"
          >
            {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            Generate Suggestion
          </Button>
          <Button variant="ghost" size="sm" onClick={handleExportSingle} className="text-gray-500 hover:text-gray-900">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="relative">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onBlur={handleBlur}
          placeholder={`Write a remark for ${item.student.fullName}...`}
          className="min-h-[120px] resize-y border-gray-200 shadow-none focus-visible:ring-pink-500 bg-gray-50/50"
        />
        {isSaving && (
          <div className="absolute bottom-3 right-3 flex items-center text-xs text-gray-400">
            <Save className="mr-1 h-3 w-3" /> Saving...
          </div>
        )}
      </div>
    </div>
  );
}
