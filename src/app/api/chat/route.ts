// src/app/api/chat/route.ts - FIXED MIT LLM
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'
import { searchTopK, formatContextFromHits } from '@/lib/rag/store'

function sanitizeSnippet(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, 300)
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, formValues, history } = await request.json()
    
    console.log('💬 Chat API called:', { message, hasContext: !!context })
    
    // Kontext für bessere LLM-Antworten aufbauen
    const filled = formValues ? Object.entries(formValues)
      .filter(([_, value]) => value && String(value).trim())
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n') : 'Noch keine Felder ausgefüllt'

    const lastTurns = Array.isArray(history)
      ? history.slice(-6).map((h: any) => `${h.role?.toUpperCase()}: ${h.message || h.content || ''}`).join('\n')
      : ''

    let enhancedContext = `
SZENARIO:
Mehrfamilienhaus, Baujahr 1965, Rotklinkerfassade, 10 WE.
Geplante Maßnahme: WDVS an der Eingangsfassade (Südseite) mit 140mm Mineralwolle.
Heizung: Ölheizung im Keller.
Aufgabe: Gebäude-Energieberatung und korrekte Formularbefüllung.

BEREITS AUSGEFÜLLTE FELDER:
${filled}

VERLAUF (gekürzt):
${lastTurns}
`

    // RAG: relevante Dokumentpassagen beifügen (falls vorhanden)
    let ragHits: any[] = []
    try {
      const hits = await searchTopK(String(message || '').slice(0, 2000))
      ragHits = hits
      if (ragHits.length > 0) {
        const ragCtx = formatContextFromHits(ragHits)
        enhancedContext += `\n\n${ragCtx}`
      }
    } catch (ragErr) {
      console.warn('RAG retrieval failed (continuing without RAG):', ragErr)
    }

    // Präziser Prompt: konkret, feldnah, deutsch
    const prompt = `
Beantworte die NUTZER-FRAGE präzise und feldnah auf Deutsch.
- Beziehe dich, wo sinnvoll, auf konkrete Formularfelder (mit Bezeichnung).
- Nenne Einheiten oder typische Wertebereiche, falls relevant (z.B. U-Wert in W/m²·K).
- Wenn die Frage unklar ist: stelle GENAU EINE gezielte Rückfrage.
- Kurzer, hilfreicher Stil: 2–5 Sätze. Kein Floskel-Overhead.

NUTZER-FRAGE:
${message}
`

    const systemOverride = `
Wenn der Nutzer nur ein Stichwort liefert (z.B. "Südseite"), interpretiere es fachlich korrekt (z.B. Himmelsrichtung: Süden) und erkläre in 1–2 Sätzen die Relevanz für das Formular.
Wenn möglich, schlage eine plausible Eintragung oder nächsten Schritt vor (z.B. Feldname + kurzer Hinweis).
Beziehe dich möglichst wörtlich auf zentrale Begriffe des Nutzers, damit der Bezug klar ist.
`

    try {
      const llmResponse = await callLLM(prompt, enhancedContext, false, systemOverride, { provider: 'groq' })
      
      console.log('✅ LLM Response generated successfully')
      
      return NextResponse.json({
        response: llmResponse,
        context_understanding: "LLM mit Formular-Kontext",
        llm_used: true,
        rag_used: Array.isArray(ragHits) && ragHits.length > 0,
        rag_hits: (ragHits || []).map(h => ({
          id: h.id,
          source: h.source,
          page: h.page,
          score: typeof h.score === 'number' ? Number(h.score.toFixed(2)) : undefined,
          snippet: typeof h.text === 'string' ? sanitizeSnippet(h.text) : undefined,
        })),
      })
      
    } catch (llmError) {
      console.error('❌ LLM call failed:', llmError)
      
      // Intelligenter Fallback bei LLM-Ausfall
      const fallbackResponse = generateIntelligentFallback(message, formValues)
      
      return NextResponse.json({
        response: fallbackResponse,
        context_understanding: "Fallback-System",
        llm_used: false,
        llm_error: llmError instanceof Error ? llmError.message : String(llmError)
      })
    }
    
  } catch (error) {
    console.error('❌ Chat API error:', error)
    
    return NextResponse.json({
      response: "Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.",
      llm_used: false
    }, { status: 500 })
  }
}

function generateIntelligentFallback(message: string, formValues: any): string {
  const lowerMessage = message.toLowerCase()
  if (lowerMessage.includes('wdvs')) {
    return `WDVS bedeutet Wärmedämmverbundsystem: Dämmplatten (z. B. Mineralwolle) werden außen auf die Fassade montiert und mit Putzschichten abgeschlossen, um den Wärmeschutz deutlich zu verbessern.`
  }
  if (lowerMessage.includes('u-wert') || lowerMessage.includes('u wert') || lowerMessage.includes('uwert')) {
    return `Der U‑Wert (W/m²·K) gibt an, wie viel Wärme durch ein Bauteil verloren geht. Je niedriger, desto besser; ungedämmte Fassaden der 1960er liegen oft um 1,6–1,8 W/m²·K.`
  }
  
  // Spezifische Hilfeantworten basierend auf dem Szenario
  if (lowerMessage.includes('gebäude') || lowerMessage.includes('fassade')) {
    return `Basierend auf Ihrem Szenario: Sie planen eine WDVS-Sanierung der **Eingangsfassade zur Straße (Südseite)** mit 140mm Mineralwolle-Dämmung. 

Das Gebäude ist ein Mehrfamilienhaus aus **Baujahr 1965** mit Rotklinkerfassade und 10 Wohneinheiten.`
  }
  
  if (lowerMessage.includes('dämmung') || lowerMessage.includes('material')) {
    return `Für WDVS werden häufig Mineralwolle, EPS (expandiertes Polystyrol), XPS (extrudiertes Polystyrol) oder Holzfaser verwendet. 140 mm Mineralwolle ist im Bestand eine gängige, brandsichere Wahl.`
  }
  
  if (lowerMessage.includes('heizung') || lowerMessage.includes('energie')) {
    return `Das Gebäude hat eine **Ölheizung im Keller**. Nach der Fassadensanierung könnten Sie über eine Heizungsmodernisierung nachdenken, um die Energieeffizienz weiter zu steigern.`
  }
  
  if (lowerMessage.includes('miete') || lowerMessage.includes('mieterin')) {
    return `Sie müssen für die **Mieterin im EG rechts (57,5m²)** die mögliche Mieterhöhung nach der energetischen Sanierung berechnen. Dies ist Teil der rechtlichen Vorgaben.`
  }
  
  if (lowerMessage.includes('kosten') || lowerMessage.includes('preis')) {
    return `Die Kosten für eine WDVS-Sanierung hängen von verschiedenen Faktoren ab. Bei Ihrem Vorhaben (140mm Mineralwolle, Eingangsfassade) können Sie mit etwa 150-200€ pro m² rechnen.`
  }
  
  // Allgemeine Hilfe
  return `Ich helfe Ihnen gerne bei Fragen zur Gebäude-Energieberatung! 

**Ihr Szenario:** Mehrfamilienhaus (Baujahr 1965), WDVS-Sanierung der Eingangsfassade mit 140mm Mineralwolle.

Fragen Sie mich zu: Dämmung, Kosten, Mieterhöhung, rechtlichen Aspekten oder technischen Details.`
}
