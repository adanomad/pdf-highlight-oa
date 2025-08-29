// app/utils/openclip.ts
type Opts = { baseUrl?: string };

function resolveBase(baseOverride?: string) {
  if (baseOverride) return baseOverride.replace(/\/$/, "");

  // Browser -> relative is fine
  if (typeof window !== "undefined") return "";

  // Server -> must be absolute
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return (fromEnv || "http://localhost:3000").replace(/\/$/, "");
}

async function postEmbed(body: any, opts?: Opts) {
  const base = resolveBase(opts?.baseUrl);
  const res = await fetch(`${base}/api/clip`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`clip embed failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  // Expect { embedding: number[] }
  const vec: number[] = Array.isArray(data?.embedding?.[0])
    ? data.embedding[0]
    : data.embedding;
  return vec as number[];
}

export async function computeTextEmbedding(text: string, opts?: Opts) {
  return postEmbed({ type: "text", input: text }, opts);
}

export async function computeImageEmbedding(input: string, opts?: Opts) {
  // `input` can be data URL (startsWith "data:image/") or a public URL
  return postEmbed({ type: "image", input }, opts);
}

// tiny helpers for cosine if you need them elsewhere
export function cosineSimilarity(a: number[], b: number[]) {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
