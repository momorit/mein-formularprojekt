// src/lib/llm.ts - KOMPLETT OPTIMIERT
import Groq from 'groq-sdk';
import { generate as ollamaGenerate } from './rag/ollama';

let groqClient: Groq | null = null;
function getGroqClient(): Groq {
  if (!groqClient) {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('GROQ_API_KEY fehlt. Setze LLM_PROVIDER=ollama oder konfiguriere GROQ_API_KEY.');
    }
    groqClient = new Groq({ apiKey: key });
  }
  return groqClient;
}

export async function callLLM(
  prompt: string,
  context: string = "",
  dialogMode: boolean = false,
  systemOverride?: string,
  options?: { provider?: 'groq' | 'ollama'; model?: string }
): Promise<string> {
  try {
    const baseSystem = dialogMode 
      ? `Du bist ein professioneller, natürlicher Energieberater im Gespräch.

Gesprächsregeln (streng befolgen):
- Antworte auf Deutsch in 1–3 Sätzen.
- Bestätige die Nutzerangabe knapp in eigenen Worten (Paraphrase).
- Stelle genau EINE nächste, gezielte Frage – nur wenn nötig.
- Keine Listen, keine Labels, keine Meta-Kommentare.
- Bleibe bei der aktuellen Feldfrage; mache nur dann weiter, wenn bestätigt.
- Wenn der Nutzer eine fachliche Rückfrage stellt, beantworte sie kurz und leite dann zurück zur aktuellen Frage.
- Nutze bereitgestellten Kontext, erfinde nichts. Wenn unbekannt: sag knapp, dass es unklar ist.

Format (implizit, ohne Überschriften):
1) Kurze Bestätigung/Antwort → 2) Natürliche Überleitung zur (nächsten) Frage.`

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

    // Use Groq by default for chat generation; can be overridden per-call
    const provider = options?.provider || process.env.LLM_PROVIDER || 'groq'
    const primaryModel = process.env.GROQ_MODEL || 'llama3-8b-8192'
    const envFallbacks = (process.env.GROQ_MODEL_FALLBACKS || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const defaultFallbacks = ['llama-3.1-8b-instant']
    const tryModels = Array.from(new Set([primaryModel, ...envFallbacks, ...defaultFallbacks]))

    if (provider === 'ollama') {
      const fullPrompt = `${systemMessage}\n\nKONTEXT:\n${context}\n\nAUFGABE:\n${prompt}`
      const primary = options?.model || process.env.OLLAMA_MODEL || 'llama3:8b-instruct'
      const envFB = (process.env.OLLAMA_MODEL_FALLBACKS || '')
        .split(',').map(s => s.trim()).filter(Boolean)
      const defFB = ['qwen2.5:7b-instruct', 'mistral:7b-instruct', 'llama3.1:8b-instruct', 'llama3:8b', 'phi3:3.8b-mini-instruct']
      const models = Array.from(new Set([primary, ...envFB, ...defFB]))
      let lastError: any = null
      for (const model of models) {
        try {
          console.log('🤖 LLM Call (Ollama):', { dialogMode, model, promptLength: prompt.length, contextLength: context.length })
          const response = await ollamaGenerate(fullPrompt, { model, temperature: dialogMode ? 0.4 : 0.6 })
          console.log('✅ LLM Response (Ollama):', { responseLength: response.length, model })
          return response || 'Keine Antwort erhalten'
        } catch (err: any) {
          lastError = err
          const msg = (err && (err.message || String(err))) || ''
          console.warn('⚠️ Ollama model failed, trying next if available:', { model, error: msg })
          continue
        }
      }
      throw lastError || new Error('Ollama: alle Modellversuche fehlgeschlagen')
    } else {
      let lastError: any = null
      const groq = getGroqClient();
      for (const model of tryModels) {
        try {
          console.log('🤖 LLM Call (Groq):', { dialogMode, model, promptLength: prompt.length, contextLength: context.length })
          const completion = await groq.chat.completions.create({
            messages: [
              { role: 'system', content: systemMessage },
              { role: 'user', content: context ? `${context}\n\n${prompt}` : prompt }
            ],
            model,
            temperature: dialogMode ? 0.4 : 0.6,
            max_tokens: 1200,
            top_p: 0.85,
            frequency_penalty: dialogMode ? 0.5 : 0.2,
            presence_penalty: dialogMode ? 0.2 : 0.1,
          })
          const response = completion.choices[0]?.message?.content || 'Keine Antwort erhalten'
          console.log('✅ LLM Response (Groq):', { responseLength: response.length, model })
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
    }
    
  } catch (error) {
    console.error('❌ LLM Error:', error);
    
    // Detaillierte Fehlerbehandlung
    if (error instanceof Error) {
      const msg = error.message.toLowerCase()
      // Ollama-spezifisch
      if (msg.includes('ollama')) {
        if (msg.includes('not found') || msg.includes("model '")) {
          throw new Error('Ollama Modell nicht gefunden. Installiere ein Modell, z.B.:\n  ollama pull llama3:8b-instruct\nOder setze OLLAMA_MODEL auf ein installiertes Modell.')
        }
        if (msg.includes('fetch failed') || msg.includes('econnrefused')) {
          throw new Error('Ollama nicht erreichbar. Läuft der Dienst? Prüfe OLLAMA_HOST (Standard: http://localhost:11434).')
        }
        throw new Error('Ollama-Fehler: ' + error.message)
      }
      // Groq-spezifisch
      if (msg.includes('api key')) {
        throw new Error('GROQ API-Schlüssel ungültig oder fehlt');
      } else if (msg.includes('rate limit')) {
        throw new Error('GROQ Rate-Limit erreicht - versuchen Sie es später erneut');
      } else if (msg.includes('model')) {
        throw new Error('GROQ Modell nicht verfügbar');
      }
    }
    
    throw new Error('LLM-Service temporär nicht verfügbar');
  }
}
