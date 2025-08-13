import { NextRequest, NextResponse } from 'next/server';
import { callLLM } from '@/lib/llm';

export async function POST(request: NextRequest) {
  try {
    const { message, context } = await request.json();
    
    const response = await callLLM(message, context || '');
    
    return NextResponse.json({
      success: true,
      response: response
    });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({
      success: true,
      response: "Ich helfe Ihnen gerne! Können Sie Ihre Frage genauer stellen?"
    });
  }
}