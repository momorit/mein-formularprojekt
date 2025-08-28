import { promises as fs } from 'fs'

interface RagChunk {
  text: string
  source: string
}

function tokenize(str: string): string[] {
  return str.toLowerCase().split(/\W+/).filter(Boolean)
}

export async function retrieve(query: string, k = 5): Promise<RagChunk[]> {
  const possiblePaths = ['data/rag-index.json', 'data/rag-index']
  let raw: string | null = null

  for (const p of possiblePaths) {
    try {
      raw = await fs.readFile(p, 'utf8')
      break
    } catch {
      continue
    }
  }

  if (!raw) return []

  const index: RagChunk[] = JSON.parse(raw)
  const tokens = tokenize(query)

  const scored = index
    .map(chunk => {
      const chunkTokens = tokenize(chunk.text)
      const overlap = tokens.filter(t => chunkTokens.includes(t)).length
      return { ...chunk, score: overlap }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, k).map(({ text, source }) => ({ text, source }))
}
