import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

// Wir nutzen eigene Embeddings -> custom Einfügen (siehe pipeline.ts)
export function getChromaClient() {
  const client = new ChromaClient({ path: process.env.CHROMA_PATH || ".chroma" });
  return client;
}

export async function getOrCreateCollection(name = "formulariq") {
  const client = getChromaClient();
  try { await client.createCollection({ name }); } catch {}
  return client.getCollection({ name });
}
