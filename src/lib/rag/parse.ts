// src/lib/rag/parse.ts
// Zweck: Robustes Text-Parsing für PDF, DOCX und Plaintext als Grundlage für RAG.
//  - PDF: pdf-parse (CJS via createRequire), liefert res.text; wir normalisieren stark
//  - DOCX: mammoth.extractRawText; Fallback bei Abwesenheit
//  - TXT/sonstiges: Dateiinhalt als Text
// Normalisierung: De-Hyphenation, Steuerzeichen entfernen, Unicode-NFKC, Leerraum-Konsolidierung
// Fehler: Klare, deutsche Fehlermeldungen für fehlende OCR/Module

import { createRequire } from 'node:module'

function normalizeExtractedText(input: string): string {
  let t = input
    .replace(/\r\n/g, '\n')
    // de-hyphenate line breaks: "Wärme-\nschutz" -> "Wärmeschutz"
    .replace(/([\p{L}\p{N}])-(?:\n|\r\n)([\p{L}\p{N}])/gu, '$1$2')
    // collapse multiple spaces/newlines
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/\u00A0/g, ' ') // no-break space
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
  t = t
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
  t = t.replace(/\n{3,}/g, '\n\n')
  try {
    t = t.normalize('NFKC')
  } catch {}
  return t.trim()
}

type Parsed = { text: string; meta?: Record<string, any> };

export async function parseBlob(file: Blob, filename: string): Promise<Parsed> {
  const type = (file as any).type as string | undefined;
  const ext = filename.toLowerCase().split('.').pop() || '';
  const isPDF = type === 'application/pdf' || ext === 'pdf';
  const isDOCX = type ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx';

  if (isPDF) return parsePDF(file);
  if (isDOCX) return parseDOCX(file);
  // Fallback: treat as text
  const text = await file.text();
  return { text };
}

async function parsePDF(file: Blob): Promise<Parsed> {
  const buf = Buffer.from(await file.arrayBuffer())
  const require = createRequire(import.meta.url)
  try {
    // Use CommonJS entry to avoid bundler ESM quirks and worker issues
    const pdfParse: any = require('pdf-parse')
    const res = await pdfParse(buf)
    const raw = String(res?.text || '')
    const text = normalizeExtractedText(raw)
    if (!text) throw new Error('Keine extrahierbare PDF-Textschicht gefunden (möglicherweise gescannt, OCR nötig).')
    return { text, meta: { pdf_numpages: res?.numpages } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('parsePDF error (pdf-parse CJS):', msg)
    throw new Error('PDF-Parsing nicht verfügbar oder fehlgeschlagen: ' + msg)
  }
}

async function parseDOCX(file: Blob): Promise<Parsed> {
  try {
    const mod: any = await import('mammoth');
    const mammoth: any = mod?.default || mod; // handle CJS/ESM interop
    const buf = Buffer.from(await file.arrayBuffer());
    const res = await (mammoth as any).extractRawText({ buffer: buf });
    const text = String(res?.value || '').trim();
    if (!text) throw new Error('Leeres DOCX ohne Textinhalt.');
    return { text };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('parseDOCX error:', msg);
    throw new Error('DOCX-Parsing nicht verfügbar oder fehlgeschlagen: ' + msg);
  }
}
