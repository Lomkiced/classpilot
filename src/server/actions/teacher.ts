"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

/**
 * Ensures a Teacher record exists in our database for the currently
 * authenticated Supabase user. Called from the dashboard layout on
 * every render — uses an upsert to be idempotent and cheap.
 *
 * Returns the Teacher record, or null if no authenticated user.
 */
export async function ensureTeacher() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const teacher = await prisma.teacher.upsert({
    where: { id: user.id },
    update: {
      email: user.email ?? "",
    },
    create: {
      id: user.id,
      email: user.email ?? "",
      name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Teacher",
    },
  });

  return teacher;
}
