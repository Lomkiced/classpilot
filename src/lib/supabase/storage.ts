import { createClient } from "./server";
import { v4 as uuidv4 } from "uuid";

const BUCKET_NAME = "lesson-plan-uploads";

/**
 * Uploads a file to Supabase Storage in the teacher's folder.
 * Path format: {teacherId}/{uuid}-{filename}
 */
export async function uploadLessonPlanFile(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  teacherId: string
) {
  const supabase = await createClient();
  const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const uniqueId = uuidv4();
  const path = `${teacherId}/${uniqueId}_${safeFileName}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, fileBuffer, {
      contentType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file to Supabase: ${error.message}`);
  }

  return data.path;
}

/**
 * Generates a short-lived signed URL to view/download a file.
 * We use signed URLs because the bucket is private.
 */
export async function getLessonPlanFileUrl(path: string, expiresIn: number = 60 * 60) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }

  return data.signedUrl;
}
