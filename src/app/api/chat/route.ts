import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { message, context, formValues } = await request.json()
    
    // Kontext für das LLM aufbauen
    const fullContext = `
GEBÄUDE-ENERGIEBERATUNG SZENARIO:
${context || 'Mehrfamilienhaus Baujahr 1965, Eingangsfassade Südseite, WDVS-Sanierung 140mm Mineralwolle, Ölheizung, Mieterin EG rechts 57.5m²'}

AKTUELLER FORMULAR-ZUSTAND:
${Object.keys(formValues || {}).length > 0 ? 
  Object.entries(formValues).map(([key, value]) => `${key}: ${value}`).join('\n') : 
  'Noch keine Felder ausgefüllt'}

NUTZER-FRAGE: ${message}

AUFGABE: Beantworte die Frage als Experte für Gebäude-Energieberatung. Gib konkrete, hilfreiche Antworten basierend auf dem Szenario. Nutze deutsche Sprache und formatiere die Antwort übersichtlich.`

    // Echtes LLM aufrufen
    const response = await callLLM(fullContext, context, false)
    
    return NextResponse.json({
      response: response,
      context_understanding: "LLM-gestützte Antwort",
      llm_used: true
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    // Fallback bei LLM-Ausfall
    return NextResponse.json({
      response: `Entschuldigung, der KI-Assistent ist momentan nicht verfügbar. 

**Ihr Szenario:** Mehrfamilienhaus (1965), Eingangsfassade Südseite, WDVS mit 140mm Mineralwolle, Ölheizung.

**Ihre Frage:** ${message}

Bitte versuchen Sie es später erneut oder wenden Sie sich an den Support.`,
      context_understanding: "Fallback-Antwort (LLM nicht verfügbar)",
      llm_used: false,
      error: error.message
    }, { status: 200 }) // 200 damit Frontend die Fallback-Antwort anzeigen kann
  }
}