import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, context, formValues } = await request.json()
    
    // Erweiterte LLM-Integration (falls verfügbar)
    // Für jetzt eine intelligente Antwort basierend auf Fragen
    const intelligentResponse = generateIntelligentResponse(message, context, formValues)
    
    return NextResponse.json({
      response: intelligentResponse,
      context_understanding: "Formular-Hilfe verstanden",
      suggestions: generateSuggestions(message)
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Chat-Hilfe nicht verfügbar' },
      { status: 500 }
    )
  }
}

function generateIntelligentResponse(message: string, context: string, formValues: any): string {
  const lowerMessage = message.toLowerCase()
  
  // Spezifische Hilfen basierend auf Nachfrage
  if (lowerMessage.includes('u-wert')) {
    return `**U-Wert Hilfe:**\n\nDer U-Wert misst den Wärmeverlust durch die Fassade:\n• **Aktueller Zustand (1965):** ca. 1,7 W/m²·K (schlecht gedämmt)\n• **Nach WDVS-Sanierung:** unter 0,24 W/m²·K (gut gedämmt)\n• **Bedeutung:** Je niedriger, desto besser die Dämmung\n\nFür Ihr Gebäude von 1965 können Sie 1,7 W/m²·K eintragen.`
  }
  
  if (lowerMessage.includes('wdvs')) {
    return `**WDVS erklärt:**\n\n**W**ärme**d**ämm**v**erbund**s**ystem:\n• Dämmplatten werden außen auf die Fassade geklebt\n• Darüber kommt ein Putz oder eine Verkleidung\n• Ihr Energieberater empfiehlt: 140mm Mineralwolle\n• Eingangsfassade: mit Spaltklinker-Verkleidung\n• Hoffassade: weiß verputzt`
  }
  
  if (lowerMessage.includes('energieträger') || lowerMessage.includes('heizung')) {
    return `**Energieträger bei Baujahr 1965:**\n\n• **Typisch:** Ölheizung im Keller\n• **Laut Szenario:** Das Gebäude hat eine Öl-Heizung\n• **Alternative:** Falls modernisiert, könnte es Erdgas oder Fernwärme sein\n\nFür Ihr Gebäude wählen Sie "Heizöl".`
  }
  
  if (lowerMessage.includes('wohnungsbezeichnung') || lowerMessage.includes('lage')) {
    return `**Wohnungslage im Gebäude:**\n\n• **EG** = Erdgeschoss (Hochparterre)\n• **OG** = Obergeschoss (1. Stock)\n• **DG** = Dachgeschoss\n• **Links/Rechts** = Seite im Gebäude\n\n**Für Miriam Mieterin:** "EG Rechts" (Hochparterre rechts, 57,5m²)`
  }
  
  if (lowerMessage.includes('himmelsrichtung') || lowerMessage.includes('fassade')) {
    return `**Himmelsrichtung bestimmen:**\n\n• **Eingangsfassade** = Straßenseite\n• **Wichtig für:** Sonneneinstrahlung und Dämmstoffwahl\n• **Tipp:** Schauen Sie auf Google Maps oder einen Kompass\n• **Beispiel:** Wenn die Haustür nach Süden zeigt → "Süden"`
  }
  
  // Allgemeine Hilfe für Fragen mit "?"
  if (message.includes('?')) {
    return `**Gerne helfe ich Ihnen!**\n\nIch kann Ihnen bei folgenden Themen helfen:\n• **U-Wert**: Was bedeutet dieser Wert?\n• **WDVS**: Was ist ein Wärmedämmverbundsystem?\n• **Energieträger**: Welche Heizung hat mein Gebäude?\n• **Wohnungslage**: Wie beschreibe ich die Position?\n• **Himmelsrichtung**: Wie finde ich die Ausrichtung?\n\n**Tipp:** Stellen Sie spezifische Fragen zu den Formularfeldern!`
  }
  
  return `**Verstanden!** Ich helfe Ihnen gerne bei der Formularbearbeitung.\n\nFür spezifische Hilfe zu einem Feld, fragen Sie einfach nach dem Begriff (z.B. "Was ist der U-Wert?").\n\n**Kontext:** ${context}\n**Ihre Nachfrage:** ${message}`
}

function generateSuggestions(message: string): string[] {
  const suggestions = [
    "Was bedeutet U-Wert?",
    "Wie finde ich die Himmelsrichtung?",
    "Was ist WDVS?",
    "Welche Heizung hat mein Gebäude?",
    "Wo liegt die Wohnung genau?"
  ]
  
  return suggestions.slice(0, 3) // Zeige nur 3 Vorschläge
}