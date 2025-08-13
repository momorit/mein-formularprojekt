import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json();
    
    const prompt = `Starte ein strukturiertes Interview für Gebäude-Energieberatung. 
    Erstelle 5-8 wichtige Fragen. Gib JSON zurück:
    {
      "questions": [
        {"id": "q1", "text": "Welche Art von Gebäude möchten Sie bewerten lassen?"},
        {"id": "q2", "text": "In welchem Jahr wurde Ihr Gebäude erbaut?"}
      ]
    }`;

    const response = await callLLM(prompt, context, true);
    
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const questionData = JSON.parse(jsonMatch[0]);
      return NextResponse.json(questionData);
    }
    
    // Fallback questions
    return NextResponse.json({
      questions: [
        {"id": "q1", "text": "Welche Art von Gebäude möchten Sie bewerten lassen?"},
        {"id": "q2", "text": "In welchem Jahr wurde Ihr Gebäude erbaut?"},
        {"id": "q3", "text": "Wie groß ist die Wohnfläche Ihres Gebäudes?"},
        {"id": "q4", "text": "Welche Heizungsart verwenden Sie derzeit?"},
        {"id": "q5", "text": "Haben Sie bereits Maßnahmen zur Energieeinsparung durchgeführt?"}
      ]
    });
  } catch (error) {
    console.error('Dialog start error:', error);
    
    return NextResponse.json({
      questions: [
        {"id": "q1", "text": "Welche Art von Gebäude möchten Sie bewerten lassen?"},
        {"id": "q2", "text": "In welchem Jahr wurde Ihr Gebäude erbaut?"},
        {"id": "q3", "text": "Wie groß ist die Wohnfläche Ihres Gebäudes?"}
      ]
    });
  }
}