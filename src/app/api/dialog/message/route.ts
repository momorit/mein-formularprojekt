// src/app/api/dialog/message/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

interface DialogSession {
  sessionId: string
  mainQuestions: string[]
  answers: { [key: string]: string }
  currentMainQuestion: number
  questionStatus: 'asking' | 'clarifying' | 'answered' | 'completed'
  context: string
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
}

const sessions = new Map<string, DialogSession>()


// System Prompt
const systemPrompt = `
Du bist ein erfahrener Energieberater. Du befindest dich in einem flexiblen Frage-Antwort-Dialog mit einem Nutzer.
Sprich freundlich, professionell und präzise. Antworte nur basierend auf dem Szenario und der aktuellen Hauptfrage.

🟢 Wenn der Nutzer eine **Rückfrage** zur aktuellen Hauptfrage stellt (z. B. Fragezeichen, "was bedeutet ...", "warum", "welche Optionen", ...):
  → beantworte ausschließlich diese Nachfrage.
  → Stelle am Ende maximal eine kurze Rückfrage wie:
     "Möchten Sie noch etwas zu dieser Frage wissen, oder können wir mit Ihrer Antwort fortfahren?"

🟡 Wenn der Nutzer **unsicher** oder sein Input unklar ist (z. B. "hallo", "ok", kurzer Satz ohne erkennbaren Inhalt):
  → frag freundlich nach, ob das eine Rückfrage oder schon eine eigentliche Antwort ist.

🔵 Wenn der Nutzer **klar antwortet** (z. B. "Südseite", "Mineralwolle", "Ja, freiwillige Sanierung"):
  → bestätige kurz.
  → gehe danach **zur nächsten Hauptfrage** über.
  → stelle die nächste Hauptfrage klar und verständlich.

Sprich immer **auf Deutsch**.
Springe NIE automatisch zur nächsten Frage bei einer Nachfrage.
`



export async function POST(request: NextRequest) {
  try {
    const { message, session_id } = await request.json()

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
        context: "Mehrfamilienhaus Baujahr 1965, WDVS-Sanierung Eingangsfassade Südseite, 140mm Mineralwolle",
        conversationHistory: []
      }
      sessions.set(session_id, session)
    }

    // Add user message to history
    session.conversationHistory.push({ role: 'user', content: message })

    // Nachfrage- / Progress-Erkennung
    const isFollowUp = detectFollowUpQuestion(message)
    const isProgress = detectProgressIntent(message)

    // Bau Prompt anhand Status
    let llmPrompt = ''
    let shouldProgress = false

    if (session.questionStatus === 'completed') {
      llmPrompt = `
Dialog abgeschlossen. Nutzer sagt: "${message}"

ANTWORTEN:
${JSON.stringify(session.answers)}

Bitte:
• bestätige freundlich
• fasse die Antworten zusammen
• erwähne, dass die Daten gespeichert werden können
`
    } 
    else if (isFollowUp && !isProgress) {
      // 1️⃣ Nachfrage zur aktuellen Frage
      const currentQ = session.mainQuestions[session.currentMainQuestion]
      llmPrompt = `
Nutzer stellt eine Nachfrage zur aktuellen Hauptfrage.

AKTUELLE FRAGE: "${currentQ}"
NACHFRAGE: "${message}"
SZENARIO: ${session.context}

Bitte beantworte NUR diese Nachfrage (kein Fortschritt).
Erinnere am Ende daran, dass der Nutzer noch weitere Fragen stellen kann oder "weiter" sagen kann.
`
    } 
    else if (isProgress) {
      // 2️⃣ Nutzer möchte zur nächsten Frage
      const currentQ = session.mainQuestions[session.currentMainQuestion]
      session.answers[`frage_${session.currentMainQuestion + 1}`] = message

      const nextIndex = session.currentMainQuestion + 1
      if (nextIndex < session.mainQuestions.length) {
        const nextQ = session.mainQuestions[nextIndex]
        llmPrompt = `
✅ Antwort erhalten: "${message}"

NÄCHSTE FRAGE (${nextIndex + 1}/${session.mainQuestions.length}):
${nextQ}

Bitte stelle die nächste Frage, kurz begründen warum sie wichtig ist.
`
        shouldProgress = true
      } else {
        llmPrompt = `
✅ Letzte Antwort: "${message}"

ALLE ANTWORTEN:
${JSON.stringify(session.answers)}

Bitte:
• bestätige herzlich
• fasse alle Antworten zusammen
• weise darauf hin, dass die Beratung abgeschlossen ist und gespeichert werden kann.
`
        session.questionStatus = 'completed'
      }
    } 
    else {
      // 3️⃣ Unklar (weder Follow-Up noch klare Antwort) → Rückfrage stellen
      const currentQ = session.mainQuestions[session.currentMainQuestion]
      llmPrompt = `
Der Nutzer sagt: "${message}"
Du bist dir nicht sicher, ob es eine Antwort oder eine Rückfrage ist.

AKTUELLE FRAGE: "${currentQ}"

Bitte:
• frag höflich nach, ob die Eingabe eine Rückfrage zur aktuellen Frage ist oder bereits eine Antwort.
• gib KEINE neue Hauptfrage aus.
`
    }

    // Conversation History an LLM übergeben
    const llmMessages = [
      { role: 'system', content: systemPrompt },
      ...session.conversationHistory.map(m => ({ role: m.role, content: m.content })),
      { role: 'assistant', content: llmPrompt }
    ]

    const llmResponse = await callLLM(llmMessages)

    // Update history with LLM response
    session.conversationHistory.push({ role: 'assistant', content: llmResponse })

    // Fortschritt aktualisieren
    if (shouldProgress) {
      session.currentMainQuestion++
      session.questionStatus = 'asking'
    }

    sessions.set(session_id, session)

    return NextResponse.json({
      response: llmResponse,
      session_id,
      current_question: session.currentMainQuestion + 1,
      total_questions: session.mainQuestions.length,
      dialog_complete: session.questionStatus === 'completed',
      answers_collected: session.answers,
      can_ask_followup: session.questionStatus !== 'completed'
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ response: "Fehler – bitte nochmal versuchen." }, { status: 500 })
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