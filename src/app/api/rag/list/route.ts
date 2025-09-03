export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { listDocuments } from '@/lib/rag/store'

export async function GET() {
  try {
    const docs = await listDocuments()
    return NextResponse.json({ ok: true, docs })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || 'List failed' }, { status: 500 })
  }
}

