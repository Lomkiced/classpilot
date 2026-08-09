import Anthropic from "@anthropic-ai/sdk";

export interface ExtractedLessonPlan {
  title: string;
  objectives: string;
  materials: string;
  procedure: string[];
  assessmentNotes: string;
  additionalNotes: string;
}

export async function structureContentWithAI(rawText: string): Promise<ExtractedLessonPlan> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  const prompt = `You are a helpful assistant that structures raw lesson plan documents into a specific JSON schema.
Your job is to sort the existing content into the right fields and split the procedure into clean, discrete steps.
Do NOT rewrite, summarize, or improve the lesson plan. Preserve the original wording and specifics as closely as possible.
If the document doesn't clearly map to one of the sections (e.g. no explicit "materials" section), leave that field as an empty string.

Extract and return ONLY a JSON object matching this exact shape (no preamble, no markdown fences):
{
  "title": string,
  "objectives": string,
  "materials": string,
  "procedure": string[],       // array of individual step strings
  "assessmentNotes": string,
  "additionalNotes": string
}

Here is the raw lesson plan text:
<document>
${rawText}
</document>`;

  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 4096,
    temperature: 0,
    system: "You are a precise data extraction assistant. You output ONLY valid JSON matching the requested schema. Do not include markdown formatting like ```json.",
    messages: [
      { role: "user", content: prompt }
    ]
  });

  const textResponse = (response.content[0] as any).text.trim();
  
  // Try to safely parse the JSON
  let parsed: any;
  try {
    parsed = JSON.parse(textResponse);
  } catch (error) {
    // If Claude added markdown fences despite instructions, try to strip them
    const cleanText = textResponse.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
    parsed = JSON.parse(cleanText);
  }

  return {
    title: parsed.title || "",
    objectives: parsed.objectives || "",
    materials: parsed.materials || "",
    procedure: Array.isArray(parsed.procedure) ? parsed.procedure : (parsed.procedure ? [parsed.procedure] : []),
    assessmentNotes: parsed.assessmentNotes || "",
    additionalNotes: parsed.additionalNotes || "",
  };
}
