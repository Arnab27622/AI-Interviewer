import fetch from "node-fetch";
import { getCachedResult, setCachedResult } from "../cacheService.js";
import { getAIServiceUrl } from "./utils.js";

/**
 * STEP 3: analyzing → matching (optional, only if JD text is provided)
 * Send resume + skills to Python AI Service /resume/v2/match (JD parsing + FAISS + Gemini)
 */
export const stepMatch = async (resume: any, resumeSkills: string[]): Promise<any> => {
  const AI_SERVICE_URL = getAIServiceUrl();

  // Cache key = hash of resume text + JD text (both inputs affect the output)
  const fingerprint = (resume.parsedData.rawText || "") + "|||" + (resume.jdText || "");
  const cached = await getCachedResult("match", fingerprint);
  if (cached) return cached;

  console.log(`[Worker] STEP 3/4: Sending resume ${resume._id} for FAISS-based JD matching...`);
  const response = await fetch(`${AI_SERVICE_URL}/resume/v2/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      resume_text: resume.parsedData.rawText,
      resume_skills: resumeSkills,
      jd_text: resume.jdText,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Matching service failed (${response.status}): ${errText}`);
  }

  const data = (await response.json()) as any;
  await setCachedResult("match", fingerprint, data);
  return data;
};
