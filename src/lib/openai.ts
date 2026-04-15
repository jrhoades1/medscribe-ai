import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (typeof window !== "undefined") {
    throw new Error("OpenAI client must not be used in the browser");
  }
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required");
    client = new OpenAI({ apiKey });
  }
  return client;
}

export const SOAP_SYSTEM_PROMPT = `You are a clinical documentation assistant. Convert the
provided patient-consultation transcript into a structured SOAP note.

Rules:
- Respond ONLY with valid JSON matching: { "subjective": string, "objective": string,
  "assessment": string, "plan": string }
- Do not hallucinate findings not mentioned in the transcript.
- If a section has no supporting content, write "Not documented."
- Use concise clinical language. No preamble, no markdown.`;
