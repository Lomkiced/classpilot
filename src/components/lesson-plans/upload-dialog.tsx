"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, File, FileText, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadAndExtractLessonPlan } from "@/server/actions/lesson-plans";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classes: { id: string; name: string }[];
}

export function UploadLessonPlanDialog({ isOpen, onOpenChange, classes }: UploadDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [classGroupId, setClassGroupId] = useState<string>(classes[0]?.id || "");
  const [month, setMonth] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  
  const [isPending, startTransition] = useTransition();
  const [statusText, setStatusText] = useState("");

  const resetState = () => {
    setFile(null);
    setClassGroupId(classes[0]?.id || "");
    setMonth("");
    setStatusText("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isPending) return; // Prevent closing while processing
    if (!open) resetState();
    onOpenChange(open);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const handleFileSelection = (selectedFile: File) => {
    // Basic validation
    const validTypes = [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
      "text/plain", 
      "text/markdown"
    ];
    const validExtensions = [".pdf", ".docx", ".txt", ".md"];
    
    const isValidType = validTypes.includes(selectedFile.type) || 
                       validExtensions.some(ext => selectedFile.name.toLowerCase().endsWith(ext));
    
    if (!isValidType) {
      toast.error("Invalid file type. Please upload a .docx, .pdf, .txt, or .md file.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB
      toast.error("File is too large. Maximum size is 10MB.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !classGroupId || !month) {
      toast.error("Please fill in all required fields.");
      return;
    }

    startTransition(async () => {
      try {
        setStatusText("Reading document...");
        
        const formData = new FormData();
        formData.append("file", file);
        formData.append("classGroupId", classGroupId);
        formData.append("month", month);

        // We can't actually stream the status text changes from a standard server action easily without complex generators, 
        // but we'll show a generic processing text here that covers both reading and structuring.
        setStatusText("Structuring content with AI...");

        const result = await uploadAndExtractLessonPlan(formData);
        
        if (result.success) {
          toast.success("Document processed successfully");
          handleOpenChange(false);
          router.push(`/lesson-plans/${result.data.id}`);
        }
      } catch (error: any) {
        toast.error(`Upload failed: ${error.message}`);
        setStatusText("");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload AI Lesson Plan</DialogTitle>
          <DialogDescription>
            Upload your AI-generated lesson plan draft. We'll automatically structure it into the correct fields for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select disabled={isPending} value={classGroupId} onValueChange={(val) => val && setClassGroupId(val)}>
                <SelectTrigger>
                  <span data-slot="select-value" className="flex flex-1 text-left line-clamp-1">
                    {classGroupId ? classes.find(c => c.id === classGroupId)?.name : "Select class"}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Month</Label>
              <Input 
                type="month" 
                disabled={isPending} 
                value={month} 
                onChange={(e) => setMonth(e.target.value)} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Document (.docx, .pdf, .txt, .md)</Label>
            
            {!file ? (
              <div 
                className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${isDragging ? 'border-pink-500 bg-pink-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} cursor-pointer`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className={`h-10 w-10 mb-3 ${isDragging ? 'text-pink-600' : 'text-gray-400'}`} />
                <p className="text-sm font-medium text-gray-900">Click to browse or drag and drop</p>
                <p className="text-xs text-gray-500 mt-1">Maximum file size 10MB</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" 
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="rounded-full bg-white p-2 shadow-sm shrink-0">
                    <FileText className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!isPending && (
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="shrink-0 text-gray-400 hover:text-gray-900">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || !classGroupId || !month || isPending} className="bg-pink-600 hover:bg-pink-700 min-w-[140px]">
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {statusText || "Processing..."}
              </>
            ) : (
              "Upload and Parse"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
