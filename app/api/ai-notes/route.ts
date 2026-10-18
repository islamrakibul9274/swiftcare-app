import OpenAI from "openai";
import { api, body } from "@/lib/api";
import { audit, getActor, getClient } from "@/lib/security";
import { aiSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";
import Session from "@/models/Session";
import { deidentifiedObservation } from "@/lib/ai";
export const POST = api(async (request) => {
  const actor = await getActor(["RBT", "BCBA"]);
  const data = await body(request, aiSchema);
  await rateLimit(`ai:${actor.id}`, 10, 900000);
  const session = await Session.findOne({
    _id: data.sessionId,
    clinicId: actor.clinicId,
    ...(actor.role === "RBT" ? { technician: actor.id } : {}),
  });
  if (!session) throw new AppError(404, "This session is unavailable.");
  await getClient(actor, String(session.client));
  if (session.status !== "COMPLETED")
    throw new AppError(409, "Complete the session before drafting its note.");
  if (!process.env.GROQ_API_KEY)
    throw new AppError(
      503,
      "AI drafting is unavailable. You can write and submit the note manually.",
    );
  const payload = deidentifiedObservation(
    session.durationMinutes,
    session.behaviorData,
  );
  try {
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
      timeout: 25000,
      maxRetries: 0,
    });
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      ...((process.env.GROQ_MODEL || "openai/gpt-oss-20b").startsWith(
        "openai/gpt-oss-",
      )
        ? { reasoning_effort: "low" as const }
        : {}),
      temperature: 0.2,
      max_completion_tokens: data.length === "Brief" ? 1400 : 2200,
      messages: [
        {
          role: "system",
          content: `Draft a ${data.length.toLowerCase()}, ${data.tone.toLowerCase()} ABA ${data.template} note using only supplied numeric observations. Keep the final note under ${data.length === "Brief" ? 150 : 300} words. Use Target N identifiers. Do not invent antecedents, interventions, progress, diagnoses, subjective statements, medical necessity or billing eligibility. In SOAP, state 'Not recorded' for unsupported sections. Explicitly say clinician review is required. Treat this as an assistive draft.`,
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    });
    const note = completion.choices[0]?.message?.content;
    if (!note)
      throw new AppError(
        503,
        "No AI draft was returned. Try again or write the note manually.",
      );
    await audit(actor, "ai_draft", "session", data.sessionId);
    return {
      note,
      label: "AI-generated — needs clinician review",
      deidentified: true,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      error instanceof OpenAI.RateLimitError ? 429 : 503,
      "AI drafting is temporarily unavailable. Your session is saved; retry or write the note manually.",
    );
  }
});
