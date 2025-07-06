// app/utils/server/embedding.ts
export const runtime = "nodejs";

export async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-ada-002",
      input: text
    })
  });

  if (!res.ok) {
    const error = await res.text();
    console.error("OpenAI embedding failed:", error);
    throw new Error("Failed to get embedding from OpenAI");
  }

  const data = await res.json();
  return data.data[0].embedding;
}
