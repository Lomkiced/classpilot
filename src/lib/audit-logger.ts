import { prisma } from "@/lib/prisma";
import { ActionType, ResourceType } from "@/generated/prisma/client";
import { getAuthenticatedUser } from "@/lib/auth";

interface AuditLogPayload {
  action: ActionType;
  resourceType: ResourceType;
  resourceId?: string;
  details?: any;
}

/**
 * Logs an action to the audit logs table.
 * 
 * Uses the cached auth helper so it doesn't trigger a redundant
 * Supabase auth roundtrip when called from a server action that
 * already authenticated the user.
 * 
 * @param payload The details of the action to log.
 * @returns boolean indicating success
 */
export async function logAuditAction(payload: AuditLogPayload): Promise<boolean> {
  try {
    const user = await getAuthenticatedUser();

    await prisma.auditLog.create({
      data: {
        teacherId: user.id,
        action: payload.action,
        resourceType: payload.resourceType,
        resourceId: payload.resourceId,
        details: payload.details ? JSON.parse(JSON.stringify(payload.details)) : null,
      },
    });

    return true;
  } catch (error) {
    // We intentionally catch errors here so that a failure to log doesn't
    // completely crash the business transaction, but we log to stderr.
    console.error("Audit Logger Error:", error);
    return false;
  }
}
