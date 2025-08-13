// src/lib/llm.ts
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callLLM(prompt: string, context: string = ""): Promise<string> {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für Formulare und hilfst beim Ausfüllen. Antworte auf Deutsch, präzise und hilfreich."
        },
        {
          role: "user", 
          content: `Kontext: ${context}\n\nAufgabe: ${prompt}`
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