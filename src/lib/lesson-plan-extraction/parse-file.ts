import mammoth from "mammoth";
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function extractTextFromFile(fileBuffer: Buffer, mimeType: string, fileName: string): Promise<string> {
  let extractedText = "";

  try {
    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      const data = await pdfParse(fileBuffer);
      extractedText = data.text;
    } 
    else if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      fileName.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      extractedText = result.value;
    } 
    else if (
      mimeType === "text/plain" || 
      mimeType === "text/markdown" || 
      fileName.endsWith(".txt") || 
      fileName.endsWith(".md")
    ) {
      extractedText = fileBuffer.toString("utf-8");
    } 
    else {
      throw new Error("Unsupported file type. Please upload .docx, .pdf, .txt, or .md");
    }

    if (!extractedText || extractedText.trim().length === 0) {
      throw new Error("We couldn't read any text from this file. If it's a scanned PDF, try uploading the .docx version instead.");
    }

    return extractedText;
  } catch (error: any) {
    throw new Error(`Extraction failed: ${error.message}`);
  }
}
