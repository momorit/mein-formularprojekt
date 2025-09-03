export type Chunk = {
  id: string;
  docId: string;
  source: string; // filename or logical source
  page?: number; // optional page number for PDFs
  text: string;
};

// Simple paragraph-aware chunking with char-based window
export function chunkText(
  params: {
    docId: string;
    source: string;
    text: string;
    size?: number; // target chars per chunk
    overlap?: number; // overlapped chars between chunks
  }
): Chunk[] {
  const { docId, source } = params;
  const size = params.size ?? Number(process.env.RAG_CHUNK_SIZE || 1500); // ~1500 chars ~ 250-350 tokens
  const overlap = params.overlap ?? Number(process.env.RAG_CHUNK_OVERLAP || 200);
  const paragraphs = params.text
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: Chunk[] = [];
  let buffer = '';
  for (const p of paragraphs) {
    if ((buffer + '\n\n' + p).length <= size) {
      buffer = buffer ? buffer + '\n\n' + p : p;
      continue;
    }
    if (buffer) {
      chunks.push({ id: `${docId}:${chunks.length}`, docId, source, text: buffer });
    }
    // start new buffer; ensure long paragraph is split hard
    if (p.length <= size) {
      buffer = p;
    } else {
      let i = 0;
      while (i < p.length) {
        const slice = p.slice(i, i + size);
        chunks.push({ id: `${docId}:${chunks.length}`, docId, source, text: slice });
        i += size - overlap; // keep some overlap on hard splits
        if (i < 0) i = 0;
      }
      buffer = '';
    }
  }
  if (buffer) chunks.push({ id: `${docId}:${chunks.length}`, docId, source, text: buffer });

  // Add soft overlap between adjacent chunks
  if (overlap > 0 && chunks.length > 1) {
    const overlapped: Chunk[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      if (i === 0) {
        overlapped.push(c);
        continue;
      }
      const prev = chunks[i - 1];
      const tail = prev.text.slice(-overlap);
      const merged = tail + (tail ? '\n' : '') + c.text;
      overlapped.push({ ...c, text: merged });
    }
    return overlapped.map((c, i) => ({ ...c, id: `${docId}:${i}` }));
  }

  return chunks;
}
