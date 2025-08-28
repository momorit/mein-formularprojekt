import { NextRequest, NextResponse } from "next/server";
import { queryKB } from "@/lib/rag/pipeline";
// dein bestehendes LLM ansprechen (z.B. Groq/OpenAI/Ollama via eigenes Backend)

async function generateAnswer(question: string, contexts: {text: string, source?: string}[]) {
  // Minimal: String-Konzatenation als Prompt; ersetze durch deinen LLM-Call
  const ctx = contexts.map((c,i)=>`[Dok ${i+1}] Quelle: ${c.source}\n${c.text}`).join("\n\n");
  const prompt = `Beantworte die Frage NUR mit folgenden Auszügen. Zitiere relevante Quellen (Quelle + Chunk):
Kontext:
${ctx}

Frage: ${question}

Antwort (Deutsch, präzise, inkl. kurzer Quellenliste):`;
  // TODO: call your LLM here
  return { text: "LLM-Antwort (hier deinen Call einbauen)", sources: contexts.map(c=>c.source) };
}

export async function POST(req: NextRequest) {
  const { question, k = 5 } = await req.json();
  const res = await queryKB(question, k);
  const contexts = (res.documents?.[0] || []).map((t: string, i: number) => ({
    text: t,
    source: res.metadatas?.[0]?.[i]?.source
  }));
  const ans = await generateAnswer(question, contexts);
  return NextResponse.json({ answer: ans.text, sources: ans.sources, contexts });
}
