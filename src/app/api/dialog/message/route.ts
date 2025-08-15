// src/app/api/dialog/message/route.ts - KOMPLETT ÜBERARBEITET
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

interface DialogSession {
  sessionId: string
  questions: string[]
  answers: { [key: string]: string }
  currentQuestionIndex: number
  context: string
}

const sessions = new Map<string, DialogSession>()

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, questionIndex } = await request.json()
    
    console.log('💬 Dialog message:', { message, session_id, questionIndex })
    
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
        answers: {} as { [key: string]: string },
        currentQuestionIndex: questionIndex || 0,
        context: "Mehrfamilienhaus Baujahr 1965, WDVS-Sanierung Eingangsfassade Südseite, 140mm Mineralwolle, Ölheizung, Mieterin EG rechts 57,5m²"
      }
    }
    
    // Antwort speichern
    const questionKey = `question_${session.currentQuestionIndex + 1}`
    session.answers[questionKey] = message
    
    // Nächste Frage bestimmen
    const nextQuestionIndex = session.currentQuestionIndex + 1
    const isLastQuestion = nextQuestionIndex >= session.questions.length
    const nextQuestion = isLastQuestion ? null : session.questions[nextQuestionIndex]
    
    // PRÄZISER LLM-PROMPT
    const llmPrompt = isLastQuestion 
      ? `Der Nutzer hat gerade die letzte Frage beantwortet: "${message}"

AUFGABE: 
1. Bestätige die Antwort höflich
2. Gratuliere zur Vervollständigung 
3. Fasse die 4 gesammelten Antworten kurz zusammen
4. Sage, dass die Daten erfasst wurden

ANTWORTE NUR auf Deutsch, freundlich und professionell.`
      
      : `Der Nutzer hat auf die Frage "${session.questions[session.currentQuestionIndex]}" geantwortet: "${message}"

SZENARIO: ${session.context}

AUFGABE:
1. Bestätige die Antwort kurz und positiv
2. Stelle dann die nächste Frage: "${nextQuestion}"
3. Gib bei Bedarf einen hilfreichen Hinweis zum Szenario

ANTWORTE NUR auf Deutsch, strukturiert und freundlich.`

    try {
      const llmResponse = await callLLM(
        llmPrompt,
        '', // Kein extra Kontext - alles ist im Prompt
        true // Dialog-Modus
      )
      
      console.log('✅ Dialog LLM response generated')
      
      // Session aktualisieren
      session.currentQuestionIndex = nextQuestionIndex
      sessions.set(session_id, session)
      
      return NextResponse.json({
        response: llmResponse,
        session_id: session_id,
        question_index: nextQuestionIndex,
        dialog_complete: isLastQuestion,
        answers_collected: session.answers
      })
      
    } catch (llmError) {
      console.error('❌ Dialog LLM failed:', llmError)
      
      // Fallback bei LLM-Ausfall
      const fallbackResponse = generateDialogFallback(
        message, 
        session.currentQuestionIndex, 
        nextQuestion, 
        isLastQuestion,
        session.answers
      )
      
      // Session trotzdem aktualisieren
      session.currentQuestionIndex = nextQuestionIndex
      sessions.set(session_id, session)
      
      return NextResponse.json({
        response: fallbackResponse,
        session_id: session_id,
        question_index: nextQuestionIndex,
        dialog_complete: isLastQuestion,
        answers_collected: session.answers
      })
    }
    
  } catch (error) {
    console.error('❌ Dialog API error:', error)
    return NextResponse.json({
      response: "Entschuldigung, es gab einen Fehler. Können Sie Ihre Antwort wiederholen?",
      session_id: "error"
    }, { status: 500 })
  }
}

function generateDialogFallback(
  message: string, 
  currentQuestionIndex: number, 
  nextQuestion: string | null, 
  isLastQuestion: boolean,
  allAnswers: { [key: string]: string }
): string {
  
  if (isLastQuestion) {
    return `🎉 **Ausgezeichnet!** Sie haben alle Fragen beantwortet.

**Ihre Angaben:**
- Sanierungsbereich: ${allAnswers['question_1'] || 'Eingangsfassade'}
- Dämmmaterial: ${allAnswers['question_2'] || 'Mineralwolle'}  
- Vorherige Maßnahmen: ${allAnswers['question_3'] || 'Keine'}
- Rechtliche Basis: ${message}

✅ **Ihre Daten wurden erfolgreich erfasst!**`
  }
  
  const confirmations = [
    `✅ **"${message}"** wurde als Sanierungsbereich erfasst.`,
    `✅ **"${message}"** als Dämmmaterial notiert.`,
    `✅ **"${message}"** zu vorherigen Maßnahmen erfasst.`,
    `✅ **"${message}"** zur rechtlichen Einordnung gespeichert.`
  ]
  
  return `${confirmations[currentQuestionIndex]}

**Nächste Frage (${currentQuestionIndex + 2}/4):** ${nextQuestion}

💡 *Nutzen Sie die Informationen aus Ihrem Szenario zur Beantwortung.*`
}