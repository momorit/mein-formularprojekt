import { promises as fs } from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { pipeline, AutoTokenizer } from '@xenova/transformers';
import { ChromaClient } from 'chromadb';
import { randomUUID } from 'crypto';

const MODEL_NAME = 'sentence-transformers/all-MiniLM-L6-v2';
const CHUNK_SIZE = 500;

async function loadDocuments(dir: string): Promise<{text: string; source: string}[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const docs: {text: string; source: string}[] = [];
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        docs.push(...await loadDocuments(fullPath));
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === '.md') {
          const text = await fs.readFile(fullPath, 'utf8');
          docs.push({ text, source: fullPath });
        }
        if (ext === '.pdf') {
          const data = await fs.readFile(fullPath);
          const parsed = await pdf(data);
          docs.push({ text: parsed.text, source: fullPath });
        }
      }
    }
    return docs;
  } catch (err) {
    console.warn(`Dokumentenverzeichnis '${dir}' konnte nicht gelesen werden.`);
    return [];
  }
}

async function chunkText(tokenizer: any, text: string): Promise<string[]> {
  const ids: number[] = tokenizer.encode(text, { add_special_tokens: false });
  const chunks: string[] = [];
  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const slice = ids.slice(i, i + CHUNK_SIZE);
    const chunk = tokenizer.decode(slice, { skip_special_tokens: true });
    chunks.push(chunk);
  }
  return chunks;
}

async function main() {
  const docsDir = path.resolve(process.cwd(), 'docs');
  const docs = await loadDocuments(docsDir);
  if (docs.length === 0) {
    console.log('Keine Dokumente zum Indexieren gefunden.');
    return;
  }

  const tokenizer = await AutoTokenizer.from_pretrained(MODEL_NAME);
  const embedder = await pipeline('feature-extraction', MODEL_NAME);

  const ids: string[] = [];
  const embeddings: number[][] = [];
  const texts: string[] = [];
  const metadatas: { source: string }[] = [];

  for (const doc of docs) {
    const parts = await chunkText(tokenizer, doc.text);
    for (const part of parts) {
      const result = await embedder(part, { pooling: 'mean', normalize: true });
      const vector = Array.from(result.data);
      ids.push(randomUUID());
      embeddings.push(vector as number[]);
      texts.push(part);
      metadatas.push({ source: doc.source });
    }
  }

  const dataDir = path.resolve(process.cwd(), 'data', 'rag-index');
  await fs.mkdir(dataDir, { recursive: true });
  const client = new ChromaClient({ path: dataDir });
  const collection = await client.getOrCreateCollection({ name: 'docs' });
  await collection.add({ ids, embeddings, documents: texts, metadatas });
  console.log(`Gespeichert: ${ids.length} Text-Chunks in ${dataDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
