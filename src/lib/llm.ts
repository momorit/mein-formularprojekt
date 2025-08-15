// src/lib/llm.ts - Optimiert für organische Dialoge
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callLLM(prompt: string, context: string = "", dialogMode: boolean = false): Promise<string> {
  try {
    const systemMessage = dialogMode 
      ? `Du bist ein freundlicher und kompetenter Gebäude-Energieberater, der ein natürliches Gespräch führt.

VERHALTEN:
- Führe eine organische, natürliche Unterhaltung
- Stelle eine Frage nach der anderen
- Sei geduldig und hilfsbereit bei Rückfragen
- Nutze den Kontext intelligent zur Unterstützung
- Antworte warmherzig aber professionell
- Verwende Emojis sparsam aber gezielt
- Bestätige Antworten bevor du zur nächsten Frage übergehst

STIL:
- Natürlich und gesprächig (nicht roboterhaft)
- Ermutigend und unterstützend
- Fachlich kompetent aber verständlich
- Antworte immer auf Deutsch

AUFGABE:
Du hilfst dabei, Informationen für eine Gebäude-Energieberatung zu sammeln. Führe den Dialog natürlich und zielgerichtet.`
      : `Du bist ein Experte für Gebäudeformulare und hilfst beim Ausfüllen. 

VERHALTEN:
- Antworte hilfreich und präzise auf Deutsch
- Nutze den Kontext zur besseren Beratung
- Sei konkret und lösungsorientiert
- Verwende eine freundliche, professionelle Sprache

AUFGABE:
Beantworte Fragen zu Formularen oder gib Eingabehilfen basierend auf dem Kontext.`;

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
      temperature: 0.8, // Erhöht für natürlichere, weniger repetitive Antworten
      max_tokens: 2048,
      top_p: 0.9, // Für mehr Variabilität in Antworten
    });

    return completion.choices[0]?.message?.content || "Keine Antwort erhalten";
  } catch (error) {
    console.error('LLM Error:', error);
    throw new Error('LLM nicht verfügbar');
  }
}