import OpenAI from "openai";

let client: OpenAI | null = null;

export function getGroq(): OpenAI {
  if (typeof window !== "undefined") {
    throw new Error("Groq client must not be used in the browser");
  }
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("GROQ_API_KEY is required");
    client = new OpenAI({
      apiKey,
      baseURL: "https://api.groq.com/openai/v1",
    });
  }
  return client;
}

export const GROQ_WHISPER_MODEL = "whisper-large-v3-turbo";
