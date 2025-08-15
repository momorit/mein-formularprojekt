import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    // Predefined fields for Variant A
    const fields = [
      {
        id: 'apartment_designation',
        label: 'WOHNUNGSBEZEICHNUNG',
        type: 'select',
        options: ['EG Links', 'EG Rechts', 'OG Links', 'OG Rechts', 'DG Links', 'DG Rechts'],
        required: true,
        difficulty: 'easy',
        hint: 'Wählen Sie die Lage der betroffenen Wohnung im Gebäude. Das Hochparterre entspricht dem EG.',
        placeholder: 'Bitte wählen Sie die Wohnungslage'
      },
      {
        id: 'energy_source',
        label: 'ENERGIETRÄGER DER HEIZANLAGE',
        type: 'select',
        options: ['Heizöl', 'Erdgas', 'Fernwärme', 'Pellets', 'Wärmepumpe', 'Sonstiges'],
        required: true,
        difficulty: 'medium',
        hint: 'Geben Sie an, womit das Gebäude aktuell beheizt wird. Bei Baujahr 1965 ist oft eine Ölheizung vorhanden.',
        placeholder: 'Art der aktuellen Heizung'
      },
      {
        id: 'facade_orientation',
        label: 'HIMMELSRICHTUNG DER HAUPTFASSADE',
        type: 'select',
        options: ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'],
        required: true,
        difficulty: 'easy',
        hint: 'Bestimmen Sie die Himmelsrichtung der Eingangsfassade (Straßenseite). Dies beeinflusst die Dämmstoffwahl.',
        placeholder: 'Richtung der Eingangsfassade'
      },
      {
        id: 'u_value_current',
        label: 'AKTUELLER U-WERT DER FASSADE (W/m²·K)',
        type: 'number',
        required: true,
        difficulty: 'hard',
        hint: 'Der U-Wert gibt den Wärmeverlust durch die Fassade an. Bei ungedämmten Gebäuden von 1965 liegt er typisch bei 1,7 W/m²·K. Nach der Sanierung sollte er unter 0,24 W/m²·K liegen.',
        placeholder: 'z.B. 1.7'
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