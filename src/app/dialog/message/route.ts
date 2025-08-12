// app/api/dialog/message/route.ts
import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://mein-formularprojekt-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    console.log('💬 API: Processing dialog message...')
    
    const body = await request.json()
    const { sessionId, message, currentQuestion, questionIndex, totalQuestions } = body
    
    // Try backend first
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/dialog/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message,
          currentQuestion,
          questionIndex,
          totalQuestions
        }),
      })
      
      if (backendResponse.ok) {
        const data = await backendResponse.json()
        console.log('✅ Backend dialog response received')
        return NextResponse.json(data)
      } else {
        console.warn('⚠️ Backend failed, using fallback')
        throw new Error('Backend failed')
      }
    } catch (backendError) {
      console.warn('⚠️ Backend unavailable:', backendError)
      
      // Intelligent fallback responses
      let fallbackResponse = ""
      
      if (currentQuestion) {
        // Response to a specific question
        const field = currentQuestion.field?.toLowerCase() || ""
        const userAnswer = message.toLowerCase()
        
        if (field.includes('gebaeudetyp')) {
          if (userAnswer.includes('einfamilien')) {
            fallbackResponse = "Ein Einfamilienhaus - das ist gut zu wissen! Das hilft bei der Berechnung des Energiebedarfs."
          } else if (userAnswer.includes('mehrfamilien')) {
            fallbackResponse = "Ein Mehrfamilienhaus - das bedeutet meist höhere Förderbeträge sind möglich."
          } else {
            fallbackResponse = "Danke für die Angabe zum Gebäudetyp. Das ist wichtig für die Förderberechnung."
          }
        } else if (field.includes('baujahr')) {
          const year = parseInt(userAnswer.match(/\d{4}/)?.[0] || "0")
          if (year > 0) {
            if (year < 1980) {
              fallbackResponse = `Baujahr ${year} - ein älteres Gebäude. Hier sind oft größere Fördermittel verfügbar.`
            } else if (year < 2000) {
              fallbackResponse = `Baujahr ${year} - aus dieser Zeit stammen viele sanierungsbedürftige Gebäude.`
            } else {
              fallbackResponse = `Baujahr ${year} - ein neueres Gebäude. Trotzdem können Verbesserungen sinnvoll sein.`
            }
          } else {
            fallbackResponse = "Danke für die Angabe zum Baujahr. Das ist wichtig für die Bewertung des Sanierungsbedarfs."
          }
        } else if (field.includes('wohnflaeche')) {
          const area = parseInt(userAnswer.match(/\d+/)?.[0] || "0")
          if (area > 0) {
            if (area < 100) {
              fallbackResponse = `${area} m² - eine kompakte Wohnfläche. Auch hier lohnen sich energetische Verbesserungen.`
            } else if (area < 200) {
              fallbackResponse = `${area} m² - eine gute Größe. Bei dieser Fläche können Effizienzmaßnahmen deutliche Einsparungen bringen.`
            } else {
              fallbackResponse = `${area} m² - eine große Wohnfläche. Hier sind die Einsparpotentiale besonders hoch.`
            }
          } else {
            fallbackResponse = "Danke für die Angabe zur Wohnfläche. Das hilft bei der Berechnung der möglichen Einsparungen."
          }
        } else if (field.includes('heizung')) {
          if (userAnswer.includes('gas')) {
            fallbackResponse = "Eine Gasheizung - hier gibt es gute Modernisierungsmöglichkeiten mit Brennwerttechnik oder Hybridlösungen."
          } else if (userAnswer.includes('öl') || userAnswer.includes('oel')) {
            fallbackResponse = "Eine Ölheizung - der Umstieg auf erneuerbare Energien wird besonders gefördert."
          } else if (userAnswer.includes('wärmepumpe') || userAnswer.includes('waermepumpe')) {
            fallbackResponse = "Bereits eine Wärmepumpe - das ist sehr gut! Eventuell lohnt sich noch eine Optimierung."
          } else {
            fallbackResponse = "Danke für die Angabe zur Heizung. Das ist zentral für die Planung der Sanierungsmaßnahmen."
          }
        } else {
          fallbackResponse = "Vielen Dank für Ihre Antwort! Diese Information hilft uns bei der optimalen Beratung."
        }
        
        // Add progression info
        if (questionIndex < totalQuestions - 1) {
          fallbackResponse += " Lassen Sie uns mit der nächsten Frage fortfahren."
        }
      } else {
        // Free conversation after questions
        const lowerMessage = message.toLowerCase()
        
        if (lowerMessage.includes('förder') || lowerMessage.includes('foerder')) {
          fallbackResponse = "Zu Fördermöglichkeiten: Es gibt verschiedene Programme wie KfW-Kredite, BAFA-Zuschüsse oder regionale Förderungen. Die genauen Beträge hängen von Ihren geplanten Maßnahmen ab."
        } else if (lowerMessage.includes('kosten')) {
          fallbackResponse = "Zu den Kosten: Diese variieren stark je nach Umfang der Sanierung. Eine Energieberatung kann Ihnen konkrete Zahlen nennen und die wirtschaftlichsten Maßnahmen identifizieren."
        } else if (lowerMessage.includes('zeit') || lowerMessage.includes('dauer')) {
          fallbackResponse = "Zur Zeitplanung: Kleinere Maßnahmen dauern wenige Tage, umfassende Sanierungen können mehrere Monate benötigen. Eine gute Planung ist wichtig."
        } else if (lowerMessage.includes('danke') || lowerMessage.includes('vielen dank')) {
          fallbackResponse = "Gerne! Ich hoffe, ich konnte Ihnen bei Ihrem Förderantrag helfen. Bei weiteren Fragen stehe ich zur Verfügung."
        } else {
          fallbackResponse = "Das ist eine interessante Frage! Leider kann ich ohne KI-Backend nicht alle Details beantworten. Wenden Sie sich für spezifische Fragen an einen Energieberater."
        }
      }
      
      console.log('✅ Using intelligent fallback response')
      return NextResponse.json({
        response: fallbackResponse,
        nextQuestion: questionIndex < totalQuestions - 1,
        questionIndex: Math.min(questionIndex + 1, totalQuestions),
        helpProvided: !currentQuestion
      })
    }
    
  } catch (error) {
    console.error('💥 API Error:', error)
    return NextResponse.json(
      { error: 'Failed to process dialog message' },
      { status: 500 }
    )
  }
}