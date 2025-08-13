import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();
    
    const prompt = `Erstelle ein Gebäude-Energieberatung Formular basierend auf diesem Kontext. 
    Gib JSON zurück mit diesem Format:
    {
      "fields": [
        {
          "id": "unique_id",
          "label": "Feldname", 
          "type": "text|number|email|tel|textarea|select",
          "required": true/false,
          "placeholder": "Hilfstext",
          "options": ["Option1", "Option2"] // nur bei select
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
    
    throw new Error('Keine gültige JSON-Antwort');
  } catch (error) {
    console.error('Generate instructions error:', error);
    return NextResponse.json(
      { error: 'Formular-Generierung fehlgeschlagen' },
      { status: 500 }
    );
  }
}