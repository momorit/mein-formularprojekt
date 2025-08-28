import { splitIntoChunks } from "./splitter";
import { embedTexts } from "./embedder";
import { getOrCreateCollection } from "./store";
import { loadKB } from "./loaders";

export async function ingestKB(dir: string) {
  const rawDocs = await loadKB(dir);
  const collection = await getOrCreateCollection();
  let ids: string[] = [];
  let docs: string[] = [];
  let metas: any[] = [];

  for (const d of rawDocs) {
    const chunks = splitIntoChunks(d.text);
    const chunkIds = chunks.map((_, i) => `${d.id}::${i}`);
    const embeddings = await embedTexts(chunks);

    await collection.add({
      ids: chunkIds,
      metadatas: chunks.map((_, i) => ({ source: d.source, chunk: i })),
      documents: chunks,
      embeddings
    });
    ids = ids.concat(chunkIds);
    docs = docs.concat(chunks);
    metas = metas.concat(chunks.map((_, i) => ({ source: d.source, chunk: i })));
  }

  return { count: ids.length };
}

export async function queryKB(query: string, k = 5) {
  const collection = await getOrCreateCollection();
  // Embedding hier lokal erzeugen:
  const [qvec] = await embedTexts([query]);
  const res = await collection.query({ queryEmbeddings: [qvec], nResults: k });
  // res enthält .documents, .metadatas, .ids, .distances
  return res;
}
