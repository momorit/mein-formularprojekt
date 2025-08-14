import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    // Predefined questions for Variant B
    const questions = [
      {
        id: 'total_living_space',
        question: 'Wie groß ist die gesamte Wohnfläche Ihres Gebäudes in Quadratmetern?',
        field: 'WOHNFLÄCHE_GESAMT',
        type: 'number',
        difficulty: 'easy',
        required: true
      },
      {
        id: 'num_units',
        question: 'Wie viele Wohneinheiten befinden sich in dem Gebäude?',
        field: 'ANZAHL_WOHNEINHEITEN',
        type: 'number',
        difficulty: 'easy',
        required: true
      },
      {
        id: 'insulation_measures',
        question: 'Beschreiben Sie detailliert die geplanten Dämmmaßnahmen. Welche Fassaden sollen gedämmt werden und mit welchem System?',
        field: 'DÄMMUNGSMASSNAHMEN_DETAIL',
        type: 'textarea',
        difficulty: 'hard',
        required: true
      },
      {
        id: 'cost_calculation',
        question: 'Wie hoch schätzen Sie die Gesamtkosten der Sanierung ein und wie soll die Finanzierung erfolgen? Bitte geben Sie auch an, welcher Anteil auf die Mieter umgelegt werden soll.',
        field: 'KOSTEN_FINANZIERUNG',
        type: 'textarea',
        difficulty: 'hard',
        required: true
      }
    ]
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return NextResponse.json({
      session_id: sessionId,
      questions,
      welcome_message: `Hallo! Ich führe Sie durch ${questions.length} Fragen zur Gebäude-Energieberatung.`
    })
  } catch (error) {
    console.error('Error starting dialog:', error)
    return NextResponse.json(
      { error: 'Failed to start dialog' },
      { status: 500 }
    )
  }
}
