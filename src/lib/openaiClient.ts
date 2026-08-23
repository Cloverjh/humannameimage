import OpenAI from "openai";

let client: OpenAI | null = null;

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY_MISSING: OPENAI_API_KEY를 설정해야 OpenAI API를 사용할 수 있습니다.");
  }

  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return client;
}
