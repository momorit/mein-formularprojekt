export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { chunkText } from '@/lib/rag/chunk'
import { addDocument } from '@/lib/rag/store'
import { parseBlob } from '@/lib/rag/parse'
import crypto from 'crypto'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    const filename = (file as any).name || 'upload'

    const parsed = await parseBlob(file, filename)
    const text = (parsed?.text || '').trim()
    if (!text) {
      return NextResponse.json({ error: 'No text extracted from file' }, { status: 400 })
    }

    const docId = crypto.randomUUID()
    const chunks = chunkText({ docId, source: filename, text })
    const meta = await addDocument({ docId, source: filename, chunks: chunks.map(c => ({ id: c.id, text: c.text })) })

    return NextResponse.json({
      ok: true,
      doc: meta,
      pages: parsed?.meta?.pdf_numpages || undefined,
    })
  } catch (err: any) {
    console.error('RAG upload error:', err)
    return NextResponse.json({ error: err?.message || 'Upload failed' }, { status: 500 })
  }
}
