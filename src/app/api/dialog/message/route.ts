// src/app/api/dialog/message/route.ts - FLEXIBLER DIALOG MIT NACHFRAGEN
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

interface DialogSession {
  sessionId: string
  mainQuestions: string[]
  answers: { [key: string]: string }
  currentMainQuestion: number
  questionStatus: 'asking' | 'clarifying' | 'answered' | 'completed'
  context: string
  conversationHistory: Array<{
    question: string
    userResponse: string
    followUps: string[]
  }>
}

const sessions = new Map<string, DialogSession>()

export async function POST(request: NextRequest) {
  try {
    const { message, session_id } = await request.json()
    
    console.log('💬 Flexible Dialog message:', { message, session_id })
    
    // Session abrufen oder erstellen
    let session = sessions.get(session_id)
    
    if (!session) {
      session = {
        sessionId: session_id,
        mainQuestions: [
          "Welche Gebäudeseite soll hauptsächlich saniert werden?",
          "Welches Dämmmaterial ist für Ihr Vorhaben vorgesehen?", 
          "Wurden bereits andere energetische Maßnahmen am Gebäude durchgeführt?",
          "Handelt es sich um eine freiwillige Modernisierung oder besteht eine gesetzliche Verpflichtung?"
        ],
        answers: {},
        currentMainQuestion: 0,
        questionStatus: 'asking',
        context: "Mehrfamilienhaus Baujahr 1965, WDVS-Sanierung Eingangsfassade Südseite, 140mm Mineralwolle, Ölheizung, Mieterin EG rechts 57,5m²",
        conversationHistory: []
      }
      sessions.set(session_id, session)
    }

    // Nachfrage-Keywords erkennen
    const isFollowUpQuestion = detectFollowUpQuestion(message)
    const isReadyToProgress = detectProgressIntent(message)
    
    // LLM-Prompt basierend auf Dialog-Status
    let llmPrompt = ''
    let shouldProgressToNext = false
    
    if (session.questionStatus === 'completed') {
      // Alle Fragen beantwortet
      llmPrompt = `Der Dialog ist abgeschlossen. Der Nutzer sagt: "${message}"

KONTEXT: Alle 4 Hauptfragen wurden beantwortet.
ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}

AUFGABE:
1. Bestätige freundlich
2. Fasse die gesammelten Daten kurz zusammen  
3. Sage, dass die Beratung abgeschlossen ist
4. Erwähne, dass die Daten gespeichert werden können

ANTWORTE auf Deutsch, herzlich und professionell.`

    } else if (isFollowUpQuestion && !isReadyToProgress) {
      // Nutzer stellt Nachfrage zur aktuellen Hauptfrage
      const currentQuestion = session.mainQuestions[session.currentMainQuestion]
      
      llmPrompt = `Der Nutzer stellt eine Nachfrage zur aktuellen Hauptfrage.

AKTUELLE HAUPTFRAGE: "${currentQuestion}"
NUTZER-NACHFRAGE: "${message}"
SZENARIO: ${session.context}

AUFGABE:
1. Beantworte die Nachfrage detailliert und hilfreich
2. Bezug auf das Szenario nehmen (Baujahr 1965, WDVS-Sanierung, etc.)
3. Konkrete Beispiele und Empfehlungen geben
4. Am Ende fragen: "Haben Sie weitere Fragen zu diesem Punkt, oder können wir mit der Antwort fortfahren?"

ANTWORTE auf Deutsch, fachkundig aber verständlich.`

    } else if (isReadyToProgress || session.questionStatus === 'asking') {
      // Nutzer beantwortet Hauptfrage oder ist bereit weiterzugehen
      const currentQuestion = session.mainQuestions[session.currentMainQuestion]
      
      // Antwort zur aktuellen Hauptfrage speichern
      if (!isFollowUpQuestion) {
        session.answers[`frage_${session.currentMainQuestion + 1}`] = message
      }
      
      // Zur nächsten Hauptfrage oder Abschluss
      const nextQuestionIndex = session.currentMainQuestion + 1
      const hasMoreQuestions = nextQuestionIndex < session.mainQuestions.length
      
      if (hasMoreQuestions) {
        const nextQuestion = session.mainQuestions[nextQuestionIndex]
        
        llmPrompt = `Der Nutzer hat die Hauptfrage beantwortet: "${message}"

AKTUELLE FRAGE: "${currentQuestion}"
NÄCHSTE FRAGE: "${nextQuestion}"
SZENARIO: ${session.context}

AUFGABE:
1. Bestätige die Antwort positiv und kurz
2. Optional: Kurzer fachlicher Kommentar zur Antwort
3. Leite zur nächsten Frage über
4. Stelle die nächste Hauptfrage klar und deutlich
5. Erläutere kurz, warum diese Frage wichtig ist

FORMAT:
"✅ Verstanden: [Bestätigung]
[Optional: Kurzer Kommentar]

**Nächste Frage (${nextQuestionIndex + 1}/${session.mainQuestions.length}):** [Frage]
[Kurze Erläuterung]"

ANTWORTE auf Deutsch, strukturiert und freundlich.`

        shouldProgressToNext = true
        
      } else {
        // Letzte Frage beantwortet - Dialog abgeschlossen
        llmPrompt = `Der Nutzer hat die letzte Hauptfrage beantwortet: "${message}"

ALLE ANTWORTEN:
${Object.entries(session.answers).map(([key, value]) => `${key}: ${value}`).join('\n')}
LETZTE ANTWORT: ${message}

AUFGABE:
1. Bestätige die letzte Antwort herzlich
2. Gratuliere zur vollständigen Beratung
3. Fasse alle 4 Antworten strukturiert zusammen
4. Gib einen abschließenden fachlichen Hinweis
5. Sage, dass die Daten jetzt gespeichert werden können

ANTWORTE auf Deutsch, professionell und wertschätzend.`

        session.questionStatus = 'completed'
        session.answers[`frage_${session.currentMainQuestion + 1}`] = message
      }
    }

    try {
      const llmResponse = await callLLM(
        llmPrompt,
        '', // Kontext ist bereits im Prompt
        true // Dialog-Modus
      )
      
      console.log('✅ Flexible Dialog LLM response generated')
      
      // Session aktualisieren falls zur nächsten Frage
      if (shouldProgressToNext) {
        session.currentMainQuestion = session.currentMainQuestion + 1
        session.questionStatus = 'asking'
      }
      
      sessions.set(session_id, session)
      
      return NextResponse.json({
        response: llmResponse,
        session_id: session_id,
        current_question: session.currentMainQuestion + 1,
        total_questions: session.mainQuestions.length,
        dialog_complete: session.questionStatus === 'completed',
        answers_collected: session.answers,
        can_ask_followup: session.questionStatus !== 'completed'
      })
      
    } catch (llmError) {
      console.error('❌ Flexible Dialog LLM failed:', llmError)
      
      // Intelligenter Fallback
      const fallbackResponse = generateFlexibleFallback(
        message, 
        session,
        isFollowUpQuestion
      )
      
      return NextResponse.json({
        response: fallbackResponse,
        session_id: session_id,
        current_question: session.currentMainQuestion + 1,
        total_questions: session.mainQuestions.length,
        dialog_complete: session.questionStatus === 'completed',
        answers_collected: session.answers,
        can_ask_followup: true
      })
    }
    
  } catch (error) {
    console.error('❌ Flexible Dialog API error:', error)
    return NextResponse.json({
      response: "Entschuldigung, es gab einen Fehler. Können Sie Ihre Nachricht wiederholen?",
      session_id: "error"
    }, { status: 500 })
  }
}

