import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, currentQuestion, questionIndex, isHelpRequest } = await request.json()
    
    // Kontext für LLM aufbauen
    const szenario = `GEBÄUDE-ENERGIEBERATUNG DIALOG-SYSTEM

SZENARIO:
Sie besitzen ein Mehrfamilienhaus (Baujahr 1965) in der Siedlungsstraße 23. 
Es hat eine Rotklinkerfassade und 10 Wohneinheiten. Sie planen eine WDVS-Sanierung 
der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung. 
Das Gebäude hat eine Ölheizung im Keller. Sie müssen für eine Mieterin 
(EG rechts, 57,5m²) die mögliche Mieterhöhung berechnen.

AKTUELLE FRAGE: ${currentQuestion?.question || 'Keine aktuelle Frage'}
FRAGE ${questionIndex + 1} von 4

NUTZER-NACHRICHT: ${message}`

    let prompt = ''
    
    if (isHelpRequest) {
      // Hilfe-Anfrage
      prompt = `${szenario}

AUFGABE: Der Nutzer hat eine Hilfe-Anfrage gestellt. Erkläre als Energieberatungs-Experte die aktuelle Frage verständlich. Gib konkrete Hilfe basierend auf dem Szenario. Nutze deutsche Sprache und formatiere übersichtlich.

WICHTIG: 
- Beziehe dich auf das konkrete Szenario (Baujahr 1965, Eingangsfassade Südseite, etc.)
- Gib praktische Antwortmöglichkeiten
- Bleibe bei der aktuellen Frage`

    } else {
      // Antwort bewerten und nächste Frage vorbereiten
      prompt = `${szenario}

AUFGABE: 
1. Bewerte die Nutzer-Antwort zur aktuellen Frage
2. Bestätige kurz die Antwort
3. Stelle die nächste relevante Frage zur Gebäude-Energieberatung

WICHTIG:
- Stelle nur EINE neue Frage
- Beziehe dich auf das Szenario
- Frage nach konkreten Gebäudedaten für die Energieberatung
- Nutze deutsche Sprache`
    }

    // LLM aufrufen
    const llmResponse = await callLLM(prompt, szenario, true) // dialogMode = true
    
    return NextResponse.json({
      response: llmResponse,
      session_id: session_id,
      question_index: questionIndex,
      is_help_response: isHelpRequest,
      llm_used: true
    })
    
  } catch (error) {
    console.error('Dialog message error:', error)
    
    // Fallback-Antworten
    const fallbackResponse = isHelpRequest 
      ? `**Gerne helfe ich Ihnen!**\n\nZur aktuellen Frage: ${currentQuestion?.question || 'Keine Frage verfügbar'}\n\nBitte formulieren Sie eine spezifische Frage, dann kann ich Ihnen besser helfen.\n\n**Tipp:** Sie können auch einfach antworten und wir gehen zur nächsten Frage über.`
      : `Vielen Dank für Ihre Antwort!\n\nLeider ist der KI-Assistent momentan nicht verfügbar. Ihre Antwort wurde trotzdem gespeichert.\n\nMöchten Sie mit der nächsten Frage fortfahren?`
    
    return NextResponse.json({
      response: fallbackResponse,
      session_id: session_id,
      question_index: questionIndex,
      is_help_response: isHelpRequest,
      llm_used: false,
      error: error.message
    }, { status: 200 })
  }
}