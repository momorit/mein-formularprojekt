import { NextRequest, NextResponse } from 'next/server'

function generateHelpResponse(questionId: string): string {
  switch (questionId) {
    case 'total_living_space':
      return `**Hilfe zur Wohnfläche:**

Für Ihr Mehrfamilienhaus beträgt die Gesamtwohnfläche **634 m²** (laut Ihren Unterlagen).

Die Wohnflächenberechnung erfolgt nach WoFlV und umfasst alle beheizten Räume ohne Keller, Dachboden oder Nebenräume.

Antworten Sie einfach mit der Zahl: **634**`

    case 'num_units':
      return `**Hilfe zur Anzahl Wohneinheiten:**

Ihr Gebäude hat **10 Wohneinheiten** aufgeteilt auf:
- 2 Eingänge mit je 5 Wohnungen
- Hochparterre & Obergeschoss: je 1 Drei-Zimmer + 1 Zwei-Zimmer-Wohnung
- Dachgeschoss: 2 Drei-Zimmer-Wohnungen

Antworten Sie einfach: **10**`

    case 'insulation_measures':
      return `**Hilfe zu den Dämmmaßnahmen:**

Basierend auf der Empfehlung Ihres Energieberaters:

**Geplante Maßnahmen:**
- **Material:** 140mm Mineralwolle WDVS (nicht rückbaubar)
- **Eingangsfassade + Seitenfassaden:** Spaltklinker-Verkleidung (345,40 m²)
- **Hoffassade:** Weißer Putz (182,10 m²)
- **Gesamtfläche:** ca. 527,50 m²

**Beispielantwort:** "Fassadendämmung mit 140mm Mineralwolle WDVS. Eingangsfassade und Giebel mit Spaltklinker-Riemchen (345 m²), Hoffassade weiß verputzt (182 m²). Nicht rückbaubar."`

    case 'cost_calculation':
      return `**Hilfe zur Kostenplanung:**

**Kostenschätzung für WDVS-Dämmung:**
- Eingangsfassade mit Riemchen: ca. 180-220 €/m²
- Hoffassade mit Putz: ca. 120-150 €/m²
- **Gesamtkosten:** ca. 85.000-115.000 €

**Mieterhöhung nach § 559 BGB:**
- Max. 8% der Kosten jährlich umlegbar
- Bei 100.000 € = max. 8.000 €/Jahr auf alle Mieter

**Beispielantwort:** "Geschätzte Kosten: 100.000 €. Finanzierung über Eigenkapital und KfW-Förderung. Mieterhöhung: ca. 67 €/Monat pro Wohnung (8% p.a. der Kosten)."`

    default:
      return `Gerne helfe ich Ihnen bei dieser Frage! Können Sie spezifizieren, wobei Sie Unterstützung benötigen?`
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, currentQuestion, questionIndex } = await request.json()
    
    // Check for help request
    if (message === '?' || message.toLowerCase().includes('hilfe')) {
      const helpResponse = generateHelpResponse(currentQuestion?.id || '')
      return NextResponse.json({ response: helpResponse })
    }
    
    // Process normal message
    const response = `Vielen Dank für Ihre Antwort: "${message}". Ich habe das notiert.`
    
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error processing dialog message:', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}