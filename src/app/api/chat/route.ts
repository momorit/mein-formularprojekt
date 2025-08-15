// src/app/api/chat/route.ts - FIXED MIT LLM
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { message, context, formValues } = await request.json()
    
    console.log('💬 Chat API called:', { message, hasContext: !!context })
    
    // Kontext für bessere LLM-Antworten aufbauen
    const enhancedContext = `
FORMULAR-KONTEXT: Gebäude-Energieberatung für Mehrfamilienhaus
SZENARIO: Baujahr 1965, WDVS-Sanierung Eingangsfassade Südseite, 140mm Mineralwolle

BEREITS AUSGEFÜLLTE FELDER:
${formValues ? Object.entries(formValues)
  .filter(([key, value]) => value && String(value).trim())
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n') : 'Noch keine Felder ausgefüllt'}

NUTZER-FRAGE: ${message}

AUFGABE: Beantworte die Frage hilfreich und spezifisch. Nutze das Szenario zur Unterstützung.
`

    try {
      const llmResponse = await callLLM(
        message,
        enhancedContext,
        false // Chat-Modus, nicht Dialog-Modus
      )
      
      console.log('✅ LLM Response generated successfully')
      
      return NextResponse.json({
        response: llmResponse,
        context_understanding: "LLM mit Formular-Kontext",
        llm_used: true
      })
      
    } catch (llmError) {
      console.error('❌ LLM call failed:', llmError)
      
      // Intelligenter Fallback bei LLM-Ausfall
      const fallbackResponse = generateIntelligentFallback(message, formValues)
      
      return NextResponse.json({
        response: fallbackResponse,
        context_understanding: "Fallback-System",
        llm_used: false
      })
    }
    
  } catch (error) {
    console.error('❌ Chat API error:', error)
    
    return NextResponse.json({
      response: "Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.",
      llm_used: false
    }, { status: 500 })
  }
}

function generateIntelligentFallback(message: string, formValues: any): string {
  const lowerMessage = message.toLowerCase()
  
  // Spezifische Hilfeantworten basierend auf dem Szenario
  if (lowerMessage.includes('gebäude') || lowerMessage.includes('fassade')) {
    return `Basierend auf Ihrem Szenario: Sie planen eine WDVS-Sanierung der **Eingangsfassade zur Straße (Südseite)** mit 140mm Mineralwolle-Dämmung. 

Das Gebäude ist ein Mehrfamilienhaus aus **Baujahr 1965** mit Rotklinkerfassade und 10 Wohneinheiten.`
  }
  
  if (lowerMessage.includes('dämmung') || lowerMessage.includes('material')) {
    return `Für Ihr Vorhaben ist **140mm Mineralwolle-Dämmung** vorgesehen. Dies ist eine bewährte Lösung für WDVS-Sanierungen und bietet gute Dämmeigenschaften.`
  }
  
  if (lowerMessage.includes('heizung') || lowerMessage.includes('energie')) {
    return `Das Gebäude hat eine **Ölheizung im Keller**. Nach der Fassadensanierung könnten Sie über eine Heizungsmodernisierung nachdenken, um die Energieeffizienz weiter zu steigern.`
  }
  
  if (lowerMessage.includes('miete') || lowerMessage.includes('mieterin')) {
    return `Sie müssen für die **Mieterin im EG rechts (57,5m²)** die mögliche Mieterhöhung nach der energetischen Sanierung berechnen. Dies ist Teil der rechtlichen Vorgaben.`
  }
  
  if (lowerMessage.includes('kosten') || lowerMessage.includes('preis')) {
    return `Die Kosten für eine WDVS-Sanierung hängen von verschiedenen Faktoren ab. Bei Ihrem Vorhaben (140mm Mineralwolle, Eingangsfassade) können Sie mit etwa 150-200€ pro m² rechnen.`
  }
  
  // Allgemeine Hilfe
  return `Ich helfe Ihnen gerne bei Fragen zur Gebäude-Energieberatung! 

**Ihr Szenario:** Mehrfamilienhaus (Baujahr 1965), WDVS-Sanierung der Eingangsfassade mit 140mm Mineralwolle.

Fragen Sie mich zu: Dämmung, Kosten, Mieterhöhung, rechtlichen Aspekten oder technischen Details.`
}