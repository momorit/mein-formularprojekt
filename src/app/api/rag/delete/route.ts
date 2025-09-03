export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { deleteDocument } from '@/lib/rag/store'

export async function POST(req: NextRequest) {
  try {
    const { docId } = await req.json()
    if (!docId) return NextResponse.json({ error: 'Missing docId' }, { status: 400 })
    await deleteDocument(docId)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'Delete failed' }, { status: 500 })
  }
}

