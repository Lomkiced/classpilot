"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";

export async function getAuditLogs(take: number = 100) {
  const teacherId = await requireTeacherId();

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
