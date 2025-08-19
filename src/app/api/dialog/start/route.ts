import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Welcome message mit erster Frage
    const welcomeMessage = `Hallo! Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung.

Ihr Szenario: Sie besitzen ein Mehrfamilienhaus (Baujahr 1965) in der Siedlungsstraße 23. Es hat eine Rotklinkerfassade und 10 Wohneinheiten. Sie planen eine WDVS-Sanierung der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung. Das Gebäude hat eine Ölheizung im Keller. Sie müssen für eine Mieterin (EG rechts, 57,5m²) die mögliche Mieterhöhung berechnen.

Lassen Sie uns beginnen! Ich stelle Ihnen nacheinander 4 Fragen. Bei Unklarheiten können Sie gerne nachfragen.

Erste Frage: Welche Gebäudeseite soll hauptsächlich saniert werden? Die Eingangsfassade zur Straße oder eine andere Seite?`

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