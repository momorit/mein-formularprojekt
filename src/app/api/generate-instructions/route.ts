import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()
    
    // Base field definitions for Variante A (structure only; hints will be generated)
    const baseFields = [
      {
        id: 'apartment_designation',
        label: 'WOHNUNGSBEZEICHNUNG',
        type: 'select',
        options: ['EG Links', 'EG Rechts', 'OG Links', 'OG Rechts', 'DG Links', 'DG Rechts'],
        required: true,
        difficulty: 'easy',
        placeholder: 'Bitte wählen Sie die Wohnungslage'
      },
      {
        id: 'energy_source',
        label: 'ENERGIETRÄGER DER HEIZANLAGE',
        type: 'select',
        options: ['Heizöl', 'Erdgas', 'Fernwärme', 'Pellets', 'Wärmepumpe', 'Sonstiges'],
        required: true,
        difficulty: 'medium',
        placeholder: 'Art der aktuellen Heizung'
      },
      {
        id: 'facade_orientation',
        label: 'HIMMELSRICHTUNG DER HAUPTFASSADE',
        type: 'select',
        options: ['Norden', 'Nordosten', 'Osten', 'Südosten', 'Süden', 'Südwesten', 'Westen', 'Nordwesten'],
        required: true,
        difficulty: 'easy',
        placeholder: 'Richtung der Eingangsfassade'
      },
      {
        id: 'u_value_current',
        label: 'AKTUELLER U-WERT DER FASSADE (W/m²·K)',
        type: 'number',
        required: true,
        difficulty: 'hard',
        placeholder: 'z.B. 1.7'
      }
    ]

    // Build a compact description of fields (without hints) for the LLM
    const fieldsForLLM = baseFields.map(f => ({
      id: f.id,
      label: f.label,
      type: f.type,
      options: f.options,
      required: f.required,
      difficulty: f.difficulty,
      placeholder: f.placeholder,
    }))

    // Prompt to generate concise, field-specific hints in German as pure JSON
    const prompt = `Erzeuge für jedes der folgenden Formularfelder einen prägnanten, deutschsprachigen Hinweis (1–2 Sätze).
Vorgaben:
- Berücksichtige den Kontext der Aufgabe (Gebäude-Energieberatung) und den mitgelieferten Szenario-Kontext.
- Verwende klare, kurze Sätze und nenne Maßeinheiten, falls sinnvoll.
- Für type == "number": gib einen plausiblen Bereich/Bezug an (z.B. typische Werte, Einheiten, Orientierung).
- Für type == "select": erläutere, wann welche Option passt (kurz und neutral).
- Keine Markdown, keine Aufzählungen – nur ein JSON-Objekt zurückgeben.

Gib ausschliesslich ein JSON-Objekt zurück: { "<field.id>": "<Hinweis>", ... } für alle Felder.

Felder (JSON):\n${JSON.stringify(fieldsForLLM)}`

    let generatedHints: Record<string, string> | null = null
    try {
      const llmRaw = await callLLM(prompt, context || '')
      // Try to extract a JSON object even if wrapped in code fences
      const jsonString = llmRaw
        .replace(/^```(?:json)?/i, '')
        .replace(/```$/i, '')
        .trim()

      const parsed = JSON.parse(jsonString)
      if (parsed && typeof parsed === 'object') {
        generatedHints = parsed
      }
    } catch (e) {
      console.warn('⚠️ LLM hint generation failed, falling back to defaults:', e)
    }

    // Fallback default hints (used if LLM fails or misses some keys)
    const fallbackHints: Record<string, string> = {
      apartment_designation: 'Wählen Sie die Lage der betroffenen Wohnung im Gebäude (z.B. EG rechts).',
      energy_source: 'Geben Sie an, womit das Gebäude aktuell beheizt wird (z.B. Heizöl bei Baujahr 1965).',
      facade_orientation: 'Wählen Sie die Himmelsrichtung der Eingangsfassade (Straßenseite).',
      u_value_current: 'U-Wert in W/m²·K, typischerweise ca. 1,7 bei ungedämmten Fassaden (1960er Jahre).',
    }

    // Merge hints into fields
    const fields = baseFields.map(f => ({
      ...f,
      hint: (generatedHints && typeof generatedHints[f.id] === 'string' && generatedHints[f.id].trim())
        ? generatedHints[f.id].trim()
        : fallbackHints[f.id as keyof typeof fallbackHints]
    }))

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
