"use server";

import { prisma } from "@/lib/prisma";
import { requireTeacherId } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { gradingScaleSchema, type GradingScaleInput } from "@/lib/validations/settings";

export async function getGradingScales() {
  const teacherId = await requireTeacherId();

  return prisma.gradingScale.findMany({
    where: { teacherId },
    include: {
      bands: {
        orderBy: { order: "asc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function getActiveGradingScale() {
  const teacherId = await requireTeacherId();

  return prisma.gradingScale.findFirst({
    where: { teacherId, isActive: true },
    include: {
      bands: {
        orderBy: { order: "asc" }
      }
    }
  });
}

export async function getGradingScale(id: string) {
  const teacherId = await requireTeacherId();

  const scale = await prisma.gradingScale.findFirst({
    where: { id, teacherId },
    include: {
      bands: {
        orderBy: { order: "asc" }
      }
    }
  });
  if (!scale) throw new Error("Grading scale not found");
  return scale;
}

export async function upsertGradingScale(id: string | null, data: GradingScaleInput) {
  const teacherId = await requireTeacherId();
  const parsed = gradingScaleSchema.parse(data);

  return await prisma.$transaction(async (tx) => {
    let scaleId = id;

    if (scaleId) {
      // Verify ownership
      const existing = await tx.gradingScale.findFirst({ where: { id: scaleId, teacherId } });
      if (!existing) throw new Error("Grading scale not found");

      await tx.gradingScale.update({
        where: { id: scaleId },
        data: { name: parsed.name }
      });

      // Clear existing bands
      await tx.gradeBand.deleteMany({ where: { gradingScaleId: scaleId } });
    } else {
      // Create new
      // If this is their first scale, make it active
      const count = await tx.gradingScale.count({ where: { teacherId } });
      
      const newScale = await tx.gradingScale.create({
        data: {
          teacherId,
          name: parsed.name,
          isActive: count === 0
        }
      });
      scaleId = newScale.id;
    }

    // Insert new bands
    await tx.gradeBand.createMany({
      data: parsed.bands.map((b, index) => ({
        gradingScaleId: scaleId!,
        label: b.label,
        minPercent: b.minPercent,
        maxPercent: b.maxPercent,
        order: index
      }))
    });

    revalidatePath("/settings");
    return { success: true, scaleId };
  });
}

export async function setActiveGradingScale(id: string) {
  const teacherId = await requireTeacherId();

  await prisma.$transaction(async (tx) => {
    // Unset all others
    await tx.gradingScale.updateMany({
      where: { teacherId, isActive: true },
      data: { isActive: false }
    });

    // Set active
    await tx.gradingScale.update({
      where: { id },
      data: { isActive: true }
    });
  });

  revalidatePath("/settings");
  revalidatePath("/gradebook");
  revalidatePath("/remarks");
  return { success: true };
}

export async function deleteGradingScale(id: string) {
  const teacherId = await requireTeacherId();

  const existing = await prisma.gradingScale.findFirst({ where: { id, teacherId } });
  if (!existing) throw new Error("Grading scale not found");

  if (existing.isActive) {
    throw new Error("Cannot delete the active grading scale. Set another scale as active first.");
  }

  await prisma.gradingScale.delete({ where: { id } });

  revalidatePath("/settings");
  return { success: true };
}
