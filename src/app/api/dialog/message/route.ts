import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  let message = ''
  let session_id = ''
  let currentQuestion = null
  let questionIndex = 0
  let isHelpRequest = false
  
  try {
    const requestData = await request.json()
    message = requestData.message || ''
    session_id = requestData.session_id || ''
    currentQuestion = requestData.currentQuestion
    questionIndex = requestData.questionIndex || 0
    isHelpRequest = requestData.isHelpRequest || false
  } catch (parseError) {
    console.error('Could not parse request:', parseError)
    return NextResponse.json({
      response: "Fehler beim Verarbeiten der Anfrage.",
      llm_used: false,
      error: "Request parsing failed"
    }, { status: 400 })
  }
  
  try {
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
      prompt = `${szenario}

AUFGABE: Der Nutzer hat eine Hilfe-Anfrage gestellt. Erkläre als Energieberatungs-Experte die aktuelle Frage verständlich. Gib konkrete Hilfe basierend auf dem Szenario. Nutze deutsche Sprache und formatiere übersichtlich.`
    } else {
      prompt = `${szenario}

AUFGABE: 
1. Bewerte die Nutzer-Antwort zur aktuellen Frage
2. Bestätige kurz die Antwort
3. Stelle die nächste relevante Frage zur Gebäude-Energieberatung`
    }

    // LLM aufrufen
    const llmResponse = await callLLM(prompt, szenario, true)
    
    return NextResponse.json({
      response: llmResponse,
      session_id: session_id,
      question_index: questionIndex,
      is_help_response: isHelpRequest,
      llm_used: true
    })
    
  } catch (error) {
    console.error('Dialog message error:', error)
    
    // TypeScript-sichere Error-Behandlung
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
    
    // Fallback-Antworten
    const fallbackResponse = isHelpRequest 
      ? `**Gerne helfe ich Ihnen!**\n\nZur aktuellen Frage: ${currentQuestion?.question || 'Keine Frage verfügbar'}\n\nBitte formulieren Sie eine spezifische Frage, dann kann ich Ihnen besser helfen.`
      : `Vielen Dank für Ihre Antwort!\n\nLeider ist der KI-Assistent momentan nicht verfügbar. Ihre Antwort wurde trotzdem gespeichert.`
    
    return NextResponse.json({
      response: fallbackResponse,
      session_id: session_id,
      question_index: questionIndex,
      is_help_response: isHelpRequest,
      llm_used: false,
      error: errorMessage
    }, { status: 200 })
  }
}