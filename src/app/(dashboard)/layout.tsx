import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth";
import { ensureTeacher } from "@/server/actions/teacher";

import { Providers } from "@/components/providers/query-provider";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Use cached auth — shared with any server actions called during this request.
  // No more duplicate supabase.auth.getUser() calls.
  let user;
  try {
    user = await getAuthenticatedUser();
  } catch {
    redirect("/login");
  }

  // Ensure Teacher record exists in the database
  const teacher = await ensureTeacher();
  const teacherName = teacher?.name || user.email || "Teacher";

  return (
    <Providers>
      <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <LayoutWrapper>
        <Topbar teacherName={teacherName} />
        <main className="flex-1 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </LayoutWrapper>
      </div>
    </Providers>
  );
}
