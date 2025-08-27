// app/utils/openclip.ts
import * as tf from "@tensorflow/tfjs";

async function postEmbed(body: any) {
  const res = await fetch("/api/clip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Embedding proxy error");
  return res.json();
}

export const computeTextEmbedding = async (text: string) => {
  const data = await postEmbed({ type: "text", input: text });
  return tf.tensor(data.embedding);
};

export const computeImageEmbedding = async (imageUrlOrBase64: string) => {
  const data = await postEmbed({ type: "image", input: imageUrlOrBase64 });
  return tf.tensor(data.embedding);
};

export const cosineSimilarity = (a: tf.Tensor, b: tf.Tensor) => {
  const aN = a.div(a.norm());
  const bN = b.div(b.norm());
  return aN.mul(bN).sum().dataSync()[0];
};
