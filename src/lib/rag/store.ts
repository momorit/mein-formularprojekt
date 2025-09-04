// src/lib/rag/store.ts
// Zweck: Datei-basierter Vektor-Store (JSON) für RAG-Chunks inkl. Embeddings.
//  - Dateien: data/rag/chunks.json, data/rag/docs.json (konfigurierbar via RAG_DATA_DIR)
//  - Operationen: addDocument, listDocuments, deleteDocument, searchTopK
//  - Suche: Cosine-Similarity in-memory; Dimensionsprüfung und Score-Filter
//  - Kontextformatierung: Quellenangaben + Snippets, Längenbegrenzung
// Env: RAG_DATA_DIR, RAG_TOP_K, RAG_MIN_SCORE, RAG_MAX_CONTEXT_CHARS
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { embedText } from './ollama';

export type StoredChunk = {
  id: string; // chunk id `${docId}:${n}`
  docId: string;
  source: string; // filename
  page?: number;
  text: string;
  embedding: number[];
};

export type StoredDoc = {
  docId: string;
  source: string;
  createdAt: string;
  chunkCount: number;
  charCount: number;
};

function getDataDir() {
  return process.env.RAG_DATA_DIR || path.join(process.cwd(), 'data', 'rag');
}

function filePaths() {
  const dir = getDataDir();
  return {
    dir,
    chunks: path.join(dir, 'chunks.json'),
    docs: path.join(dir, 'docs.json'),
  };
}

async function ensureDir() {
  const { dir } = filePaths();
  await fs.mkdir(dir, { recursive: true });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const buf = await fs.readFile(file, 'utf8');
    return JSON.parse(buf) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(file: string, data: T): Promise<void> {
  await ensureDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8');
}

export function cosineSim(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) + 1e-9);
}

export async function addDocument(params: {
  docId?: string;
  source: string;
  chunks: { id: string; text: string; page?: number }[];
}): Promise<StoredDoc> {
  const { chunks: chunkInputs, source } = params;
  const docId = params.docId || crypto.randomUUID();
  const embeddings: number[][] = [];
  for (const c of chunkInputs) {
    // eslint-disable-next-line no-await-in-loop
    embeddings.push(await embedText(c.text));
  }

  const { chunks: chunksFile, docs: docsFile } = filePaths();
  const existingChunks = await readJson<StoredChunk[]>(chunksFile, []);
  const existingDocs = await readJson<StoredDoc[]>(docsFile, []);

  const stored: StoredChunk[] = chunkInputs.map((c, i) => ({
    id: `${docId}:${i}`,
    docId,
    source,
    page: c.page,
    text: c.text,
    embedding: embeddings[i],
  }));

  const charCount = chunkInputs.reduce((s, c) => s + c.text.length, 0);

  const meta: StoredDoc = {
    docId,
    source,
    createdAt: new Date().toISOString(),
    chunkCount: stored.length,
    charCount,
  };

  await writeJson(chunksFile, [...existingChunks, ...stored]);
  await writeJson(docsFile, [...existingDocs.filter((d) => d.docId !== docId), meta]);

  return meta;
}

export async function listDocuments(): Promise<StoredDoc[]> {
  const { docs: docsFile } = filePaths();
  return readJson<StoredDoc[]>(docsFile, []);
}

export async function deleteDocument(docId: string): Promise<void> {
  const { chunks: chunksFile, docs: docsFile } = filePaths();
  const chunks = await readJson<StoredChunk[]>(chunksFile, []);
  const docs = await readJson<StoredDoc[]>(docsFile, []);
  await writeJson(chunksFile, chunks.filter((c) => c.docId !== docId));
  await writeJson(docsFile, docs.filter((d) => d.docId !== docId));
}

export type SearchHit = StoredChunk & { score: number };

export async function searchTopK(
  query: string,
  k = Number(process.env.RAG_TOP_K || 5),
  minScore = Number(process.env.RAG_MIN_SCORE || 0.15)
): Promise<SearchHit[]> {
  const { chunks: chunksFile } = filePaths();
  const chunks = await readJson<StoredChunk[]>(chunksFile, []);
  if (chunks.length === 0) return [];
  const qv = await embedText(query);
  // Filter chunks whose embedding dimension matches the query vector
  const qdim = qv.length;
  const comparable = chunks.filter((c) => Array.isArray(c.embedding) && c.embedding.length === qdim);
  if (comparable.length === 0) {
    console.warn('RAG search: no comparable embeddings (dimension mismatch). Consider reindexing documents with the current embedding model.');
    return [];
  }
  const scored = comparable.map((c) => ({ ...c, score: cosineSim(qv, c.embedding) }));
  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter((s) => s.score >= minScore).slice(0, k);
  return top;
}

function stripBinary(s: string): string {
  // remove control chars except tab/newline/carriage return
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

export function formatContextFromHits(hits: SearchHit[], maxChars = Number(process.env.RAG_MAX_CONTEXT_CHARS || 6000)) {
  const parts: string[] = [];
  for (const h of hits) {
    const clean = stripBinary(h.text).slice(0, Math.floor(maxChars / Math.max(1, hits.length)));
    parts.push(`Quelle: ${h.source}${typeof h.page === 'number' ? ` S.${h.page}` : ''} (Score: ${h.score.toFixed(2)})\n${clean}`);
  }
  let ctx = parts.join('\n\n---\n\n');
  if (ctx.length > maxChars) {
    ctx = ctx.slice(0, maxChars);
  }
  return `DOKUMENTEN-KONTEXT (nur hieraus antworten, bei Unsicherheit: "Nicht gefunden")\n\n${ctx}`;
}
