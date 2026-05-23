import fs from "fs/promises";
import FormData from "form-data";
import fetch from "node-fetch";
import { createHash } from "crypto";
import * as mammoth from "mammoth";
import { getCachedResult, setCachedResult } from "../cacheService.js";
import { getAIServiceUrl } from "./utils.js";

/**
 * STEP 1: processing → parsed
 * Send file to Python AI Service /resume/v2/process (file processing + OCR + LLM parsing)
 */
export const stepProcess = async (resume: any): Promise<any> => {
  const AI_SERVICE_URL = getAIServiceUrl();

  const fileBuffer = await fs.readFile(resume.filePath);

  // Cache key = SHA-256 of the raw file bytes
  const fileHash = createHash("sha256").update(fileBuffer).digest("hex");
  const cached = await getCachedResult("process", fileHash);
  if (cached) return cached;

  let finalBuffer = fileBuffer;
  let finalFilename = resume.originalFilename;
  let finalContentType = resume.fileType === "pdf" ? "application/pdf" : "text/plain";

  // Process .docx natively to text using Mammoth
  if (resume.fileType === "docx" || resume.originalFilename.toLowerCase().endsWith(".docx")) {
    console.log(`[Worker] Extracting text from DOCX using mammoth for ${resume._id}...`);
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    finalBuffer = Buffer.from(result.value, "utf8");
    finalFilename = resume.originalFilename.replace(/\.docx$/i, ".txt");
    finalContentType = "text/plain";
  }

  const formData = new FormData();
  formData.append("file", finalBuffer, {
    filename: finalFilename,
    contentType: finalContentType,
  });

  const headers: any = typeof formData.getHeaders === "function" ? formData.getHeaders() : {};
  if (typeof formData.getLengthSync === "function") {
    headers["Content-Length"] = formData.getLengthSync().toString();
  }

  console.log(`[Worker] STEP 1/4: Sending resume ${resume._id} for processing + parsing...`);
  const response = await fetch(`${AI_SERVICE_URL}/resume/v2/process`, {
    method: "POST",
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Processing service failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  await setCachedResult("process", fileHash, data);
  return data;
};
