import { NextRequest, NextResponse } from 'next/server'

// LLM Import erst später hinzufügen
// import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { message, context, formValues } = await request.json()
    
    // TODO: LLM integration
    // const llmResponse = await callLLM(prompt, context, false)
    
    // Für jetzt: einfache Antworten
    const response = generateSimpleResponse(message, context)
    
    return NextResponse.json({
      response: response,
      context_understanding: "Einfache Antwort",
      llm_used: false
    })
  } catch (error) {
    console.error('Chat API error:', error)
    
    return NextResponse.json({
      response: "Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.",
      llm_used: false
    }, { status: 200 })
  }
}

function generateSimpleResponse(message: string, context: string): string {
  // Ihre bisherige Logik hier
  return "Antwort auf: " + message
}