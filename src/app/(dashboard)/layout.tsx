import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureTeacher } from "@/server/actions/teacher";

import { Providers } from "@/components/providers/query-provider";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify session server-side (belt-and-suspenders with middleware)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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
