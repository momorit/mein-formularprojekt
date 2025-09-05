// src/app/api/rag/ask/route.ts
// Zweck: Strenger RAG‑QA Endpunkt – Antworten ausschließlich aus Dokumentenkontext.
//  - Retrieval: searchTopK(query) → formatContextFromHits
//  - Prompt: System zwingt zu „Nicht gefunden“, wenn Info nicht im Kontext steht; Quellen zitieren
//  - LLM: Groq (callLLM), während Embeddings/Index lokal bleiben
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { searchTopK, formatContextFromHits } from '@/lib/rag/store'

export async function POST(req: NextRequest) {
  try {
    const { message, k, minScore } = await req.json()
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    // Retrieve relevant passages via local RAG index
    const hits = await searchTopK(message.slice(0, 2000), k, minScore)
    const ragCtx = hits.length > 0 ? formatContextFromHits(hits) : 'Keine Dokumenten-Treffer im Index.'

    // Strict RAG system rules
    const systemOverride = `
DU DARFST AUSSCHLIESSLICH Informationen aus dem bereitgestellten DOKUMENTEN-KONTEXT verwenden.
Wenn die Antwort im Kontext NICHT vorhanden ist, antworte exakt mit: "Nicht gefunden".
Gib präzise, kurze Antworten auf Deutsch (2–5 Sätze). Vermeide Ausschmückungen.
Zitiere die verwendeten Quellen am Ende als Liste im Format: [Quelle: <Dateiname> S.<Seite optional>].
Beziehe dich möglichst wörtlich auf Nutzerbegriffe, aber erfinde keine Fakten.
`

    const prompt = `
Beantworte die folgende Nutzerfrage ausschließlich anhand des Dokumenten-Kontexts.
Nutzerfrage:\n${message}
`

    // Force Groq for generation while embeddings/retrieval stay local (Ollama)
    const llmResponse = await callLLM(prompt, ragCtx, false, systemOverride, { provider: 'groq' })

    return NextResponse.json({
      ok: true,
      response: llmResponse,
      rag_used: hits.length > 0,
      rag_hits: hits.map(h => ({
        id: h.id,
        source: h.source,
        page: h.page,
        score: Number(h.score.toFixed(2)),
        snippet: sanitizeSnippet(h.text),
      })),
    })
  } catch (err: any) {
    console.error('RAG ask error:', err)
    return NextResponse.json({ ok: false, error: err?.message || 'RAG ask failed' }, { status: 500 })
  }
}
function sanitizeSnippet(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, 300)
}
