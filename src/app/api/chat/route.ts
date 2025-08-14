import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json()
    
    // Simple rule-based chat responses for the study
    const messageLower = message.toLowerCase()
    
    let response = 'Ich helfe gerne! '
    
    if (messageLower.includes('fassadenfläche') || messageLower.includes('fläche')) {
      response += `Für die Fassadenfläche berechnen Sie: 

**Eingangsfassade (Ost):** 26,50m × 8,20m = 217,30 m² abzgl. Fenster/Türen = ca. 180 m²
**Giebelfassaden:** Etwa 227,40 m²
**Hoffassade (West):** Etwa 182 m²

Für Ihr Mehrfamilienhaus mit geplanter Eingangs- und Seitenfassadendämmung wären das ca. **345-400 m²**. Welche Fassaden möchten Sie genau dämmen?`
    } else if (messageLower.includes('dämmung') || messageLower.includes('wdvs')) {
      response += `Für die Dämmspezifikation beschreiben Sie:

**Material:** Mineralwolle (empfohlen: 140mm Dicke)
**System:** WDVS (Wärmedämmverbundsystem) 
**Oberfläche:** 
- Eingangsfassade: Spaltklinker/Riemchen (Optik erhalten)
- Hoffassade: Weißer Putz

**Beispiel:** "140mm Mineralwolle WDVS, Eingangsfassade mit Spaltklinker-Verkleidung, Hoffassade weiß verputzt"`
    } else if (messageLower.includes('baujahr')) {
      response += `Ihr Gebäude wurde **1965** errichtet. Das ist wichtig für die Berechnung der energetischen Standards und möglicher Förderungen.`
    } else {
      response += `Können Sie Ihre Frage spezifischer stellen? Ich kann Ihnen bei der Berechnung von Flächen, Dämmspezifikationen oder anderen technischen Details helfen.`
    }
    
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Chat service unavailable' },
      { status: 500 }
    )
  }
}
