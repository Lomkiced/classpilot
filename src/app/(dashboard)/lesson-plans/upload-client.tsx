"use client";

import { useState } from "react";
import Link from "next/link";
import { UploadCloud, Plus, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { UploadLessonPlanDialog } from "@/components/lesson-plans/upload-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UploadLessonPlanClientProps {
  classes: { id: string; name: string }[];
}

export function UploadLessonPlanClient({ classes }: UploadLessonPlanClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-0.5">
        <Button onClick={() => setIsOpen(true)} className="bg-pink-600 hover:bg-pink-700 rounded-r-none">
          <UploadCloud className="mr-2 h-5 w-5" />
          Upload Lesson Plan
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button className="bg-pink-600 hover:bg-pink-700 rounded-l-none px-2 focus:ring-offset-1 focus:ring-pink-500" />}>
            <ChevronDown className="h-5 w-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <Link href="/lesson-plans/new">
              <DropdownMenuItem className="cursor-pointer py-2">
                <Plus className="mr-2 h-4 w-4" />
                Create Manually
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <UploadLessonPlanDialog 
        isOpen={isOpen} 
        onOpenChange={setIsOpen} 
        classes={classes} 
      />
    </>
  );
}
