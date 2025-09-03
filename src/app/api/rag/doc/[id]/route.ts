export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

type StoredChunk = {
  id: string
  docId: string
  source: string
  page?: number
  text: string
  embedding: number[]
}

function getDataDir() {
  return process.env.RAG_DATA_DIR || path.join(process.cwd(), 'data', 'rag')
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const docId = ctx.params.id
    if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })
    const chunksFile = path.join(getDataDir(), 'chunks.json')
    const raw = await fs.readFile(chunksFile, 'utf8').catch(() => '[]')
    const chunks: StoredChunk[] = JSON.parse(raw)
    const forDoc = chunks.filter((c) => c.docId === docId)
    if (forDoc.length === 0) return NextResponse.json({ ok: false, error: 'Dokument nicht gefunden' }, { status: 404 })
    const preview = forDoc.slice(0, 3).map((c) => c.text).join('\n\n---\n\n')
    const previewTrim = preview.slice(0, 4000)
    return NextResponse.json({ ok: true, docId, source: forDoc[0].source, preview: previewTrim, chunkCount: forDoc.length })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Preview failed' }, { status: 500 })
  }
}

