import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, session_id, questionIndex } = await request.json()
    
    const lowerMessage = message.toLowerCase()
    const currentQuestionNum = questionIndex || 0
    
    // Hilfe-Anfragen erkennen
    if (message.includes('?') && message.length < 5) {
      let helpText = ''
      
      if (currentQuestionNum === 0) {
        helpText = `**Gerne helfe ich Ihnen!**

Zur aktuellen Frage: Laut Ihrem Szenario wird die **Eingangsfassade zur Straße (Südseite)** saniert.

Sie können antworten:
- "Eingangsfassade" 
- "Straßenseite"
- "Südseite"

**Tipp:** Diese Information steht bereits in Ihrem Szenario!`
      } else if (currentQuestionNum === 1) {
        helpText = `**Gerne helfe ich Ihnen!**

Zur aktuellen Frage: Laut Ihrem Szenario ist **140mm Mineralwolle** vorgesehen.

Sie können antworten:
- "Mineralwolle"
- "140mm Mineralwolle"`
      } else {
        helpText = `**Gerne helfe ich Ihnen!**

Schauen Sie in Ihrem Szenario nach - dort finden Sie die Antwort auf die aktuelle Frage!`
      }
      
      return NextResponse.json({
        response: helpText,
        session_id: session_id,
        is_help: true
      })
    }
    
    // Normale Antworten verarbeiten und nächste Frage stellen
    let responseText = ''
    
    if (currentQuestionNum === 0) {
      responseText = `Vielen Dank! Ihre Antwort wurde gespeichert.

**Nächste Frage (2/4):** Welches Dämmmaterial ist für Ihr Vorhaben vorgesehen? Der Energieberater hat Mineralwolle empfohlen.`
    } else if (currentQuestionNum === 1) {
      responseText = `Vielen Dank! Ihre Antwort wurde gespeichert.

**Nächste Frage (3/4):** Wurden bereits andere energetische Maßnahmen am Gebäude durchgeführt (Dach, Keller, Fenster)?`
    } else if (currentQuestionNum === 2) {
      responseText = `Vielen Dank! Ihre Antwort wurde gespeichert.

**Letzte Frage (4/4):** Handelt es sich um eine freiwillige Modernisierung oder besteht eine gesetzliche Verpflichtung nach dem Gebäudeenergiegesetz (GEG)?`
    } else {
      responseText = `🎉 Ausgezeichnet! Sie haben alle Fragen beantwortet.

**Zusammenfassung Ihrer Angaben:**
- GEBÄUDESEITE_SANIERUNG: ${message}
- DÄMMSTOFF_TYP: [Ihre vorherigen Antworten]  
- VORHERIGE_MODERNISIERUNG: [Ihre vorherigen Antworten]
- MASSNAHMEN_KATEGORIE: [Ihre vorherigen Antworten]

Ihre Daten wurden erfasst und können nun gespeichert werden.`
    }
    
    return NextResponse.json({
      response: responseText,
      session_id: session_id,
      question_index: currentQuestionNum + 1,
      dialog_complete: currentQuestionNum >= 3
    })
    
  } catch (error) {
    console.error('Dialog message error:', error)
    return NextResponse.json({
      response: "Entschuldigung, es gab einen Fehler. Können Sie Ihre Antwort wiederholen?",
      session_id: "error"
    }, { status: 200 })
  }
}