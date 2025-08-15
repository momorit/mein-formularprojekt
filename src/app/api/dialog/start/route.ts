import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // LLM soll den Dialog starten
    const prompt = `Du bist ein KI-Assistent für Gebäude-Energieberatung und führst einen strukturierten Dialog.

SZENARIO:
Sie besitzen ein Mehrfamilienhaus (Baujahr 1965) in der Siedlungsstraße 23. 
Es hat eine Rotklinkerfassade und 10 Wohneinheiten. Sie planen eine WDVS-Sanierung 
der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung. 
Das Gebäude hat eine Ölheizung im Keller. Sie müssen für eine Mieterin 
(EG rechts, 57,5m²) die mögliche Mieterhöhung berechnen.

AUFGABE: 
1. Begrüße den Nutzer freundlich
2. Erkläre kurz das Szenario
3. Stelle die erste wichtige Frage zur Gebäude-Energieberatung

WICHTIG:
- Nutze deutsche Sprache
- Stelle nur EINE konkrete Frage
- Die Frage soll sich auf Gebäudedaten beziehen, die für die Energieberatung wichtig sind`

    try {
      const welcomeMessage = await callLLM(prompt, context, true)
      
      return NextResponse.json({
        session_id: sessionId,
        welcome_message: welcomeMessage,
        llm_started: true,
        questions: [] // Keine vordefinierten Fragen mehr - alles über LLM
      })
    } catch (error) {
      // Fallback bei LLM-Ausfall
      console.error('LLM failed, using fallback:', error)
      
      const fallbackWelcome = `Hallo! Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung.

**Ihr Szenario:** Mehrfamilienhaus (Baujahr 1965), Eingangsfassade Südseite, WDVS-Sanierung mit 140mm Mineralwolle, Ölheizung.

**Erste Frage:** Welche Gebäudeseite soll hauptsächlich saniert werden? Die Eingangsfassade zur Straße oder eine andere Seite?`

      return NextResponse.json({
        session_id: sessionId,
        welcome_message: fallbackWelcome,
        llm_started: false,
        questions: []
      })
    }
    
  } catch (error) {
    console.error('Error starting dialog:', error)
    return NextResponse.json(
      { error: 'Failed to start dialog' },
      { status: 500 }
    )
  }
}