// Lightweight Ollama client for local embeddings and generation
// Uses OLLAMA_HOST (default http://localhost:11434)

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

export type OllamaEmbedOptions = {
  model?: string; // e.g., 'nomic-embed-text' or 'all-minilm'
};

export async function embedText(
  text: string,
  opts: OllamaEmbedOptions = {}
): Promise<number[]> {
  const model = opts.model || process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text';
  const res = await fetch(`${OLLAMA_HOST}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ollama embeddings failed: ${res.status} ${body}`);
  }
  const json: any = await res.json();
  const vector: number[] = json?.embedding;
  if (!Array.isArray(vector)) throw new Error('Invalid embedding response from Ollama');
  return vector;
}

export async function embedBatch(
  texts: string[],
  opts: OllamaEmbedOptions = {}
): Promise<number[][]> {
  const out: number[][] = [];
  for (const t of texts) {
    // Simple sequential batching to avoid large payloads
    // Can be parallelized if desired
    // eslint-disable-next-line no-await-in-loop
    out.push(await embedText(t, opts));
  }
  return out;
}

export type OllamaGenerateOptions = {
  model?: string; // e.g., 'llama3.1:8b'
  temperature?: number;
};

export async function generate(
  prompt: string,
  opts: OllamaGenerateOptions = {}
): Promise<string> {
  const model = opts.model || process.env.OLLAMA_MODEL || 'llama3.1:8b';
  const temperature = opts.temperature ?? 0.6;
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt, temperature, stream: false }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Ollama generate failed: ${res.status} ${body}`);
  }
  const json: any = await res.json();
  const text: string = json?.response ?? '';
  return text;
}

