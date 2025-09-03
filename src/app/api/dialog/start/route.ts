import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Willkommen: LLM‑generiert, kurz, natürlich, direkt zur ersten Frage
    const systemOverride = `
Sprich natürlich, höflich und knapp (1–3 Sätze), ohne Emojis oder Listen.
Formuliere direkt die erste Frage (1/4) als echte Frage.
Keine Labels oder Überschriften; kein unnötiger Kontext.
`
    let welcomeMessage = ''
    try {
      const prompt = `Gib eine kurze Begrüßung und stelle sofort die erste Frage (1/4): Welche Gebäudeseite soll hauptsächlich saniert werden? Formuliere natürlich und prägnant.`
      welcomeMessage = await callLLM(prompt, context || '', true, systemOverride, { provider: 'groq' })
    } catch (e) {
      welcomeMessage = 'Hallo! Lassen Sie uns starten. Erste Frage (1/4): Welche Gebäudeseite soll hauptsächlich saniert werden?'
    }

    return NextResponse.json({
      session_id: sessionId,
      questions: [], // Leer, da wir jetzt dynamisch fragen
      welcome_message: welcomeMessage,
      current_question: "Gebäudeseite für Sanierung"
    })
  } catch (error) {
    console.error('Error starting dialog:', error)
    return NextResponse.json(
      { error: 'Failed to start dialog' },
      { status: 500 }
    )
  }
}
