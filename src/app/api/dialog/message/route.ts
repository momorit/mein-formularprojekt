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
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string; ts?: number }>
}

const sessions = new Map<string, DialogSession>()

// —————————— System Prompt ——————————
const systemPrompt = `
Du bist ein erfahrener Energieberater in einem geführten Dialog mit 4 Hauptfragen.
- Antworte präzise, freundlich, fachkundig und **auf Deutsch**.
- Erfinde keine Fakten; benutze nur gegebene Informationen.
- Bei **Rückfragen** (erkennbar an Fragezeichen oder W-Fragen) bleibst du **bei derselben Hauptfrage**.
- Bei **klarer Antwort**: kurz bestätigen und zur **nächsten Hauptfrage** überleiten.
- Bei **Unsicherheit**: bitte kurz um Präzisierung (z. B. "Ist das eine Nachfrage oder Ihre Antwort?").
- Stelle **maximal eine** kurze Rückfrage am Ende deiner Nachricht.
`

// —————————— Helper: Text-Normalisierung ——————————
function norm(s: string) {
  return (s || '').toLowerCase().trim()
}

// —————————— Helper: Follow-up erkennen ——————————
function detectFollowUpQuestion(message: string): boolean {
  const m = norm(message)

  // Eindeutig: Fragezeichen am Ende oder überhaupt ein '?'
  if (m.endsWith('?') || m.includes('?')) return true

  // Häufige Rückfrage-Indikatoren (Deutsch + ein paar engl. Fallbacks)
  const indicators = [
    'warum', 'wieso', 'weshalb',
    'wie', 'was', 'welche', 'welcher', 'welches',
    'wo', 'wann', 'wer',
    'bedeutet', 'heißt', 'erkläre', 'erklären',
    'beispiel', 'genauer', 'mehr details', 'optionen',
    'ich verstehe nicht', 'unklar', 'unsicher',
    // kurze Ein-Wort-Nachfragen
    'hilfe', 'beispiel?', 'details?'
  ]
  return indicators.some(k => m.includes(k))
}

// —————————— Helper: Fortschritt erkennen ——————————
function detectProgressIntent(message: string): boolean {
  const m = norm(message)
  // Nur **explizite** Fortschritts-Kommandos
  const progress = [
    'weiter', 'nächste', 'nächste frage', 'weiter bitte',
    'go on', 'next', 'continue', 'fortfahren', 'weitergehen',
    'ok weiter', 'passt, weiter', 'machen wir weiter'
  ]
  return progress.some(k => m === k || m.includes(k))
}

// —————————— Helper: Ist vermutlich eine echte Antwort ——————————
function isLikelyAnswer(message: string): boolean {
  const m = norm(message)
  // Wenn nicht Follow-up und nicht Progress und mehr als 2 alphanumerische Zeichen → Antwort
  const alnumCount = (m.match(/[a-z0-9äöüß]/g) || []).length
  return alnumCount >= 3 && !detectFollowUpQuestion(m) && !detectProgressIntent(m)
}

// —————————— Helper: kompakte History (letzte 6 Turns) ——————————
function buildHistorySnippet(history: DialogSession['conversationHistory']) {
  const last = history.slice(-6).map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')
  return last ? `\nVERLAUF (gekürzt):\n${last}\n` : ''
}

