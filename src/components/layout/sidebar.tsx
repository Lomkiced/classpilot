"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpenCheck,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  CalendarCheck,
  Activity,
} from "lucide-react";
import { logout } from "@/server/actions/auth";
import { useSidebarStore } from "@/store/sidebar-store";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Classes", href: "/classes", icon: Users },
  { name: "Attendance", href: "/attendance", icon: CalendarCheck },
  { name: "Gradebook", href: "/gradebook", icon: BookOpenCheck },
  { name: "Lesson Plans", href: "/lesson-plans", icon: FileText },
  { name: "Remarks", href: "/remarks", icon: MessageSquare },
  { name: "Activity Log", href: "/audit-logs", icon: Activity },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const [mounted, setMounted] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const widthClass = mounted && isCollapsed ? "w-20" : "w-64";

  return (
    <aside className={`fixed inset-y-0 left-0 flex flex-col border-r border-gray-200 bg-white transition-all duration-300 z-20 ${widthClass}`}>
      
      {/* Brand Header */}
      <div className="flex h-16 shrink-0 items-center justify-center border-b border-gray-100 px-4">
        {(!mounted || !isCollapsed) ? (
          <Logo size="md" />
        ) : (
          <Logo size="md" showText={false} />
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 space-y-2 px-3 py-6 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={mounted && isCollapsed ? item.name : undefined}
              className={`group relative flex items-center rounded-xl px-3 py-3 text-[15px] font-medium transition-all ${
                mounted && isCollapsed ? "justify-center" : "justify-start gap-3.5"
              } ${
                isActive
                  ? "bg-pink-50/80 text-pink-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              {/* Active Left Border Indicator */}
              {isActive && (
                <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-pink-600" />
              )}
              
              <item.icon
                className={`shrink-0 transition-colors ${
                  mounted && isCollapsed ? "h-6 w-6" : "h-[22px] w-[22px]"
                } ${
                  isActive ? "text-pink-600" : "text-gray-400 group-hover:text-gray-600"
                }`}
                aria-hidden="true"
              />
              {(!mounted || !isCollapsed) && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={() => setIsLogoutOpen(true)}
          title={mounted && isCollapsed ? "Log Out" : undefined}
          className={`group flex w-full items-center rounded-xl px-3 py-3 text-[15px] font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-700 ${
            mounted && isCollapsed ? "justify-center" : "justify-start gap-3.5"
          }`}
        >
          <LogOut
            className={`shrink-0 transition-colors ${
              mounted && isCollapsed ? "h-6 w-6" : "h-[22px] w-[22px]"
            } text-gray-400 group-hover:text-red-600`}
            aria-hidden="true"
          />
          {(!mounted || !isCollapsed) && <span>Log Out</span>}
        </button>

        <ConfirmDialog
          isOpen={isLogoutOpen}
          onOpenChange={setIsLogoutOpen}
          title="Sign Out"
          description="Are you sure you want to sign out of your account? You will need to log back in to access your dashboard."
          confirmText="Sign Out"
          variant="logout"
          onConfirm={() => {
            setIsLogoutOpen(false);
            logout();
          }}
        />
      </div>
    </aside>
  );
}
