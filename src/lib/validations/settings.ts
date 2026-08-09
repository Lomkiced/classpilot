import { z } from "zod";

export const gradeBandSchema = z.object({
  id: z.string().optional(), // Used for identifying existing bands
  label: z.string().min(1, "Label is required"),
  minPercent: z.coerce.number().min(0).max(100),
  maxPercent: z.coerce.number().min(0).max(100),
});

export const gradingScaleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bands: z.array(gradeBandSchema).min(1, "At least one grade band is required"),
}).refine(data => {
  // Validate that bands don't overlap conceptually?
  // Zod can do simple array checks, but for complex overlap logic it's better on the server.
  // We'll at least ensure min <= max
  return data.bands.every(b => b.minPercent <= b.maxPercent);
}, {
  message: "Min percent cannot be greater than max percent in any band.",
});

export type GradingScaleInput = z.infer<typeof gradingScaleSchema>;
export type GradeBandInput = z.infer<typeof gradeBandSchema>;
