// src/app/api/rag/search/route.ts
// Zweck: Semantische Volltextsuppe über indizierte Chunks per Cosine‑Similarity (Top‑K).
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { searchTopK } from '@/lib/rag/store'

export async function POST(req: NextRequest) {
  try {
    const { query, k, minScore } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Missing query' }, { status: 400 })
    }
    const hits = await searchTopK(query, k, minScore)
    return NextResponse.json({ ok: true, hits })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Search failed' }, { status: 500 })
  }
}
