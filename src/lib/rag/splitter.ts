export function splitIntoChunks(text: string, chunkSize = 600, overlap = 80): string[] {
  const tokens = text.split(/\s+/);
  const chunks: string[] = [];
  for (let i = 0; i < tokens.length; i += (chunkSize - overlap)) {
    const slice = tokens.slice(i, i + chunkSize).join(" ");
    if (slice.trim().length) chunks.push(slice);
    if (i + chunkSize >= tokens.length) break;
  }
  return chunks;
}
