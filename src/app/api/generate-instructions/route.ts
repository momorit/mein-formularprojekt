// src/app/api/generate-instructions/route.ts
// Zweck: LLM‑generierte, knappe Feldhinweise (JSON‑only) für Variante A + kurze Welcome‑Message.
//  - Eingabe: context (frei), feste Felddefinitionen (Demo)
//  - LLM: callLLM → reines JSON parsen (Codefences werden entfernt)
//  - Fallback: sinnvolle Default‑Hinweise pro Feld
//  - Ausgabe: fields[] inkl. hint + welcome_message
import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
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
    const prompt = `Erzeuge für jedes der folgenden Formularfelder einen prägnanten Hinweis (1–2 Sätze) auf Deutsch.
Vorgaben:
- Sprich den Nutzer direkt an (Du-Form), freundlich und fachlich korrekt.
- Beziehe dich auf das vorliegende Szenario (Energieberatung) und das konkrete Feld (Label/Typ) – bleibe feldnah.
- Für type == "number": nenne Einheit und ggf. typische Wertebereiche als Orientierung.
- Für type == "select": nenne kurz, wann welche Option sinnvoll ist (neutral, knapp).
- Keine Floskeln, keine Entschuldigungen, keine Disclaimer.
- Keine Markdown, keine Aufzählungen, keine Erklärtexte außerhalb des JSON.

Ausgabeformat (STRICT): Nur ein JSON-Objekt der Form { "<field.id>": "<Hinweis>", ... } für alle Felder.

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

    // Generate dynamic welcome (minimize fixed text)
    let welcomeMessage = ''
    try {
      const welcomePrompt = `Formuliere eine kurze Begrüßung (1–2 Sätze) und erkläre in 1 Satz, wie der Nutzer vorgeht (Hinweise pro Feld, KI-Chat bei Bedarf). Keine Emojis, keine Listen/Labels.

Ziel: natürlich, knapp, freundlich.`
      welcomeMessage = await callLLM(welcomePrompt, context || '', false, undefined, { provider: 'groq' })
    } catch (e) {
      welcomeMessage = 'Willkommen! Das Formular enthält zu jedem Feld kurze Hinweise. Bei Rückfragen hilft der KI-Chat.'
    }

    return NextResponse.json({
      fields,
      context_used: context,
      instructions: fields.map(field => field.hint),
      llm_used: !!generatedHints,
      welcome_message: welcomeMessage
    })
  } catch (error) {
    console.error('Error generating instructions:', error)
    return NextResponse.json(
      { error: 'Failed to generate instructions' },
      { status: 500 }
    )
  }
}
