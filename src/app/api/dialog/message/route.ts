import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { message, currentQuestion } = await request.json();
    
    if (message === '?') {
      const helpPrompt = `Gib eine konkrete Hilfe zu dieser Frage: "${currentQuestion?.text || 'aktuelle Frage'}"`;
      const helpResponse = await callLLM(helpPrompt, '', true);
      
      return NextResponse.json({
        success: true,
        response: helpResponse,
        type: 'help'
      });
    }
    
    const response = await callLLM(message, `Aktuelle Frage: ${currentQuestion?.text}`, true);
    
    return NextResponse.json({
      success: true,
      response: response,
      type: 'answer'
    });
  } catch (error) {
    console.error('Dialog message error:', error);
    return NextResponse.json(
      { error: 'Nachricht konnte nicht verarbeitet werden' },
      { status: 500 }
    );
  }
}