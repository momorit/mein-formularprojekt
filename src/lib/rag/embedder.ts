import { pipeline, env } from "@xenova/transformers";

env.allowLocalModels = true; // falls du Modelle lokal cachen willst

let embedderPromise: Promise<any> | null = null;

export async function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderPromise;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const embedder = await getEmbedder();
  const vectors = [];
  for (const t of texts) {
    const out = await embedder(t, { pooling: "mean", normalize: true });
    vectors.push(Array.from(out.data));
  }
  return vectors as number[][];
}
