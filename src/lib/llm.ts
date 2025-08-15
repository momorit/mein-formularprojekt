// src/lib/llm.ts - KOMPLETT OPTIMIERT
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callLLM(prompt: string, context: string = "", dialogMode: boolean = false): Promise<string> {
  try {
    const systemMessage = dialogMode 
      ? `Du bist ein professioneller Gebäude-Energieberater und führst strukturierte Interviews durch.

VERHALTEN:
- Antworte präzise und strukturiert
- Verwende deutsche Sprache
- Sei freundlich aber fokussiert  
- Folge genau den Anweisungen im Prompt
- Nutze Emojis sparsam (max. 1-2 pro Antwort)
- Halte Antworten auf 3-4 Sätze begrenzt

WICHTIG: Befolge die spezifischen Anweisungen im User-Prompt exakt.`

      : `Du bist ein Experte für Gebäudeformulare und Energieberatung.

VERHALTEN:
- Antworte hilfreich und spezifisch auf Deutsch
- Nutze den gegebenen Kontext intelligent
- Sei konkret und lösungsorientiert
- Verwende eine freundliche, professionelle Sprache
- Halte Antworten fokussiert und nützlich

WICHTIG: Beantworte nur die konkrete Frage des Nutzers.`;

    console.log('🤖 LLM Call:', { 
      dialogMode, 
      promptLength: prompt.length, 
      contextLength: context.length 
    })

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user", 
          content: context ? `${context}\n\n${prompt}` : prompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: dialogMode ? 0.3 : 0.5, // Niedriger für strukturierte Dialoge
      max_tokens: 1024, // Kürzere Antworten
      top_p: 0.8, // Fokussiertere Antworten
      frequency_penalty: 0.1, // Weniger Wiederholungen
      presence_penalty: 0.1, // Mehr Variationen
    });

    const response = completion.choices[0]?.message?.content || "Keine Antwort erhalten";
    
    console.log('✅ LLM Response:', { 
      responseLength: response.length,
      model: "llama3-8b-8192"
    })
    
    return response;
    
  } catch (error) {
    console.error('❌ LLM Error:', error);
    
    // Detaillierte Fehlerbehandlung
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        throw new Error('GROQ API-Schlüssel ungültig oder fehlt');
      } else if (error.message.includes('rate limit')) {
        throw new Error('GROQ Rate-Limit erreicht - versuchen Sie es später erneut');
      } else if (error.message.includes('model')) {
        throw new Error('GROQ Modell nicht verfügbar');
      }
    }
    
    throw new Error('LLM-Service temporär nicht verfügbar');
  }
}