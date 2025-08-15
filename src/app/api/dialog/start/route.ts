import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    // Predefined questions for Variant B
    const questions = [
      {
        id: 'building_side',
        question: 'Welche Gebäudeseite soll hauptsächlich saniert werden? Eingangsfassade zur Straße oder die ruhigere Hoffassade?',
        field: 'GEBÄUDESEITE_SANIERUNG',
        type: 'select',
        options: ['Eingangsfassade', 'Hoffassade', 'Beide Seiten', 'Seitenfassaden'],
        difficulty: 'easy',
        required: true
      },
      {
        id: 'insulation_material',
        question: 'Welches Dämmmaterial ist für Ihr Vorhaben vorgesehen? Der Energieberater hat Mineralwolle empfohlen.',
        field: 'DÄMMSTOFF_TYP',
        type: 'select',
        options: ['Mineralwolle', 'Polystyrol (EPS)', 'Polyurethan (PUR)', 'Naturdämmstoff', 'Noch unentschieden'],
        difficulty: 'medium',
        required: true
      },
      {
        id: 'renovation_status',
        question: 'Wurden bereits andere energetische Maßnahmen am Gebäude durchgeführt (Dach, Keller, Fenster)?',
        field: 'VORHERIGE_MODERNISIERUNG',
        type: 'select',
        options: ['Ja, Dach gedämmt', 'Ja, Fenster erneuert', 'Ja, mehrere Maßnahmen', 'Nein, erste Maßnahme', 'Teilweise'],
        difficulty: 'medium',
        required: true
      },
      {
        id: 'measure_type',
        question: 'Handelt es sich um eine freiwillige Modernisierung oder besteht eine gesetzliche Verpflichtung nach dem Gebäudeenergiegesetz (GEG)?',
        field: 'MASSNAHMEN_KATEGORIE',
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
