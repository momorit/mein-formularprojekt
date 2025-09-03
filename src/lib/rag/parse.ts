// Parsing utilities for PDF, DOCX, and plain text
// Note: pdf-parse and mammoth are optional deps; route should handle absence gracefully

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
  try {
    // Lazy import to avoid hard dependency during build if not installed
    // @ts-ignore
    const pdfParse = (await import('pdf-parse')).default as any;
    const buf = Buffer.from(await file.arrayBuffer());
    const res = await pdfParse(buf);
    return { text: String(res?.text || ''), meta: { pdf_numpages: res?.numpages } };
  } catch (err) {
    // Fallback: raw text if user uploaded a text-like PDF
    const text = await file.text().catch(() => '');
    if (text) return { text };
    throw new Error('PDF parsing not available. Please install pdf-parse or upload a text file.');
  }
}

async function parseDOCX(file: Blob): Promise<Parsed> {
  try {
    // @ts-ignore
    const mammoth = await import('mammoth');
    const buf = Buffer.from(await file.arrayBuffer());
    const res = await (mammoth as any).extractRawText({ buffer: buf });
    return { text: String(res?.value || '') };
  } catch (err) {
    const text = await file.text().catch(() => '');
    if (text) return { text };
    throw new Error('DOCX parsing not available. Please install mammoth or upload a text file.');
  }
}

