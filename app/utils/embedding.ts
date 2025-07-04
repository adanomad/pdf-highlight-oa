// app/utils/embedding.ts

import { openAiKey } from "./env";

export async function embedText(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: "Bearer ${process.env.}" + openAiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text
    }),
  });

  const data = await res.json();

  if (!data) {
    return [];
  }

  return data.data[0].embedding;
}
