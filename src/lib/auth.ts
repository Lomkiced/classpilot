import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// =============================================================================
// Centralized, Request-Scoped Cached Authentication
// =============================================================================
//
// React's cache() function deduplicates calls within a single server request
// lifecycle. This means that middleware → layout → page → server action all
// share ONE auth result per request instead of making 3-5 redundant calls
// to Supabase's auth service.
//
// RULE: Always import this instead of calling supabase.auth.getUser() directly.
// =============================================================================

export class AuthenticationError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthenticationError";
  }
}

/**
 * Returns the authenticated Supabase user for the current request.
 * Cached per-request — safe to call multiple times without penalty.
 *
 * @throws {AuthenticationError} if no session exists
 */
export const getAuthenticatedUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new AuthenticationError();
  }

  return user;
});

/**
 * Convenience wrapper that returns just the teacher ID (user.id).
 * This is the most common auth pattern in server actions.
 */
export const requireTeacherId = cache(async (): Promise<string> => {
  const user = await getAuthenticatedUser();
  return user.id;
});