// Nachfrage-Erkennung
function detectFollowUpQuestion(message: string): boolean {
  const followUpIndicators = [
    '?', 'warum', 'wie', 'was', 'welche', 'wo', 'wann', 'wer',
    'können sie', 'erkläre', 'erklären', 'bedeutet', 'heißt',
    'beispiel', 'genauer', 'detail', 'mehr', 'weitere',
    'verstehe nicht', 'unklar', 'unsicher'
  ]
  
  const lowerMessage = message.toLowerCase()
  return followUpIndicators.some(indicator => lowerMessage.includes(indicator))
}

// Fortschritts-Erkennung
function detectProgressIntent(message: string): boolean {
  const progressIndicators = [
    'weiter', 'nächste', 'fortfahren', 'fertig', 'ok', 'verstanden',
    'passt', 'stimmt', 'richtig', 'ja', 'genau', 'klar'
  ]
  
  const lowerMessage = message.toLowerCase().trim()
  
  // Kurze Antworten sind oft Fortschritts-Signale
  if (lowerMessage.length < 10) {
    return true
  }
  
  return progressIndicators.some(indicator => lowerMessage.includes(indicator))
}

// Flexibler Fallback
function generateFlexibleFallback(
  message: string,
  session: DialogSession,
  isFollowUp: boolean
): string {
  
  if (session.questionStatus === 'completed') {
    return `🎉 **Herzlichen Glückwunsch!** Sie haben alle 4 Fragen erfolgreich beantwortet.

**Ihre Angaben im Überblick:**
${Object.entries(session.answers).map(([key, value], index) => 
  `${index + 1}. ${session.mainQuestions[index]}\n   ➜ ${value}`
).join('\n\n')}

✅ **Ihre Beratung ist abgeschlossen.** Die Daten können jetzt gespeichert werden.`
  }
  
  if (isFollowUp) {
    const currentQuestion = session.mainQuestions[session.currentMainQuestion]
    return `Gerne helfe ich bei Ihrer Nachfrage zur aktuellen Frage!

**Aktuelle Frage:** ${currentQuestion}

Basierend auf Ihrem Szenario (Mehrfamilienhaus Baujahr 1965, WDVS-Sanierung) kann ich Ihnen detaillierte Informationen geben. 

**Was genau möchten Sie wissen?** Stellen Sie gerne weitere Fragen zu diesem Punkt.`
  }
  
  // Standard Antwort-Bestätigung
  const nextIndex = session.currentMainQuestion + 1
  const hasMore = nextIndex < session.mainQuestions.length
  
  if (hasMore) {
    return `✅ **Verstanden:** ${message}

**Nächste Frage (${nextIndex + 1}/${session.mainQuestions.length}):** 
${session.mainQuestions[nextIndex]}

Bei Fragen zu diesem Punkt können Sie gerne nachfragen!`
  } else {
    return `✅ **Perfekt!** Das war die letzte Frage.

**Ihre Beratung ist vollständig abgeschlossen.** 
Vielen Dank für Ihre Antworten! Die Daten können jetzt gespeichert werden.`
  }
}