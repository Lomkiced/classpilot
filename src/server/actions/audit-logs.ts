"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getAuditLogs(take: number = 100) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const logs = await prisma.auditLog.findMany({
    take,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      teacher: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return logs;
}
