import fs from "fs/promises";
import FormData from "form-data";
import fetch from "node-fetch";
import { createHash } from "crypto";
import * as mammoth from "mammoth";
import { getCachedResult } from "../cacheService.js";
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
  if (cached) {
    console.log(`[Worker] Cache HIT for process. Firing webhook locally...`);
    const port = process.env.PORT || 5000;
    const backendUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
    const webhookUrl = `${backendUrl}/api/resume/webhook/process-resume/${resume._id}`;

    // Fire webhook asynchronously without blocking
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true, data: cached })
    }).catch(err => console.error("[Worker] Failed to fire local cache webhook:", err));

    return { success: true, status: "async_dispatched_via_cache" };
  }

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

  const port = process.env.PORT || 5000;
  const backendUrl = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${port}`;
  const webhookUrl = `${backendUrl}/api/resume/webhook/process-resume/${resume._id}`;

  console.log(`[Worker] STEP 1/4: Sending resume ${resume._id} for async processing + parsing... Webhook: ${webhookUrl}`);
  
  let response;
  const retries = 5;
  let backoff = 5000;
  
  for (let i = 0; i < retries; i++) {
    // CRITICAL: We MUST recreate the FormData object on every retry attempt!
    // Node.js fetch() consumes the stream on the first request.
    // Re-sending the exact same formData object causes a "socket hang up".
    const formData = new FormData();
    formData.append("file", finalBuffer, {
      filename: finalFilename,
      contentType: finalContentType,
    });
    formData.append("webhook_url", webhookUrl);

    const headers: any = typeof formData.getHeaders === "function" ? formData.getHeaders() : {};
    if (typeof formData.getLengthSync === "function") {
      headers["Content-Length"] = formData.getLengthSync().toString();
    }
    headers["X-API-Key"] = process.env.INTERNAL_API_KEY || "";

    response = await fetch(`${AI_SERVICE_URL}/resume/v2/process-async`, {
      method: "POST",
      body: formData,
      headers,
    });

    if (response.ok || (response.status >= 400 && response.status !== 429)) {
      break;
    }
    
    console.warn(`[Worker] Attempt ${i + 1} got 429 from Render NAT. Retrying in ${backoff}ms...`);
    await new Promise(res => setTimeout(res, backoff));
    backoff += 5000; // Increase wait time: 5s, 10s, 15s, 20s...
  }

  if (!response || !response.ok) {
    const errText = await (response ? response.text() : Promise.resolve("No response"));
    throw new Error(`Processing service failed (${response?.status}): ${errText}`);
  }

  return { success: true, status: "async_dispatched" };
};
