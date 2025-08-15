// src/app/api/dialog/start/route.ts - UPDATED: Angepasste Fragen (einfach + eine schwer)
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    // Optimized questions for Variant B - most are easy, one is hard
    const questions = [
      {
        id: 'building_year',
        question: 'In welchem Jahr wurde Ihr Gebäude erbaut?',
        field: 'BAUJAHR',
        type: 'number',
        difficulty: 'easy',
        required: true
      },
      {
        id: 'total_units',
        question: 'Wie viele Wohneinheiten befinden sich in Ihrem Gebäude?',
        field: 'ANZAHL_WOHNEINHEITEN',
        type: 'number',
        difficulty: 'easy',
        required: true
      },
      {
        id: 'total_living_space',
        question: 'Wie groß ist die gesamte Wohnfläche Ihres Gebäudes in Quadratmetern?',
        field: 'WOHNFLÄCHE_GESAMT',
        type: 'number',
        difficulty: 'easy',
        required: true
      },
      {
        id: 'building_address',
        question: 'Wie lautet die vollständige Adresse Ihres Gebäudes?',
        field: 'GEBÄUDEADRESSE',
        type: 'text',
        difficulty: 'easy',
        required: true
      },
      {
        id: 'insulation_system',
        question: 'Welches Dämmsystem planen Sie für die Fassadensanierung?',
        field: 'DÄMMSYSTEM',
        type: 'text',
        difficulty: 'easy',
        required: true
      },
      {
        id: 'complex_energy_analysis',
        question: 'Führen Sie eine detaillierte energetische Bewertung durch: Berechnen Sie die U-Werte vor und nach der Sanierung, den erwarteten Primärenergiebedarf, die CO2-Einsparungen und erstellen Sie eine Wirtschaftlichkeitsberechnung mit Amortisationszeit für die geplante WDVS-Maßnahme.',
        field: 'ENERGETISCHE_ANALYSE_DETAIL',
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