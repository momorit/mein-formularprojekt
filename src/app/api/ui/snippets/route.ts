// src/app/api/ui/snippets/route.ts
// Zweck: Kleine, kontextsensitive UI‑Texte (Intro/How‑to/Tipp) per LLM generieren.
//  - Variante A/B: unterschiedliche Prompts
//  - Fallbacks: sinnvolle Default‑Texte bei LLM‑Ausfall
export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function POST(request: NextRequest) {
  try {
    const { variant, context } = await request.json()
    const ctx = typeof context === 'string' ? context : ''
    const v = (variant || 'A').toUpperCase()

    const baseRules = `Sprich freundlich, professionell und knapp (1–3 Sätze). Keine Emojis, keine Listen/Labels, keine Markdown. Deutsch.`

    let startIntroPrompt = ''
    let howtoPrompt = ''
    let sidepanelPrompt = ''
    let scenarioShortPrompt = ''
    let tipPrompt = ''

    if (v === 'A') {
      startIntroPrompt = `Formuliere eine sehr kurze Einleitung für ein sichtbares Formular mit KI-Chat-Hilfe. ${baseRules}`
      howtoPrompt = `Erkläre in 1–2 Sätzen, wie der Nutzer vorgeht: Felder ausfüllen, Hinweise beachten, bei Bedarf KI-Chat nutzen. ${baseRules}`
      scenarioShortPrompt = `Gib eine sehr kurze, neutrale Szenario-Zusammenfassung in einem Satz. ${baseRules}`
      tipPrompt = `Formuliere einen kurzen Tipp (1 Satz), worüber man die KI fragen kann. ${baseRules}`
    } else {
      // Variant B
      startIntroPrompt = `Formuliere eine sehr kurze Einleitung für einen geführten Dialog mit Rückfragen. ${baseRules}`
      sidepanelPrompt = `Erkläre in 1–2 Sätzen, wie Nachfragen gestellt werden und wie man zur nächsten Frage fortschreitet. ${baseRules}`
      scenarioShortPrompt = `Gib eine sehr kurze, neutrale Szenario-Zusammenfassung in einem Satz. ${baseRules}`
      tipPrompt = `Formuliere einen kurzen Tipp (1 Satz), welche Nachfrage sinnvoll sein könnte. ${baseRules}`
    }

    async function gen(prompt: string, fallback: string) {
      if (!prompt) return ''
      try {
        return await callLLM(prompt, ctx, false, undefined, { provider: 'groq' })
      } catch (e) {
        return fallback
      }
    }

    const start_intro = await gen(startIntroPrompt, v === 'A' ? 'Sichtbares Formular mit kompakten Hinweisen und KI-Chat bei Bedarf.' : 'Geführter Dialog mit kurzen Rückfragen und klaren Schritten.')
    const howto = v === 'A' ? await gen(howtoPrompt, 'Füllen Sie die Felder aus, nutzen Sie die Hinweise und fragen Sie bei Unsicherheiten im KI‑Chat nach.') : ''
    const sidepanel = v === 'B' ? await gen(sidepanelPrompt, 'Stellen Sie bei Unklarheiten eine kurze Frage und gehen Sie weiter, sobald Ihre Antwort feststeht.') : ''
    const scenario_short = await gen(scenarioShortPrompt, 'Kurzfassung des Szenarios verfügbar.')
    const tip_text = await gen(tipPrompt, 'Fragen Sie nach konkreten Beispielen oder Begriffserklärungen.')

    return NextResponse.json({
      ok: true,
      variant: v,
      start_intro,
      howto,
      sidepanel,
      scenario_short,
      tip_text
    })
  } catch (error) {
    console.error('❌ UI snippets error:', error)
    return NextResponse.json({ ok: false, error: 'Failed to generate UI snippets' }, { status: 500 })
  }
}
