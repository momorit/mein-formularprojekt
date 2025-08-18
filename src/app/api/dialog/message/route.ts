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

// ——— Stil-/Verhaltensleitlinien (knapp, natürlich) ———
const styleDirectives = `
Sprich natürlich, knapp und präzise (1–3 Sätze).
Keine Überschriften/Labels wie "Bestätigung:" oder "Nächste Frage:".
Erfinde nichts; nutze nur vorhandene Infos oder ausdrücklich genannte Angaben.
Höchstens EINE kurze Rückfrage, nur wenn wirklich nötig.
Fokussiere ausschließlich auf die vier Formularfelder und deren Bestätigung/Korrektur.
Alle Antworten auf Deutsch.
`.trim()

// ——— System Prompt ———
const systemPrompt = `
Du bist ein Energieberater in einem geführten Dialog, der vier Formularfelder nacheinander klärt.
${styleDirectives}

Regeln:
- Bei Rückfragen des Nutzers zur aktuellen Frage: bleibe bei dieser Frage und beantworte nur die Nachfrage.
- Bei klarer Antwort/Bestätigung: kurz bestätigen und direkt zur nächsten Frage überleiten.
- Bei Unsicherheit: eine einzige gezielte Klärungsfrage stellen.
- Bei "weiter" ohne Antwort: zur nächsten Frage überleiten (ohne Inhalte zu erfinden).
- Am Ende: kurz sagen, dass das Formular ausgefüllt wurde und jetzt weitergeleitet wird.
`.trim()

// ——— Helper ———
function norm(s: string) {
  return (s || '').toLowerCase().trim()
}

function detectFollowUpQuestion(message: string): boolean {
  const m = norm(message)
  if (m.endsWith('?') || m.includes('?')) return true
  const indicators = [
    'warum','wieso','weshalb',
    'wie','was','welche','welcher','welches',
    'wo','wann','wer',
    'bedeutet','heißt','erkläre','erklären',
    'beispiel','genauer','details','mehr details','optionen',
    'ich verstehe nicht','unklar','unsicher','hilfe'
  ]
  return indicators.some(k => m.includes(k))
}

function detectProgressIntent(message: string): boolean {
  const m = norm(message)
  const progress = [
    'weiter','nächste','nächste frage','weiter bitte',
    'go on','next','continue','fortfahren','weitergehen',
    'ok weiter','passt, weiter','machen wir weiter'
  ]
  return progress.some(k => m === k || m.includes(k))
}

function isLikelyAnswer(message: string): boolean {
  const m = norm(message)
  const alnumCount = (m.match(/[a-z0-9äöüß]/g) || []).length
  return alnumCount >= 3 && !detectFollowUpQuestion(m) && !detectProgressIntent(m)
}

function buildHistorySnippet(history: DialogSession['conversationHistory']) {
  const last = history.slice(-6).map(h => `${h.role.toUpperCase()}: ${h.content}`).join('\n')
  return last ? `\nVERLAUF (gekürzt):\n${last}\n` : ''
}

