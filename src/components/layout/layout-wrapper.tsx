"use client";

import * as React from "react";
import { useSidebarStore } from "@/store/sidebar-store";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Before mounting, we default to expanded padding (pl-64) to match SSR output
  const paddingClass = mounted && isCollapsed ? "pl-20" : "pl-64";

  return (
    <div className={`flex flex-1 flex-col transition-all duration-300 ${paddingClass}`}>
      {children}
    </div>
  );
}
