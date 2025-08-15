import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, currentQuestion, questionIndex, isHelpRequest } = await request.json()
    
    if (isHelpRequest) {
      const helpResponse = generateContextualHelp(message, currentQuestion)
      return NextResponse.json({
        response: helpResponse,
        isHelpResponse: true
      })
    }
    
    // Normale Antwortverarbeitung...
    return NextResponse.json({
      response: "Antwort verarbeitet",
      nextQuestion: questionIndex < 3 // Beispiel
    })
    
  } catch (error) {
    console.error('Dialog message error:', error)
    return NextResponse.json(
      { error: 'Message processing failed' },
      { status: 500 }
    )
  }
}

function generateContextualHelp(message: string, currentQuestion: any): string {
  const questionField = currentQuestion?.field || ''
  const lowerMessage = message.toLowerCase()
  
  // Kontextuelle Hilfe basierend auf aktueller Frage
  if (questionField.includes('WOHNFLÄCHE') && lowerMessage.includes('?')) {
    return `**Wohnfläche-Hilfe:**\n\nLaut Ihrem Szenario:\n• **Gesamtwohnfläche:** 634 m²\n• **Anzahl Wohneinheiten:** 10\n• **Miriam's Wohnung:** 57,5 m²\n\nTragen Sie "634" für die Gesamtwohnfläche ein.`
  }
  
  if (questionField.includes('WOHNEINHEITEN') && lowerMessage.includes('?')) {
    return `**Anzahl Wohneinheiten:**\n\nIhr Mehrfamilienhaus hat:\n• **Insgesamt:** 10 Wohneinheiten\n• **Pro Eingang:** 5 Wohnungen\n• **Aufteilung:** 2 Eingänge, 3 Etagen\n\nAntwort: "10 Wohneinheiten"`
  }
  
  if (questionField.includes('DÄMMUNG') && lowerMessage.includes('?')) {
    return `**Dämmungsmaßnahmen im Detail:**\n\n**Empfehlung Ihres Energieberaters:**\n• **System:** WDVS (Wärmedämmverbundsystem)\n• **Material:** 140mm Mineralwolle\n• **Eingangsfassade:** Mit Spaltklinker-Verkleidung\n• **Hoffassade:** Weiß verputzt\n• **Flächen:** 345,40 m² (Eingang) + 182,10 m² (Hof)`
  }
  
  return `**Gerne erkläre ich das!**\n\nZu Ihrer Frage "${message}":\n\nKönnen Sie spezifizieren, welchen Teil Sie nicht verstehen? Ich kann Ihnen mit allen Begriffen rund um die Gebäudesanierung helfen!`
}