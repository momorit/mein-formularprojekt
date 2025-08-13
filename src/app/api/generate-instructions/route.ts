import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();
    
    const prompt = `Erstelle ein Gebäude-Energieberatung Formular basierend auf diesem Kontext. 
    Erstelle 5-8 relevante Felder für Gebäudedaten.
    Gib JSON zurück mit diesem Format:
    {
      "fields": [
        {
          "id": "gebaeudeart",
          "label": "Art des Gebäudes", 
          "type": "select",
          "required": true,
          "placeholder": "Bitte wählen",
          "options": ["Einfamilienhaus", "Mehrfamilienhaus", "Gewerbe"]
        },
        {
          "id": "baujahr",
          "label": "Baujahr",
          "type": "number",
          "required": true,
          "placeholder": "z.B. 1995"
        }
      ]
    }`;

    const response = await callLLM(prompt, context);
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const formData = JSON.parse(jsonMatch[0]);
      return NextResponse.json(formData);
    }
    
    // Fallback if no JSON
    return NextResponse.json({
      fields: [
        {
          id: "gebaeudeart",
          label: "Art des Gebäudes",
          type: "select",
          required: true,
          options: ["Einfamilienhaus", "Mehrfamilienhaus", "Gewerbe"]
        },
        {
          id: "baujahr", 
          label: "Baujahr",
          type: "number",
          required: true,
          placeholder: "z.B. 1995"
        },
        {
          id: "wohnflaeche",
          label: "Wohnfläche (m²)",
          type: "number", 
          required: true,
          placeholder: "z.B. 150"
        },
        {
          id: "heizung",
          label: "Heizungsart",
          type: "select",
          required: true,
          options: ["Gas", "Öl", "Wärmepumpe", "Fernwärme", "Sonstiges"]
        }
      ]
    });
  } catch (error) {
    console.error('Generate instructions error:', error);
    
    // Always return fallback form
    return NextResponse.json({
      fields: [
        {
          id: "gebaeudeart",
          label: "Art des Gebäudes",
          type: "select", 
          required: true,
          options: ["Einfamilienhaus", "Mehrfamilienhaus", "Gewerbe"]
        },
        {
          id: "baujahr",
          label: "Baujahr", 
          type: "number",
          required: true,
          placeholder: "z.B. 1995"
        }
      ]
    });
  }
}