// —————————— POST ——————————
export async function POST(request: NextRequest) {
  try {
    const { message, session_id } = await request.json()

    if (!message || !session_id) {
      return NextResponse.json({ response: 'Fehlender Input.' }, { status: 400 })
    }

    // Session holen/erstellen
    let session = sessions.get(session_id)
    if (!session) {
      session = {
        sessionId: session_id,
        mainQuestions: [
          'Welche Gebäudeseite soll hauptsächlich saniert werden?',
          'Welches Dämmmaterial ist für Ihr Vorhaben vorgesehen?',
          'Wurden bereits andere energetische Maßnahmen am Gebäude durchgeführt?',
          'Handelt es sich um eine freiwillige Modernisierung oder besteht eine gesetzliche Verpflichtung?'
        ],
        answers: {},
        currentMainQuestion: 0,
        questionStatus: 'asking',
        context: 'Mehrfamilienhaus Baujahr 1965, WDVS-Sanierung Eingangsfassade Südseite, 140mm Mineralwolle',
        conversationHistory: []
      }
      sessions.set(session_id, session)
    }

    // Nutzer-Message in History
    session.conversationHistory.push({ role: 'user', content: message, ts: Date.now() })

    const isFollowUp = detectFollowUpQuestion(message)
    const isProgress = detectProgressIntent(message)
    const currentIndex = session.currentMainQuestion
    const currentQ = session.mainQuestions[currentIndex]
    const total = session.mainQuestions.length

    // Bereits abgeschlossen?
    if (session.questionStatus === 'completed') {
      const prompt = [
        systemPrompt,
        `KONTEXT: ${session.context}`,
        `STATUS: Dialog bereits abgeschlossen.`,
        `ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
        buildHistorySnippet(session.conversationHistory),
        `NUTZER: ${message}`,
        `AUFGABE:
- Freundlich bestätigen.
- Antworten kurz zusammenfassen.
- Erwähnen, dass gespeichert werden kann.`
      ].join('\n\n')

      const llmResponse = await callLLM(prompt, '', true)
      session.conversationHistory.push({ role: 'assistant', content: llmResponse, ts: Date.now() })

      return NextResponse.json({
        response: llmResponse,
        session_id,
        current_question: total, // bleibt am Ende
        total_questions: total,
        dialog_complete: true,
        answers_collected: session.answers,
        can_ask_followup: false
      })
    }

    let prompt = ''
    let advance = false
    let markCompleted = false
    let saveAnswer = false
    let savedAnswerText = ''

    // ——— Priorität: Follow-up vor Progress ———
    if (isFollowUp) {
      // 1) Rückfrage → Bei der Frage bleiben, nichts speichern
      prompt = [
        systemPrompt,
        `KONTEXT: ${session.context}`,
        `AKTUELLE HAUPTFRAGE (${currentIndex + 1}/${total}): "${currentQ}"`,
        buildHistorySnippet(session.conversationHistory),
        `NUTZER (Rückfrage): ${message}`,
        `ANTWORT-RICHTLINIEN:
- Beantworte NUR die Nachfrage.
- NICHT zur nächsten Frage springen.
- NICHT zusammenfassen, NICHT Antworten erfinden.
- Am Ende maximal eine kurze Rückfrage wie:
  "Möchten Sie noch etwas zu dieser Frage wissen, oder möchten Sie Ihre Antwort geben?"`
      ].join('\n\n')
    } else if (isProgress) {
      // 2) Nutzer will explizit weiter → NICHT als Antwort speichern
      const nextIndex = currentIndex + 1
      if (nextIndex < total) {
        const nextQ = session.mainQuestions[nextIndex]
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `BISHERIGE ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
          buildHistorySnippet(session.conversationHistory),
          `NUTZER (Weiter-Kommando): ${message}`,
          `AUFGABE:
- Kurz bestätigen, dass wir fortfahren.
- Stelle die nächste Hauptfrage **klar und kompakt**.
- Optional ein Satz, warum die Frage wichtig ist.`,
          `NÄCHSTE FRAGE (${nextIndex + 1}/${total}): "${nextQ}"`
        ].join('\n\n')
        advance = true
      } else {
        // Es gibt keine nächste Frage mehr → Abschluss
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
          buildHistorySnippet(session.conversationHistory),
          `NUTZER: ${message}`,
          `AUFGABE:
- Freundlich bestätigen.
- Alle Antworten strukturiert zusammenfassen.
- Abschluss erwähnen (Daten können gespeichert werden).`
        ].join('\n\n')
        markCompleted = true
      }
    } else if (isLikelyAnswer(message)) {
      // 3) Wahrscheinlich eine echte Antwort → speichern & weiter
      saveAnswer = true
      savedAnswerText = message

      const nextIndex = currentIndex + 1
      if (nextIndex < total) {
        const nextQ = session.mainQuestions[nextIndex]
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `AKTUELLE FRAGE (${currentIndex + 1}/${total}): "${currentQ}"`,
          `NUTZER-ANTWORT: "${message}"`,
          `AUFGABE:
- Antwort kurz positiv bestätigen (ohne sie zu verändern).
- Optional 1 Satz fachlicher Kommentar.
- Dann **zur nächsten Hauptfrage** überleiten und diese klar stellen.`,
          `NÄCHSTE FRAGE (${nextIndex + 1}/${total}): "${nextQ}"`
        ].join('\n\n')
        advance = true
      } else {
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `LETZTE FRAGE (${currentIndex + 1}/${total}): "${currentQ}"`,
          `NUTZER-ANTWORT: "${message}"`,
          `BISHERIGE ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
          `AUFGABE:
- Letzte Antwort freundlich bestätigen.
- Alle vier Antworten kompakt zusammenfassen.
- Abschluss + Hinweis auf Speichern.`
        ].join('\n\n')
        markCompleted = true
      }
    } else {
      // 4) Unklar → höfliche Rückfrage, ohne Fortschritt
      prompt = [
        systemPrompt,
        `KONTEXT: ${session.context}`,
        `AKTUELLE FRAGE (${currentIndex + 1}/${total}): "${currentQ}"`,
        buildHistorySnippet(session.conversationHistory),
        `NUTZER: ${message}`,
        `AUFGABE:
- Höflich nachfragen, ob das eine **Rückfrage** zur aktuellen Frage ist oder schon eine **Antwort**.
- KEIN Fortschritt, KEINE neue Frage stellen.`
      ].join('\n\n')
    }

    const llmResponse = await callLLM(prompt, '', true)

    // Antwort ggf. speichern (nur im "wahrscheinlich Antwort"-Zweig)
    if (saveAnswer) {
      session.answers[`frage_${currentIndex + 1}`] = savedAnswerText
    }

    // Fortschritt updaten
    if (advance) {
      session.currentMainQuestion = Math.min(currentIndex + 1, total - 1)
      session.questionStatus = 'asking'
    }
    if (markCompleted) {
      session.questionStatus = 'completed'
    }

    // History ergänzen
    session.conversationHistory.push({ role: 'assistant', content: llmResponse, ts: Date.now() })
    sessions.set(session_id, session)

    return NextResponse.json({
      response: llmResponse,
      session_id,
      current_question: session.currentMainQuestion + 1,
      total_questions: total,
      dialog_complete: session.questionStatus === 'completed',
      answers_collected: session.answers,
      can_ask_followup: session.questionStatus !== 'completed'
    })
  } catch (error) {
    console.error('❌ Flexible Dialog API error:', error)
    return NextResponse.json({
      response: 'Entschuldigung, es gab einen Fehler. Können Sie Ihre Nachricht wiederholen?',
      session_id: 'error'
    }, { status: 500 })
  }
}
