// src/lib/llm.ts - KOMPLETT OPTIMIERT
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function callLLM(
  prompt: string,
  context: string = "",
  dialogMode: boolean = false,
  systemOverride?: string
): Promise<string> {
  try {
    const baseSystem = dialogMode 
      ? `Du bist ein professioneller Gebäude-Energieberater und führst strukturierte Interviews durch.

WICHTIGE REGELN:
- Bestätige IMMER die Antwort des Nutzers positiv
- Stelle danach die nächste Frage klar und deutlich
- Verwende deutsche Sprache
- Halte Antworten kurz und strukturiert (2-4 Sätze)
- Sei freundlich aber fokussiert
- Folge den Anweisungen im User-Prompt exakt

FORMAT:
1. Bestätigung der Antwort
2. Nächste Frage (falls vorhanden)
3. Optional: Kurzer Hinweis

Antworte VOLLSTÄNDIG und befolge die Anweisungen genau.`

      : `Du bist ein Experte für Gebäudeformulare und Energieberatung.

WICHTIGE REGELN:
- Antworte hilfreich und spezifisch auf Deutsch
- Nutze den gegebenen Kontext intelligent
- Sei konkret und lösungsorientiert
- Verwende eine freundliche, professionelle Sprache
- Halte Antworten fokussiert und nützlich (2-5 Sätze)

Beantworte die konkrete Frage des Nutzers basierend auf dem Kontext.`;

    const systemMessage = systemOverride
      ? `${baseSystem}\n\nZUSÄTZLICHE SYSTEMANWEISUNGEN:\n${systemOverride}`
      : baseSystem

    const primaryModel = process.env.GROQ_MODEL || 'llama3-8b-8192'
    const envFallbacks = (process.env.GROQ_MODEL_FALLBACKS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const defaultFallbacks = ['llama-3.1-8b-instant']
    const tryModels = Array.from(new Set([primaryModel, ...envFallbacks, ...defaultFallbacks]))

    let lastError: any = null
    for (const model of tryModels) {
      try {
        console.log('🤖 LLM Call:', { dialogMode, model, promptLength: prompt.length, contextLength: context.length })
        const completion = await groq.chat.completions.create({
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: context ? `${context}\n\n${prompt}` : prompt }
          ],
          model,
          temperature: dialogMode ? 0.4 : 0.6,
          max_tokens: 1200,
          top_p: 0.85,
          frequency_penalty: 0.2,
          presence_penalty: 0.1,
        })
        const response = completion.choices[0]?.message?.content || 'Keine Antwort erhalten'
        console.log('✅ LLM Response:', { responseLength: response.length, model })
        return response
      } catch (err: any) {
        lastError = err
        const msg = (err && (err.message || String(err))) || ''
        console.warn('⚠️ LLM model failed, trying next if available:', { model, error: msg })
        continue
      }
    }
    // If we got here, all models failed
    throw lastError || new Error('LLM-Service: alle Modellversuche fehlgeschlagen')
    
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