// ——— POST ———
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
        // Vier FELD-Fragen, die sich direkt aus dem Szenario bestätigen/korrigieren lassen:
        mainQuestions: [
          // 1: Sanierungsseite
          'Welche Gebäudeseite soll im Rahmen der Sanierung gedämmt werden?',
          // 2: Dämmaufbau
          'Welches Dämmmaterial und welche Dämmstärke sind für die geplante Maßnahme vorgesehen?',
          // 3: Untergrund/Materialität (Rückfragen möglich: Klinker/WDVS)
          'Aus welchem Material besteht die bestehende Fassade, und gibt es Besonderheiten, die bei der Dämmung berücksichtigt werden müssen?',
          // 4: Heizung + Ziel „Mieterhöhung EG rechts 57,5 m²“ (Bestätigung)
          'Welche Heizungsart ist aktuell im Gebäude vorhanden?'
        ],
        answers: {},
        currentMainQuestion: 0,
        questionStatus: 'asking',
        context:
          'Mehrfamilienhaus (Baujahr 1965), Adresse: Siedlungsstraße 23. Rotklinkerfassade, 10 Wohneinheiten. Geplante WDVS-Sanierung der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle. Ölheizung im Keller. Es soll für die Mieterin (EG rechts, 57,5m²) die mögliche Mieterhöhung berechnet werden.',
        conversationHistory: []
      }
      sessions.set(session_id, session)
    }

    const total = session.mainQuestions.length
    const idx = session.currentMainQuestion
    const currentQ = session.mainQuestions[idx]

    // Nutzer-Message in History
    session.conversationHistory.push({ role: 'user', content: message, ts: Date.now() })

    const isFollowUp = detectFollowUpQuestion(message)
    const isProgress = detectProgressIntent(message)

    // Abgeschlossen?
    if (session.questionStatus === 'completed') {
      const prompt = [
        systemPrompt,
        `KONTEXT: ${session.context}`,
        `STATUS: Dialog abgeschlossen.`,
        `ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
        buildHistorySnippet(session.conversationHistory),
        `NUTZER: ${message}`,
        `AUFGABE: In 1–2 Sätzen bestätigen, dass das Formular ausgefüllt wurde und jetzt weitergeleitet wird.`
      ].join('\n\n')

      const llmResponse = await callLLM(prompt, '', true)
      session.conversationHistory.push({ role: 'assistant', content: llmResponse, ts: Date.now() })

      return NextResponse.json({
        response: llmResponse,
        session_id,
        current_question: total,
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

    // Priorität: Follow-up vor Progress
    if (isFollowUp) {
      // Rückfrage: bei der Frage bleiben, nicht springen
      prompt = [
        systemPrompt,
        `KONTEXT: ${session.context}`,
        `AKTUELLE FRAGE (${idx + 1}/${total}): "${currentQ}"`,
        buildHistorySnippet(session.conversationHistory),
        `NUTZER (Rückfrage): ${message}`,
        `ANTWORT-RICHTLINIEN:
- Beantworte nur die Nachfrage.
- Kein Fortschritt. Keine neue Frage.
- Keine Labels/Listen. 1–3 Sätze.
- Eine kurze Anschlussfrage ist erlaubt, z. B.: "Möchten Sie das so eintragen oder noch etwas dazu klären?"`
      ].join('\n\n')
    } else if (isProgress) {
      // Weiter ohne Antwort speichern
      const nextIndex = idx + 1
      if (nextIndex < total) {
        const nextQ = session.mainQuestions[nextIndex]
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `BISHERIGE ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
          buildHistorySnippet(session.conversationHistory),
          `NUTZER (Weiter): ${message}`,
          `AUFGABE:
- Kurz bestätigen, dass wir fortfahren.
- Stelle die nächste Frage natürlich in 1–2 Sätzen.`,
          `NÄCHSTE FRAGE (${nextIndex + 1}/${total}): "${nextQ}"`
        ].join('\n\n')
        advance = true
      } else {
        // Abschluss
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
          buildHistorySnippet(session.conversationHistory),
          `NUTZER: ${message}`,
          `AUFGABE: In 1–2 Sätzen sagen, dass das Formular ausgefüllt wurde und jetzt weitergeleitet wird.`
        ].join('\n\n')
        markCompleted = true
      }
    } else if (isLikelyAnswer(message)) {
      // Echte Antwort: speichern & weiter
      saveAnswer = true
      savedAnswerText = message

      const nextIndex = idx + 1
      if (nextIndex < total) {
        const nextQ = session.mainQuestions[nextIndex]
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `AKTUELLE FRAGE (${idx + 1}/${total}): "${currentQ}"`,
          `NUTZER-ANGABE: "${message}"`,
          `AUFGABE:
- Kurz bestätigen (natürlich, ohne Labels).
- In 1 Satz optional eine knappe fachliche Notiz (nur wenn sinnvoll).
- Dann natürlich zur nächsten Frage überleiten (1 Satz).`,
          `NÄCHSTE FRAGE (${nextIndex + 1}/${total}): "${nextQ}"`
        ].join('\n\n')
        advance = true
      } else {
        // Letzte Antwort -> Abschlussformulierung
        prompt = [
          systemPrompt,
          `KONTEXT: ${session.context}`,
          `LETZTE FRAGE (${idx + 1}/${total}): "${currentQ}"`,
          `NUTZER-ANGABE: "${message}"`,
          `BISHERIGE ANTWORTEN: ${JSON.stringify(session.answers, null, 2)}`,
          `AUFGABE:
- Kurz bestätigen.
- In 1–2 Sätzen klar sagen: "Das Formular ist ausgefüllt und wird jetzt weitergeleitet."`
        ].join('\n\n')
        markCompleted = true
      }
    } else {
      // Unklar: eine gezielte Rückfrage, ohne Fortschritt
      prompt = [
        systemPrompt,
        `KONTEXT: ${session.context}`,
        `AKTUELLE FRAGE (${idx + 1}/${total}): "${currentQ}"`,
        buildHistorySnippet(session.conversationHistory),
        `NUTZER: ${message}`,
        `AUFGABE:
- Stelle eine einzige gezielte Klärungsfrage, ob es eine Nachfrage zur aktuellen Frage ist oder bereits eine Angabe fürs Feld.
- Kein Fortschritt, keine neue Frage.`
      ].join('\n\n')
    }

    const llmResponse = await callLLM(prompt, '', true)

    if (saveAnswer) {
      // Speichere neutral als frage_1..frage_4 (du kannst hier gern sprechende Keys verwenden)
      session.answers[`frage_${idx + 1}`] = savedAnswerText
    }
    if (advance) {
      session.currentMainQuestion = Math.min(idx + 1, total - 1)
      session.questionStatus = 'asking'
    }
    if (markCompleted) {
      session.questionStatus = 'completed'
    }

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
