import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();
    
    const prompt = `Starte ein strukturiertes Interview für Gebäude-Energieberatung. 
    Erstelle 5-8 wichtige Fragen. Gib JSON zurück:
    {
      "questions": [
        {"id": "q1", "text": "Frage 1"},
        {"id": "q2", "text": "Frage 2"}
      ]
    }`;

    const response = await callLLM(prompt, context, true);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const questionData = JSON.parse(jsonMatch[0]);
      return NextResponse.json(questionData);
    }
    
    throw new Error('Keine gültigen Fragen generiert');
  } catch (error) {
    console.error('Dialog start error:', error);
    return NextResponse.json(
      { error: 'Dialog konnte nicht gestartet werden' },
      { status: 500 }
    );
  }
}