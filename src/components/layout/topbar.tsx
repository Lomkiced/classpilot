"use client";

import { getInitials } from "@/lib/utils";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebarStore } from "@/store/sidebar-store";
import { Button } from "@/components/ui/button";

interface TopbarProps {
  teacherName: string;
}

export function Topbar({ teacherName }: TopbarProps) {
  const initials = getInitials(teacherName);
  const { isCollapsed, toggle } = useSidebarStore();

  return (
    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggle}
          className="text-gray-500 hover:text-gray-900"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </Button>
        <h1 className="text-xl font-semibold text-gray-900">
          {/* Dashboard title will go here eventually */}
        </h1>
      </div>

      <div className="flex items-center gap-x-4 lg:gap-x-6">
        {/* Avatar */}
        <div 
          className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-sm font-medium text-pink-700 ring-1 ring-pink-600/10"
          title={teacherName}
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
