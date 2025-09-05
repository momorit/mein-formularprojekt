// src/app/rag/page.tsx
// Zweck: RAG‑Admin/Debug‑UI – Upload, Liste, Vorschau, Suche, strenger RAG‑Chat.
// Hinweise:
//  - Upload indiziert lokal via /api/rag/upload (Ollama Embeddings erforderlich)
//  - 'Chat mit RAG' nutzt /api/rag/ask mit striktem Kontext‑Zwang
'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'

type Doc = { docId: string; source: string; createdAt: string; chunkCount: number; charCount: number }
type Hit = { id: string; docId: string; source: string; page?: number; text: string; score: number }

export default function RAGPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [searching, setSearching] = useState(false)
  const [preview, setPreview] = useState<{ docId: string; text: string } | null>(null)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatResponse, setChatResponse] = useState('')
  const [chatSources, setChatSources] = useState<{ id: string; source: string; page?: number; score?: number; snippet?: string }[]>([])

  async function refresh() {
    const res = await fetch('/api/rag/list', { cache: 'no-store' })
    const json = await res.json()
    setDocs(json?.docs || [])
  }

  useEffect(() => { refresh() }, [])

  async function handleUpload() {
    if (!file) return
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/rag/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Upload fehlgeschlagen')
      await refresh()
      setFile(null)
    } catch (e: any) {
      alert(e?.message || 'Fehler beim Upload')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(docId: string) {
    if (!confirm('Dokument wirklich löschen?')) return
    await fetch('/api/rag/delete', { method: 'POST', body: JSON.stringify({ docId }) })
    await refresh()
  }

  async function handlePreview(docId: string) {
    const res = await fetch(`/api/rag/doc/${docId}`, { cache: 'no-store' })
    const json = await res.json()
    if (json?.ok) {
      setPreview({ docId, text: json.preview || '' })
    } else {
      alert(json?.error || 'Keine Vorschau verfügbar')
    }
  }

  async function handleSearch() {
    setSearching(true)
    try {
      const res = await fetch('/api/rag/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, k: 5 }) })
      const json = await res.json()
      setHits(json?.hits || [])
    } finally {
      setSearching(false)
    }
  }

  async function handleChatAsk() {
    if (!chatInput.trim()) return
    setChatLoading(true)
    setChatResponse('')
    try {
      const res = await fetch('/api/rag/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: chatInput, k: 5 }),
      })
      let json: any = null
      try {
        json = await res.json()
      } catch {
        // Fallback für HTML-Fehlerseiten
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Chat fehlgeschlagen (kein JSON)')
      }
      if (!res.ok) throw new Error(json?.llm_error || json?.error || 'Chat fehlgeschlagen')
      setChatResponse(json?.response || '')
      setChatSources(Array.isArray(json?.rag_hits) ? json.rag_hits : [])
    } catch (e: any) {
      setChatResponse(e?.message || 'Fehler beim Chat')
      setChatSources([])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl p-6 space-y-8">
      <h1 className="text-2xl font-semibold">RAG Verwaltung</h1>

      <Card className="p-4 space-y-3">
        <div className="font-medium">Dokument hochladen</div>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <div className="flex gap-2">
          <Button onClick={handleUpload} disabled={!file || loading}>{loading ? 'Lädt...' : 'Hochladen'}</Button>
          {file && <span className="text-sm text-gray-500">{file.name}</span>}
        </div>
        <div className="text-xs text-gray-500">Unterstützt: PDF, DOCX, TXT/MD</div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-medium">Indizierte Dokumente</div>
        {docs.length === 0 && <div className="text-sm text-gray-500">Noch keine Dokumente vorhanden.</div>}
        <div className="space-y-2">
          {docs.map((d) => (
            <div key={d.docId} className="flex items-center justify-between border rounded p-2">
              <div>
                <div className="font-mono text-sm">{d.source}</div>
                <div className="text-xs text-gray-500">Chunks: {d.chunkCount} · Zeichen: {d.charCount} · {new Date(d.createdAt).toLocaleString()}</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handlePreview(d.docId)}>Vorschau</Button>
                <Button variant="secondary" onClick={() => handleDelete(d.docId)}>Löschen</Button>
              </div>
            </div>
          ))}
        </div>
        {preview && (
          <div className="mt-3 border rounded p-3 bg-white/50">
            <div className="text-xs text-gray-500 mb-1">Vorschau aus {preview.docId}</div>
            <pre className="whitespace-pre-wrap text-sm max-h-64 overflow-auto">{preview.text}</pre>
            <div className="mt-2">
              <Button variant="secondary" onClick={() => setPreview(null)}>Schließen</Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-medium">Suche (Debug)</div>
        <div className="flex gap-2">
          <Input placeholder="Frage oder Stichwort" value={query} onChange={(e) => setQuery(e.target.value)} />
          <Button onClick={handleSearch} disabled={!query || searching}>{searching ? 'Sucht...' : 'Suchen'}</Button>
        </div>
        <div className="space-y-3 mt-2">
          {hits.map((h) => (
            <div key={h.id} className="border rounded p-2">
              <div className="text-xs text-gray-500">{h.source} · Score {h.score.toFixed(2)}</div>
              <pre className="whitespace-pre-wrap text-sm">{h.text.slice(0, 800)}</pre>
            </div>
          ))}
          {hits.length === 0 && <div className="text-sm text-gray-500">Keine Treffer.</div>}
        </div>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-medium">Chat mit RAG</div>
        <div className="text-xs text-gray-500">Strenger RAG‑Modus: Antworten dürfen nur den Dokumenten‑Kontext nutzen. Bei fehlender Evidenz: „Nicht gefunden“.</div>
        <div className="space-y-2">
          <Textarea rows={4} placeholder="Deine Frage…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={handleChatAsk} disabled={!chatInput || chatLoading}>{chatLoading ? 'Fragt…' : 'Fragen'}</Button>
            <Button variant="secondary" onClick={() => setChatResponse('')}>Leeren</Button>
          </div>
          {chatResponse && (
            <div className="border rounded p-3 bg-white/50">
              <pre className="whitespace-pre-wrap text-sm">{chatResponse}</pre>
              {chatSources.length > 0 && (
                <div className="mt-3 border-t pt-2">
                  <div className="text-xs font-medium mb-1">Quellen</div>
                  <div className="space-y-2">
                    {chatSources.map((s) => (
                      <div key={s.id} className="text-xs text-gray-700">
                        <span className="font-mono">{s.source}</span>
                        {typeof s.page === 'number' && <span> · S.{s.page}</span>}
                        {typeof s.score === 'number' && <span> · Score {s.score.toFixed(2)}</span>}
                        {s.snippet && (
                          <div className="mt-1 text-gray-600 whitespace-pre-wrap">{s.snippet}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
