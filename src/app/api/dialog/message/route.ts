// src/app/api/dialog/message/route.ts - MIT LLM-INTEGRATION
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

interface DialogSession {
  sessionId: string
  questions: string[]
  answers: { [key: string]: string } // Nur noch dieser Typ, kein Union mehr
  currentQuestionIndex: number
  context: string
}

// Session Storage (in production: Redis/Database)
const sessions = new Map<string, DialogSession>()

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, questionIndex } = await request.json()
    
    // Session abrufen oder erstellen
    let session = sessions.get(session_id)
    
    if (!session) {
      session = {
        sessionId: session_id,
        questions: [
          "Welche Gebäudeseite soll hauptsächlich saniert werden?",
          "Welches Dämmmaterial ist für Ihr Vorhaben vorgesehen?", 
          "Wurden bereits andere energetische Maßnahmen am Gebäude durchgeführt?",
          "Handelt es sich um eine freiwillige Modernisierung oder besteht eine gesetzliche Verpflichtung?"
        ],
        answers: {} as { [key: string]: string }, // Explizit typisiert
        currentQuestionIndex: questionIndex || 0,
        context: `Sie besitzen ein Mehrfamilienhaus (Baujahr 1965) in der Siedlungsstraße 23. 
                  Es hat eine Rotklinkerfassade und 10 Wohneinheiten. 
                  Sie planen eine WDVS-Sanierung der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung. 
                  Das Gebäude hat eine Ölheizung im Keller. 
                  Sie müssen für eine Mieterin (EG rechts, 57,5m²) die mögliche Mieterhöhung berechnen.`
      }
    }
    
    // Antwort zur Session hinzufügen
    const questionKey = `question_${session.currentQuestionIndex + 1}` as string
    session.answers[questionKey] = message
    
    // Kontext für LLM zusammenstellen
    const conversationContext = `
GEBÄUDE-KONTEXT: ${session.context}

BISHERIGE ANTWORTEN:
${Object.entries(session.answers).map(([key, value]) => `${key}: ${value}`).join('\n')}

AKTUELLE FRAGE: ${session.questions[session.currentQuestionIndex] || 'Alle Fragen beantwortet'}
NUTZER ANTWORT: ${message}

AUFGABE: 
1. Bestätige die Antwort des Nutzers
2. Wenn noch Fragen offen sind: Stelle die nächste Frage aus der Liste
3. Wenn alle Fragen beantwortet: Bedanke dich und fasse die wichtigsten Punkte zusammen
4. Sei hilfreich, freundlich und professionell
5. Antworte auf Deutsch
    `

    // LLM-Antwort generieren
    let llmResponse: string
    try {
      llmResponse = await callLLM(
        `Führe das Energieberatungs-Gespräch fort basierend auf der Nutzer-Antwort: "${message}"`,
        conversationContext,
        true // dialogMode = true
      )
    } catch (error) {
      console.error('LLM call failed:', error)
      // Fallback bei LLM-Ausfall
      llmResponse = `Vielen Dank für Ihre Antwort! ${
        session.currentQuestionIndex < session.questions.length - 1 
          ? `\n\n**Nächste Frage:** ${session.questions[session.currentQuestionIndex + 1]}`
          : '\n\n🎉 Alle Fragen sind beantwortet! Ihre Daten wurden erfasst.'
      }`
    }
    
    // Session aktualisieren
    session.currentQuestionIndex++
    sessions.set(session_id, session)
    
    // Prüfen ob Dialog komplett
    const isDialogComplete = session.currentQuestionIndex >= session.questions.length
    
    return NextResponse.json({
      response: llmResponse,
      session_id: session_id,
      question_index: session.currentQuestionIndex,
      dialog_complete: isDialogComplete,
      answers_collected: session.answers
    })
    
  } catch (error) {
    console.error('Dialog message error:', error)
    return NextResponse.json({
      response: "Entschuldigung, es gab einen Fehler. Können Sie Ihre Antwort wiederholen?",
      session_id: "error"
    }, { status: 500 })
  }
}