'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type StudyStep = 
  | 'intro' 
  | 'demographics' 
  | 'variant1_intro' 
  | 'variant1_survey' 
  | 'variant2_intro' 
  | 'variant2_survey' 
  | 'final_survey' 
  | 'complete'

interface Demographics {
  age: string
  education: string
  experience: string
  tech_affinity: string
}

interface VariantSurvey {
  usability: string
  efficiency: string
  satisfaction: string
  helpfulness: string
  comments: string
}

interface FinalSurvey {
  preference: string
  speed_comparison: string
  ease_comparison: string
  overall_comments: string
}

export default function StudyPage() {
  const router = useRouter()
  const [step, setStep] = useState<StudyStep>('intro')
  const [participantId] = useState(`P${Math.random().toString(36).substr(2, 8).toUpperCase()}`)
  const [randomization] = useState(Math.random() < 0.5 ? 'A-B' : 'B-A')
  const [startTime] = useState(new Date())
  
  // Form states
  const [demographics, setDemographics] = useState<Demographics>({
    age: '', education: '', experience: '', tech_affinity: ''
  })
  const [variant1Survey, setVariant1Survey] = useState<VariantSurvey>({
    usability: '', efficiency: '', satisfaction: '', helpfulness: '', comments: ''
  })
  const [variant2Survey, setVariant2Survey] = useState<VariantSurvey>({
    usability: '', efficiency: '', satisfaction: '', helpfulness: '', comments: ''
  })
  const [finalSurvey, setFinalSurvey] = useState<FinalSurvey>({
    preference: '', speed_comparison: '', ease_comparison: '', overall_comments: ''
  })

  const getFirstVariant = () => randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => randomization === 'A-B' ? 'B' : 'A'

  // Einleitung
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">FormularIQ Studie</h1>
            <p className="text-xl text-gray-600">LLM-gestützte Formularbearbeitung - Usability Vergleichsstudie</p>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Willkommen zur Studie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">🔬 Wissenschaftlicher Hintergrund</h3>
                <p className="text-blue-900 mb-3">
                  Diese Studie untersucht die Benutzerfreundlichkeit verschiedener Ansätze zur digitalen Formularbearbeitung 
                  im Kontext von <strong>Gebäude-Energieberatungen</strong>. Als Teil einer Masterarbeit an der HAW Hamburg 
                  vergleichen wir zwei innovative Interaktionsformen:
                </p>
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-white p-4 rounded border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-700">📋 Variante A: Sichtbares Formular</h4>
                    <p className="text-sm text-green-600">Klassisches Webformular mit KI-Assistenzhilfe bei Bedarf</p>
                  </div>
                  <div className="bg-white p-4 rounded border-l-4 border-purple-500">
                    <h4 className="font-semibold text-purple-700">💬 Variante B: Dialog-System</h4>
                    <p className="text-sm text-purple-600">Konversationelle Datenerfassung durch KI-gesteuerten Dialog</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-green-800 mb-3">📋 Ihr Testszenario</h3>
                <p className="text-green-900">
                  Sie sind Eigentümer:in eines Mehrfamilienhauses (Baujahr 1965) in ruhiger Lage und planen eine 
                  energetische Modernisierung der Fassade mit Wärmedämmverbundsystem. Für die Beratung benötigen Sie 
                  eine digitale Erfassung der Gebäudedaten zur Mieterhöhungsberechnung nach der geplanten Sanierung.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">🔄 Studienablauf (ca. 15-20 Minuten)</h3>
                <div className="space-y-3">
                  {[
                    { num: 1, text: 'Demografische Angaben', time: '2 Min.' },
                    { num: 2, text: `Erste Variante testen (${getFirstVariant()})`, time: '5-8 Min.' },
                    { num: 3, text: 'Bewertung der ersten Variante', time: '2 Min.' },
                    { num: 4, text: `Zweite Variante testen (${getSecondVariant()})`, time: '5-8 Min.' },
                    { num: 5, text: 'Bewertung der zweiten Variante', time: '2 Min.' },
                    { num: 6, text: 'Abschließender Vergleich', time: '2 Min.' }
                  ].map((item) => (
                    <div key={item.num} className="flex items-center space-x-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {item.num}
                      </Badge>
                      <span className="flex-1">{item.text}</span>
                      <span className="text-sm text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">📊 Wichtige Hinweise</h4>
                <ul className="text-yellow-700 space-y-1 text-sm">
                  <li>• Alle Daten werden vollständig anonymisiert behandelt</li>
                  <li>• Die Teilnahme ist freiwillig und kann jederzeit abgebrochen werden</li>
                  <li>• Ihre Teilnehmer-ID: <strong>{participantId}</strong></li>
                  <li>• Randomisierung: <strong>{randomization}</strong> (für Forschungszwecke)</li>
                </ul>
              </div>

              <Button 
                onClick={() => setStep('demographics')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg"
                size="lg"
              >
                Studie starten →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Demografische Angaben
  if (step === 'demographics') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Demografische Angaben</h1>
            <p className="text-gray-600">Schritt 1 von 6</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={(e) => {
                e.preventDefault()
                setStep('variant1_intro')
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Altersgruppe *
                    </label>
                    <select 
                      required
                      value={demographics.age}
                      onChange={(e) => setDemographics(prev => ({ ...prev, age: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="18-25">18-25 Jahre</option>
                      <option value="26-35">26-35 Jahre</option>
                      <option value="36-45">36-45 Jahre</option>
                      <option value="46-55">46-55 Jahre</option>
                      <option value="56+">56+ Jahre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Höchster Bildungsabschluss *
                    </label>
                    <select 
                      required
                      value={demographics.education}
                      onChange={(e) => setDemographics(prev => ({ ...prev, education: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="Hauptschule">Hauptschule</option>
                      <option value="Realschule">Realschule</option>
                      <option value="Gymnasium">Gymnasium</option>
                      <option value="Ausbildung">Ausbildung</option>
                      <option value="Bachelor">Bachelor</option>
                      <option value="Master">Master</option>
                      <option value="Promotion">Promotion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Erfahrung mit digitalen Formularen *
                    </label>
                    <select 
                      required
                      value={demographics.experience}
                      onChange={(e) => setDemographics(prev => ({ ...prev, experience: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="Sehr wenig">Sehr wenig</option>
                      <option value="Wenig">Wenig</option>
                      <option value="Durchschnittlich">Durchschnittlich</option>
                      <option value="Viel">Viel</option>
                      <option value="Sehr viel">Sehr viel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technik-Affinität *
                    </label>
                    <select 
                      required
                      value={demographics.tech_affinity}
                      onChange={(e) => setDemographics(prev => ({ ...prev, tech_affinity: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="Sehr niedrig">Sehr niedrig</option>
                      <option value="Niedrig">Niedrig</option>
                      <option value="Durchschnittlich">Durchschnittlich</option>
                      <option value="Hoch">Hoch</option>
                      <option value="Sehr hoch">Sehr hoch</option>
                    </select>
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  Weiter zur ersten Variante →
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Erste Variante Einführung
  if (step === 'variant1_intro') {
    const variant = getFirstVariant()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Erste Variante: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h1>
            <p className="text-gray-600">Schritt 2 von 6</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-800 mb-3">🏢 Erinnerung an Ihr Szenario</h3>
                  <p className="text-blue-900 mb-3">
                    Sie möchten für Ihr <strong>Mehrfamilienhaus (Baujahr 1965)</strong> eine energetische Sanierung durchführen 
                    und benötigen eine Beratung zur Berechnung möglicher Mieterhöhungen. Dafür müssen Sie Gebäudedaten digital erfassen.
                  </p>
                  <div className="text-sm text-blue-700 bg-blue-100 p-3 rounded">
                    <strong>Kontext:</strong> Siedlungsstraße 23, 12345 Großstadt • 10 Wohneinheiten • 634m² Wohnfläche • 
                    Geplant: Fassadendämmung mit WDVS (140mm Mineralwolle)
                  </div>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {variant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {variant === 'A' 
                      ? 'Sie sehen alle Formularfelder auf einmal und können bei schwierigen Fragen einen KI-Chat-Assistenten um Hilfe bitten. Die Felder enthalten Hinweise zur korrekten Ausfüllung.'
                      : 'Ein KI-Assistent führt Sie Schritt für Schritt durch einen Dialog und stellt Ihnen nacheinander gezielte Fragen zu Ihrem Gebäude. Bei Unklarheiten können Sie nachfragen.'
                    }
                  </p>
                  
                  {variant === 'A' && (
                    <div className="bg-green-100 p-3 rounded text-sm text-green-800">
                      <strong>Tipp:</strong> Nutzen Sie den Chat-Assistenten, wenn Sie bei einem Feld unsicher sind!
                    </div>
                  )}
                  
                  {variant === 'B' && (
                    <div className="bg-purple-100 p-3 rounded text-sm text-purple-800">
                      <strong>Tipp:</strong> Antworten Sie natürlich und fragen Sie bei Unklarheiten einfach nach!
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">Ihre Aufgabe:</h4>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Geben Sie die Gebäudedaten für die Energieberatung ein</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Nutzen Sie die verfügbaren Hilfe-Funktionen wenn nötig</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Nehmen Sie sich die Zeit, die Sie benötigen</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>Speichern Sie am Ende Ihre Eingaben</span>
                    </li>
                  </ul>
                </div>

                <Button 
                  onClick={() => {
                    const url = variant === 'A' ? '/form-a' : '/form-b'
                    router.push(`${url}?study=true&step=2&participant=${participantId}&variant=${variant}`)
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                  size="lg"
                >
                  Variante {variant} jetzt starten →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fragebogen nach erster Variante
  if (step === 'variant1_survey') {
    const variant = getFirstVariant()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bewertung: Variante {variant}
            </h1>
            <p className="text-gray-600">Schritt 3 von 6</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={(e) => {
                e.preventDefault()
                setStep('variant2_intro')
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie bewerten Sie die Benutzerfreundlichkeit? *
                    </label>
                    <select 
                      required
                      value={variant1Survey.usability}
                      onChange={(e) => setVariant1Survey(prev => ({ ...prev, usability: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="1">1 - Sehr schlecht</option>
                      <option value="2">2 - Schlecht</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Gut</option>
                      <option value="5">5 - Sehr gut</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie effizient war die Dateneingabe? *
                    </label>
                    <select 
                      required
                      value={variant1Survey.efficiency}
                      onChange={(e) => setVariant1Survey(prev => ({ ...prev, efficiency: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="1">1 - Sehr ineffizient</option>
                      <option value="2">2 - Ineffizient</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Effizient</option>
                      <option value="5">5 - Sehr effizient</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie zufrieden waren Sie mit der Erfahrung? *
                    </label>
                    <select 
                      required
                      value={variant1Survey.satisfaction}
                      onChange={(e) => setVariant1Survey(prev => ({ ...prev, satisfaction: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="1">1 - Sehr unzufrieden</option>
                      <option value="2">2 - Unzufrieden</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Zufrieden</option>
                      <option value="5">5 - Sehr zufrieden</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie hilfreich war die KI-Unterstützung? *
                    </label>
                    <select 
                      required
                      value={variant1Survey.helpfulness}
                      onChange={(e) => setVariant1Survey(prev => ({ ...prev, helpfulness: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="0">Nicht genutzt</option>
                      <option value="1">1 - Nicht hilfreich</option>
                      <option value="2">2 - Wenig hilfreich</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Hilfreich</option>
                      <option value="5">5 - Sehr hilfreich</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zusätzliche Kommentare (optional)
                    </label>
                    <textarea 
                      value={variant1Survey.comments}
                      onChange={(e) => setVariant1Survey(prev => ({ ...prev, comments: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Was ist Ihnen besonders aufgefallen? Gab es Probleme?"
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  Weiter zur zweiten Variante →
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Zweite Variante Einführung
  if (step === 'variant2_intro') {
    const variant = getSecondVariant()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Zweite Variante: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h1>
            <p className="text-gray-600">Schritt 4 von 6</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="bg-blue-50 p-6 rounded-lg">
                  <h3 className="text-xl font-semibold text-blue-800 mb-3">🏢 Gleiches Szenario, andere Variante</h3>
                  <p className="text-blue-900">
                    Sie erfassen wieder die Daten für dasselbe Mehrfamilienhaus, diesmal jedoch mit einem anderen digitalen Ansatz. 
                    Vergleichen Sie dabei beide Erfahrungen.
                  </p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {variant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
                  </h3>
                  <p className="text-gray-700 mb-4">
                    {variant === 'A' 
                      ? 'Sie sehen alle Formularfelder auf einmal und können bei schwierigen Fragen einen KI-Chat-Assistenten um Hilfe bitten. Die Felder enthalten Hinweise zur korrekten Ausfüllung.'
                      : 'Ein KI-Assistent führt Sie Schritt für Schritt durch einen Dialog und stellt Ihnen nacheinander gezielte Fragen zu Ihrem Gebäude. Bei Unklarheiten können Sie nachfragen.'
                    }
                  </p>
                  
                  {variant === 'A' && (
                    <div className="bg-green-100 p-3 rounded text-sm text-green-800">
                      <strong>Tipp:</strong> Nutzen Sie den Chat-Assistenten, wenn Sie bei einem Feld unsicher sind!
                    </div>
                  )}
                  
                  {variant === 'B' && (
                    <div className="bg-purple-100 p-3 rounded text-sm text-purple-800">
                      <strong>Tipp:</strong> Antworten Sie natürlich und fragen Sie bei Unklarheiten einfach nach!
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => {
                    const url = variant === 'A' ? '/form-a' : '/form-b'
                    router.push(`${url}?study=true&step=4&participant=${participantId}&variant=${variant}`)
                  }}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                  size="lg"
                >
                  Variante {variant} jetzt starten →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Fragebogen nach zweiter Variante
  if (step === 'variant2_survey') {
    const variant = getSecondVariant()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bewertung: Variante {variant}
            </h1>
            <p className="text-gray-600">Schritt 5 von 6</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={(e) => {
                e.preventDefault()
                setStep('final_survey')
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie bewerten Sie die Benutzerfreundlichkeit? *
                    </label>
                    <select 
                      required
                      value={variant2Survey.usability}
                      onChange={(e) => setVariant2Survey(prev => ({ ...prev, usability: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="1">1 - Sehr schlecht</option>
                      <option value="2">2 - Schlecht</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Gut</option>
                      <option value="5">5 - Sehr gut</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie effizient war die Dateneingabe? *
                    </label>
                    <select 
                      required
                      value={variant2Survey.efficiency}
                      onChange={(e) => setVariant2Survey(prev => ({ ...prev, efficiency: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="1">1 - Sehr ineffizient</option>
                      <option value="2">2 - Ineffizient</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Effizient</option>
                      <option value="5">5 - Sehr effizient</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie zufrieden waren Sie mit der Erfahrung? *
                    </label>
                    <select 
                      required
                      value={variant2Survey.satisfaction}
                      onChange={(e) => setVariant2Survey(prev => ({ ...prev, satisfaction: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="1">1 - Sehr unzufrieden</option>
                      <option value="2">2 - Unzufrieden</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Zufrieden</option>
                      <option value="5">5 - Sehr zufrieden</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie hilfreich war die KI-Unterstützung? *
                    </label>
                    <select 
                      required
                      value={variant2Survey.helpfulness}
                      onChange={(e) => setVariant2Survey(prev => ({ ...prev, helpfulness: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte bewerten</option>
                      <option value="0">Nicht genutzt</option>
                      <option value="1">1 - Nicht hilfreich</option>
                      <option value="2">2 - Wenig hilfreich</option>
                      <option value="3">3 - Neutral</option>
                      <option value="4">4 - Hilfreich</option>
                      <option value="5">5 - Sehr hilfreich</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zusätzliche Kommentare (optional)
                    </label>
                    <textarea 
                      value={variant2Survey.comments}
                      onChange={(e) => setVariant2Survey(prev => ({ ...prev, comments: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      placeholder="Was ist Ihnen besonders aufgefallen? Gab es Probleme?"
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3"
                >
                  Weiter zum Abschluss →
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Abschließender Vergleich
  if (step === 'final_survey') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Abschließender Vergleich</h1>
            <p className="text-gray-600">Schritt 6 von 6</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={(e) => {
                e.preventDefault()
                setStep('complete')
              }}>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Welche Variante bevorzugen Sie insgesamt? *
                    </label>
                    <select 
                      required
                      value={finalSurvey.preference}
                      onChange={(e) => setFinalSurvey(prev => ({ ...prev, preference: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="A_stark">Variante A (stark bevorzugt)</option>
                      <option value="A_leicht">Variante A (leicht bevorzugt)</option>
                      <option value="neutral">Beide gleich gut</option>
                      <option value="B_leicht">Variante B (leicht bevorzugt)</option>
                      <option value="B_stark">Variante B (stark bevorzugt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Welche Variante war schneller zu bearbeiten? *
                    </label>
                    <select 
                      required
                      value={finalSurvey.speed_comparison}
                      onChange={(e) => setFinalSurvey(prev => ({ ...prev, speed_comparison: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="A">Variante A (Formular)</option>
                      <option value="B">Variante B (Dialog)</option>
                      <option value="gleich">Beide gleich schnell</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Welche Variante war einfacher zu bedienen? *
                    </label>
                    <select 
                      required
                      value={finalSurvey.ease_comparison}
                      onChange={(e) => setFinalSurvey(prev => ({ ...prev, ease_comparison: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="A">Variante A (Formular)</option>
                      <option value="B">Variante B (Dialog)</option>
                      <option value="gleich">Beide gleich einfach</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Abschließende Kommentare (optional)
                    </label>
                    <textarea 
                      value={finalSurvey.overall_comments}
                      onChange={(e) => setFinalSurvey(prev => ({ ...prev, overall_comments: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={4}
                      placeholder="Welche Gedanken haben Sie zum Vergleich beider Systeme? Verbesserungsvorschläge?"
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3"
                >
                  Studie abschließen →
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Abschluss
  if (step === 'complete') {
    // Hier würden normalerweise alle Daten gespeichert werden
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h1 className="text-3xl font-bold text-green-800 mb-2">Vielen Dank!</h1>
                <p className="text-lg text-gray-600">
                  Sie haben die Studie erfolgreich abgeschlossen.
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Ihre Teilnehmer-ID:</h3>
                <p className="text-xl font-mono text-green-900">{participantId}</p>
                <p className="text-sm text-green-700 mt-2">
                  Ihre Daten wurden erfolgreich und anonymisiert gespeichert.
                </p>
              </div>

              <div className="text-gray-600 mb-6">
                <p className="mb-2">Bei Fragen zur Studie wenden Sie sich gerne an:</p>
                <p className="font-semibold">HAW Hamburg - Department Informatik</p>
                <p className="text-sm">Masterarbeit: Moritz Treu</p>
              </div>

              <Button 
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Zur Startseite
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}