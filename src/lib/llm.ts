// src/lib/llm.ts - LLM Service mit Groq
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callLLM(prompt: string, context: string = "", dialogMode: boolean = false): Promise<string> {
  try {
    const systemMessage = dialogMode 
      ? "Du bist ein professioneller Gebäude-Energieberater und führst ein strukturiertes Interview durch. Stelle eine Frage nach der anderen. Antworte kurz und präzise auf Deutsch."
      : "Du bist ein Experte für Gebäudeformulare und hilfst beim Ausfüllen. Antworte auf Deutsch, präzise und hilfreich.";

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user", 
          content: context ? `Kontext: ${context}\n\nAufgabe: ${prompt}` : prompt
        }
      ],
      model: "llama3-8b-8192",
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || "Keine Antwort erhalten";
  } catch (error) {
    console.error('LLM Error:', error);
    throw new Error('LLM nicht verfügbar');
  }
}