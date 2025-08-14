import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    // Predefined fields for Variant A
    const fields = [
      {
        id: 'building_type',
        label: 'GEBÄUDEART',
        type: 'select',
        options: ['Einfamilienhaus', 'Mehrfamilienhaus', 'Reihenhaus', 'Doppelhaushälfte'],
        required: true,
        difficulty: 'easy',
        hint: 'Wählen Sie die Gebäudeart aus der Liste aus. Bei Unsicherheit können Sie den Chat-Assistenten fragen.',
        placeholder: 'Bitte wählen Sie die Gebäudeart'
      },
      {
        id: 'construction_year',
        label: 'BAUJAHR',
        type: 'number',
        required: true,
        difficulty: 'easy',
        hint: 'Geben Sie das Jahr ein, in dem das Gebäude ursprünglich errichtet wurde (z.B. 1965).',
        placeholder: 'z.B. 1965'
      },
      {
        id: 'facade_area',
        label: 'FASSADENFLÄCHE (m²)',
        type: 'number',
        required: true,
        difficulty: 'hard',
        hint: 'Berechnung: Länge × Höhe der Außenwände abzgl. Fenster/Türen. Für komplexe Berechnungen nutzen Sie den Chat-Assistenten.',
        placeholder: 'Gesamtfläche aller zu dämmenden Fassaden'
      },
      {
        id: 'insulation_spec',
        label: 'GEPLANTE DÄMMSPEZIFIKATION',
        type: 'textarea',
        required: true,
        difficulty: 'hard',
        hint: 'Beschreiben Sie detailliert: Dämmstoff, Dicke, Ausführung (z.B. "140mm Mineralwolle WDVS mit Riemchen-Verkleidung"). Bei Unklarheiten fragen Sie den Assistenten.',
        placeholder: 'z.B. 140mm Mineralwolle, WDVS-System, Eingangsfassade mit Spaltklinker...'
      }
    ]

    return NextResponse.json({
      fields,
      context_used: context,
      instructions: fields.map(field => field.hint)
    })
  } catch (error) {
    console.error('Error generating instructions:', error)
    return NextResponse.json(
      { error: 'Failed to generate instructions' },
      { status: 500 }
    )
  }
}