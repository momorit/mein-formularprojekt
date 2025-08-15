import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  let message = 'Unbekannte Frage'
  let context = ''
  let formValues = {}
  
  try {
    const requestData = await request.json()
    message = requestData.message || 'Unbekannte Frage'
    context = requestData.context || ''
    formValues = requestData.formValues || {}
  } catch (parseError) {
    console.error('Could not parse request:', parseError)
    return NextResponse.json({
      response: "Fehler beim Verarbeiten der Anfrage. Bitte versuchen Sie es erneut.",
      llm_used: false,
      error: "Request parsing failed"
    }, { status: 400 })
  }
  
  try {
    // Kontext für das LLM aufbauen
    const fullContext = `GEBÄUDE-ENERGIEBERATUNG SZENARIO:
${context || 'Mehrfamilienhaus Baujahr 1965, Eingangsfassade Südseite, WDVS-Sanierung 140mm Mineralwolle, Ölheizung, Mieterin EG rechts 57.5m²'}

AKTUELLER FORMULAR-ZUSTAND:
${Object.keys(formValues).length > 0 ? 
  Object.entries(formValues).map(([key, value]) => `${key}: ${value}`).join('\n') : 
  'Noch keine Felder ausgefüllt'}

NUTZER-FRAGE: ${message}

AUFGABE: Beantworte die Frage als Experte für Gebäude-Energieberatung. Gib konkrete, hilfreiche Antworten basierend auf dem Szenario. Nutze deutsche Sprache und formatiere die Antwort übersichtlich.`

    // Echtes LLM aufrufen
    const response = await callLLM(fullContext, context, false)
    
    return NextResponse.json({
      response: response,