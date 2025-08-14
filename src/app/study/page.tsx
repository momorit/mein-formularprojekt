'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Clock, Users, ArrowRight } from 'lucide-react'
import SUSQuestionnaire from '@/components/SUSQuestionnaire'
import { useTimingTracker } from '@/components/Questionnaire/TimingTracker'

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
  gender: string
  education: string
  tech_experience: string
  form_frequency: string
  device_preference: string
}

interface TrustQuestionnaire {
  system_reliability: number
  data_security: number
  error_handling: number
  transparency: number
  user_control: number
}

interface VariantData {
  variant: 'A' | 'B'
  susResults?: any
  trustResults?: TrustQuestionnaire
  completionTime: number
  startTime: Date
  endTime?: Date
  comments: string
}

interface PreferenceComparison {
  overall_preference: 'A' | 'B' | 'no_preference'
  speed_winner: 'A' | 'B' | 'equal'
  ease_winner: 'A' | 'B' | 'equal'
  trust_winner: 'A' | 'B' | 'equal'
  future_use: 'A' | 'B' | 'depends'
  recommendation_score: number
  final_comments: string
}

// Vertrauen-Fragebogen (5-Punkt-Likert)
const TRUST_QUESTIONS = [
  {
    key: 'system_reliability',
    question: 'Ich vertraue darauf, dass das System zuverlässig funktioniert',
    labels: ['Stimme gar nicht zu', 'Stimme voll zu'] as [string, string]
  },
  {
    key: 'data_security', 
    question: 'Ich fühle mich sicher, dass meine Daten geschützt sind',
    labels: ['Sehr unsicher', 'Sehr sicher'] as [string, string]
  },
  {
    key: 'error_handling',
    question: 'Das System geht angemessen mit Fehlern und Unklarheiten um',
    labels: ['Sehr schlecht', 'Sehr gut'] as [string, string]
  },
  {
    key: 'transparency',
    question: 'Es ist klar ersichtlich, was das System mit meinen Eingaben macht',
    labels: ['Gar nicht klar', 'Völlig klar'] as [string, string]
  },
  {
    key: 'user_control',
    question: 'Ich fühle mich im Kontrol über den Eingabeprozess',
    labels: ['Keine Kontrolle', 'Volle Kontrolle'] as [string, string]
  }
]

function StudyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { timingData, startVariant, endVariant, startQuestionnaire, endQuestionnaire, finishStudy } = useTimingTracker()
  
  // URL Parameter lesen
  const urlStep = searchParams.get('step')
  const urlParticipant = searchParams.get('participant')
  
  const [step, setStep] = useState<StudyStep>('intro')
  const [participantId] = useState(() => {
    if (urlParticipant) return urlParticipant
    return `P${Math.random().toString(36).substr(2, 8).toUpperCase()}`
  })
  const [randomization] = useState(Math.random() < 0.5 ? 'A-B' : 'B-A')
  const [startTime] = useState(new Date())
  
  // Form states
  const [demographics, setDemographics] = useState<Demographics>({
    age: '', gender: '', education: '', tech_experience: '', form_frequency: '', device_preference: ''
  })
  
  const [variantAData, setVariantAData] = useState<VariantData>({
    variant: 'A',
    completionTime: 0,
    startTime: new Date(),
    comments: ''
  })
  
  const [variantBData, setVariantBData] = useState<VariantData>({
    variant: 'B', 
    completionTime: 0,
    startTime: new Date(),
    comments: ''
  })
  
  const [preferenceComparison, setPreferenceComparison] = useState<PreferenceComparison>({
    overall_preference: 'no_preference',
    speed_winner: 'equal',
    ease_winner: 'equal', 
    trust_winner: 'equal',
    future_use: 'depends',
    recommendation_score: 0,
    final_comments: ''
  })

  // URL Parameter in Step umwandeln
  useEffect(() => {
    if (urlStep) {
      console.log('🔗 URL Step detected:', urlStep)
      setStep(urlStep as StudyStep)
    }
  }, [urlStep])

  const getFirstVariant = () => randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => randomization === 'A-B' ? 'B' : 'A'

  const updateStep = (newStep: StudyStep) => {
    setStep(newStep)
    const url = new URL(window.location.href)
    url.searchParams.set('step', newStep)
    window.history.pushState({}, '', url.toString())
  }

  const saveCompleteStudy = async () => {
    finishStudy()
    
    const completeData = {
      participantId,
      startTime: startTime.toISOString(),
      randomization,
      demographics,
      variantAData,
      variantBData,
      preferenceComparison,
      timingData: {
        ...timingData,
        studyEnd: new Date(),
        totalDuration: Date.now() - startTime.getTime()
      },
      completedAt: new Date().toISOString(),
      metadata: {
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language
      }
    }

    try {
      const response = await fetch('/api/study/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeData)
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log('✅ Study data saved:', result)
      } else {
        console.error('❌ Save failed:', response.status)
      }
    } catch (error) {
      console.error('❌ Save error:', error)
    }
  }

  // TrustScale Component
  const TrustScale = ({ trustResults, onChange }: { 
    trustResults: TrustQuestionnaire, 
    onChange: (results: TrustQuestionnaire) => void 
  }) => (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-orange-900 mb-2">
          🔒 Vertrauen & Sicherheit
        </h3>
        <p className="text-sm text-orange-700">
          Wie sehr vertrauen Sie dem System? Bewerten Sie auf einer Skala von 1-5.
        </p>
      </div>

      {TRUST_QUESTIONS.map((item, index) => (
        <div key={item.key} className="p-4 border border-gray-200 rounded-lg bg-white">
          <label className="block text-sm font-medium text-gray-900 mb-4">
            <span className="text-orange-600 font-semibold">{index + 1}. </span>
            {item.question} <span className="text-red-500">*</span>
          </label>
          
          <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
            <span className="max-w-[120px] text-left">{item.labels[0]}</span>
            <span className="max-w-[120px] text-right">{item.labels[1]}</span>
          </div>
          
          <div className="flex justify-center space-x-6">
            {[1, 2, 3, 4, 5].map((num) => (
              <label key={num} className="flex flex-col items-center cursor-pointer group">
                <input
                  type="radio"
                  name={`trust-${item.key}`}
                  value={num}
                  checked={trustResults[item.key] === num}
                  onChange={() => onChange({ ...trustResults, [item.key]: num })}
                  className="w-5 h-5 text-orange-600 border-gray-300 focus:ring-orange-500"
                  required
                />
                <span className="text-sm mt-2 text-gray-600 group-hover:text-orange-600 font-medium">{num}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  // Intro Screen
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              FormularIQ Usability Study
            </h1>
            <p className="text-lg text-gray-600">
              Vergleich von zwei Formular-Eingabemethoden
            </p>
            <Badge className="mt-2">Teilnehmer: {participantId}</Badge>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2" />
                Studienablauf (ca. 15-20 Minuten)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-semibold">Demografische Daten</h4>
                      <p className="text-sm text-gray-600">Kurze Angaben zu Ihrer Person (~2 Min)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-semibold">Variante A testen</h4>
                      <p className="text-sm text-gray-600">Formular ausfüllen + Bewertung (~5 Min)</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-semibold">Variante B testen</h4>
                      <p className="text-sm text-gray-600">Formular ausfüllen + Bewertung (~5 Min)</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-semibold">Vergleich</h4>
                      <p className="text-sm text-gray-600">Beide Varianten vergleichen (~3 Min)</p>
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Was wird gemessen?</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• System Usability Scale (SUS)</li>
                      <li>• Vertrauen & Sicherheit</li>
                      <li>• Nutzerpräferenzen</li>
                      <li>• Bearbeitungszeiten</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              onClick={() => {
                startQuestionnaire('demographics')
                updateStep('demographics')
              }}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Studie beginnen <ArrowRight className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Demographics
  if (step === 'demographics') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Demografische Daten</h1>
            <p className="text-gray-600">Schritt 1 von 4</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={(e) => {
                e.preventDefault()
                endQuestionnaire('demographics')
                updateStep('variant1_intro')
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="18-24">18-24 Jahre</option>
                      <option value="25-34">25-34 Jahre</option>
                      <option value="35-44">35-44 Jahre</option>
                      <option value="45-54">45-54 Jahre</option>
                      <option value="55-64">55-64 Jahre</option>
                      <option value="65+">65+ Jahre</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Geschlecht
                    </label>
                    <select 
                      value={demographics.gender}
                      onChange={(e) => setDemographics(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Keine Angabe</option>
                      <option value="weiblich">Weiblich</option>
                      <option value="männlich">Männlich</option>
                      <option value="divers">Divers</option>
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="hauptschule">Hauptschulabschluss</option>
                      <option value="realschule">Realschulabschluss</option>
                      <option value="abitur">Abitur/Fachabitur</option>
                      <option value="ausbildung">Ausbildung</option>
                      <option value="bachelor">Bachelor</option>
                      <option value="master">Master/Diplom</option>
                      <option value="promotion">Promotion</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technische Erfahrung *
                    </label>
                    <select 
                      required
                      value={demographics.tech_experience}
                      onChange={(e) => setDemographics(prev => ({ ...prev, tech_experience: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="niedrig">Niedrig - Ich nutze nur grundlegende Funktionen</option>
                      <option value="mittel">Mittel - Ich kenne mich gut mit Computern/Smartphones aus</option>
                      <option value="hoch">Hoch - Ich arbeite beruflich mit Technologie</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie oft füllen Sie Online-Formulare aus? *
                    </label>
                    <select 
                      required
                      value={demographics.form_frequency}
                      onChange={(e) => setDemographics(prev => ({ ...prev, form_frequency: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="täglich">Täglich</option>
                      <option value="wöchentlich">Mehrmals pro Woche</option>
                      <option value="monatlich">Mehrmals pro Monat</option>
                      <option value="selten">Selten (weniger als monatlich)</option>
                      <option value="nie">Nie</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bevorzugtes Gerät für Formulare
                    </label>
                    <select 
                      value={demographics.device_preference}
                      onChange={(e) => setDemographics(prev => ({ ...prev, device_preference: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Keine Präferenz</option>
                      <option value="desktop">Desktop/Laptop</option>
                      <option value="tablet">Tablet</option>
                      <option value="smartphone">Smartphone</option>
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

  // Variant 1 Survey - SUS + Trust + Comments
  if (step === 'variant1_survey') {
    const variant = getFirstVariant()
    const currentVariantData = variant === 'A' ? variantAData : variantBData
    const setCurrentVariantData = variant === 'A' ? setVariantAData : setVariantBData

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bewertung: Variante {variant}
            </h1>
            <p className="text-gray-600">Schritt 2 von 4</p>
            <Badge variant="outline" className="mt-2">
              {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </Badge>
          </div>

          <div className="space-y-8">
            {/* SUS Questionnaire */}
            <Card>
              <CardContent className="p-6">
                <SUSQuestionnaire
                  variant={variant}
                  onComplete={(susResults) => {
                    setCurrentVariantData(prev => ({ 
                      ...prev, 
                      susResults,
                      endTime: new Date(),
                      completionTime: Date.now() - prev.startTime.getTime()
                    }))
                  }}
                />
              </CardContent>
            </Card>

            {/* Trust Questionnaire */}
            <Card>
              <CardContent className="p-6">
                <TrustScale
                  trustResults={currentVariantData.trustResults || {
                    system_reliability: 0,
                    data_security: 0, 
                    error_handling: 0,
                    transparency: 0,
                    user_control: 0
                  }}
                  onChange={(trustResults) => {
                    setCurrentVariantData(prev => ({ ...prev, trustResults }))
                  }}
                />
              </CardContent>
            </Card>

            {/* Comments */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Zusätzliche Kommentare</h3>
                <textarea
                  value={currentVariantData.comments}
                  onChange={(e) => setCurrentVariantData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Was ist Ihnen besonders aufgefallen? Gab es Probleme oder positive Aspekte?"
                  className="w-full h-24 border border-gray-300 rounded-md px-3 py-2"
                />
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                onClick={() => {
                  endQuestionnaire('variantA')
                  updateStep('variant2_intro')
                }}
                disabled={!currentVariantData.susResults || !currentVariantData.trustResults}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Weiter zur zweiten Variante →
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant 2 Survey - Same as variant 1
  if (step === 'variant2_survey') {
    const variant = getSecondVariant()
    const currentVariantData = variant === 'A' ? variantAData : variantBData
    const setCurrentVariantData = variant === 'A' ? setVariantAData : setVariantBData

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bewertung: Variante {variant}
            </h1>
            <p className="text-gray-600">Schritt 3 von 4</p>
            <Badge variant="outline" className="mt-2">
              {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </Badge>
          </div>

          <div className="space-y-8">
            {/* SUS + Trust + Comments - Same structure as variant 1 */}
            <Card>
              <CardContent className="p-6">
                <SUSQuestionnaire
                  variant={variant}
                  onComplete={(susResults) => {
                    setCurrentVariantData(prev => ({ 
                      ...prev, 
                      susResults,
                      endTime: new Date(),
                      completionTime: Date.now() - prev.startTime.getTime()
                    }))
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <TrustScale
                  trustResults={currentVariantData.trustResults || {
                    system_reliability: 0,
                    data_security: 0,
                    error_handling: 0,
                    transparency: 0,
                    user_control: 0
                  }}
                  onChange={(trustResults) => {
                    setCurrentVariantData(prev => ({ ...prev, trustResults }))
                  }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Zusätzliche Kommentare</h3>
                <textarea
                  value={currentVariantData.comments}
                  onChange={(e) => setCurrentVariantData(prev => ({ ...prev, comments: e.target.value }))}
                  placeholder="Was ist Ihnen besonders aufgefallen? Gab es Probleme oder positive Aspekte?"
                  className="w-full h-24 border border-gray-300 rounded-md px-3 py-2"
                />
              </CardContent>
            </Card>

            <div className="text-center">
              <Button 
                onClick={() => {
                  endQuestionnaire('variantB')
                  startQuestionnaire('comparison')
                  updateStep('final_survey')
                }}
                disabled={!currentVariantData.susResults || !currentVariantData.trustResults}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
              >
                Zum abschließenden Vergleich →
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Final Comparison Survey
  if (step === 'final_survey') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Abschließender Vergleich</h1>
            <p className="text-gray-600">Schritt 4 von 4</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <form onSubmit={(e) => {
                e.preventDefault()
                endQuestionnaire('comparison')
                saveCompleteStudy()
                updateStep('complete')
              }}>
                <div className="space-y-8">
                  {/* Overall Preference */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Gesamtpräferenz</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'A', label: 'Variante A (Sichtbares Formular)' },
                        { value: 'B', label: 'Variante B (Dialog-System)' },
                        { value: 'no_preference', label: 'Keine klare Präferenz' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="overall_preference"
                            value={option.value}
                            checked={preferenceComparison.overall_preference === option.value}
                            onChange={(e) => setPreferenceComparison(prev => ({ 
                              ...prev, 
                              overall_preference: e.target.value as 'A' | 'B' | 'no_preference'
                            }))}
                            className="w-4 h-4 text-blue-600"
                            required
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Speed Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Welche Variante war schneller zu bedienen?</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'A', label: 'Variante A war schneller' },
                        { value: 'B', label: 'Variante B war schneller' },
                        { value: 'equal', label: 'Beide gleich schnell' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="speed_winner"
                            value={option.value}
                            checked={preferenceComparison.speed_winner === option.value}
                            onChange={(e) => setPreferenceComparison(prev => ({ 
                              ...prev, 
                              speed_winner: e.target.value as 'A' | 'B' | 'equal'
                            }))}
                            className="w-4 h-4 text-blue-600"
                            required
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Ease Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Welche Variante war einfacher zu bedienen?</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'A', label: 'Variante A war einfacher' },
                        { value: 'B', label: 'Variante B war einfacher' },
                        { value: 'equal', label: 'Beide gleich einfach' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="ease_winner"
                            value={option.value}
                            checked={preferenceComparison.ease_winner === option.value}
                            onChange={(e) => setPreferenceComparison(prev => ({ 
                              ...prev, 
                              ease_winner: e.target.value as 'A' | 'B' | 'equal'
                            }))}
                            className="w-4 h-4 text-blue-600"
                            required
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Trust Comparison */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Welcher Variante vertrauen Sie mehr?</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'A', label: 'Ich vertraue Variante A mehr' },
                        { value: 'B', label: 'Ich vertraue Variante B mehr' },
                        { value: 'equal', label: 'Gleiches Vertrauen in beide' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="trust_winner"
                            value={option.value}
                            checked={preferenceComparison.trust_winner === option.value}
                            onChange={(e) => setPreferenceComparison(prev => ({ 
                              ...prev, 
                              trust_winner: e.target.value as 'A' | 'B' | 'equal'
                            }))}
                            className="w-4 h-4 text-blue-600"
                            required
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Future Use */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Welche würden Sie in Zukunft nutzen?</h3>
                    <div className="space-y-3">
                      {[
                        { value: 'A', label: 'Definitiv Variante A' },
                        { value: 'B', label: 'Definitiv Variante B' },
                        { value: 'depends', label: 'Kommt auf die Situation an' }
                      ].map(option => (
                        <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="future_use"
                            value={option.value}
                            checked={preferenceComparison.future_use === option.value}
                            onChange={(e) => setPreferenceComparison(prev => ({ 
                              ...prev, 
                              future_use: e.target.value as 'A' | 'B' | 'depends'
                            }))}
                            className="w-4 h-4 text-blue-600"
                            required
                          />
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* NPS Score */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Wie wahrscheinlich würden Sie FormularIQ weiterempfehlen? (0-10)
                    </h3>
                    <div className="flex justify-center space-x-2">
                      {[0,1,2,3,4,5,6,7,8,9,10].map(num => (
                        <label key={num} className="flex flex-col items-center cursor-pointer">
                          <input
                            type="radio"
                            name="recommendation_score"
                            value={num}
                            checked={preferenceComparison.recommendation_score === num}
                            onChange={(e) => setPreferenceComparison(prev => ({ 
                              ...prev, 
                              recommendation_score: parseInt(e.target.value)
                            }))}
                            className="w-4 h-4 text-blue-600"
                            required
                          />
                          <span className="text-sm mt-1">{num}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                      <span>Sehr unwahrscheinlich</span>
                      <span>Sehr wahrscheinlich</span>
                    </div>
                  </div>

                  {/* Final Comments */}
                  <div>
                    <label className="block text-lg font-semibold mb-4">
                      Abschließende Kommentare
                    </label>
                    <textarea
                      value={preferenceComparison.final_comments}
                      onChange={(e) => setPreferenceComparison(prev => ({ 
                        ...prev, 
                        final_comments: e.target.value 
                      }))}
                      placeholder="Was würden Sie den Entwicklern mitteilen? Verbesserungsvorschläge, positive Aspekte, etc."
                      className="w-full h-32 border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>

                <Button 
                  type="submit"
                  className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-4 text-lg"
                >
                  <CheckCircle className="mr-2" />
                  Studie abschließen
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Complete Screen
  if (step === 'complete') {
    const totalMinutes = Math.round((Date.now() - startTime.getTime()) / 60000)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center">
            <div className="mb-6">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                Vielen Dank!
              </h1>
              <p className="text-lg text-gray-600">
                Sie haben die Studie erfolgreich abgeschlossen.
              </p>
            </div>

            <Card>
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Teilnehmer-ID:</span>
                    <Badge>{participantId}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Dauer:</span>
                    <span>{totalMinutes} Minuten</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Randomisierung:</span>
                    <span>{randomization}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Status:</span>
                    <Badge className="bg-green-100 text-green-800">Vollständig</Badge>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t text-sm text-gray-600">
                  <p>
                    Ihre Daten wurden sicher gespeichert und werden ausschließlich für wissenschaftliche 
                    Zwecke verwendet. Bei Fragen kontaktieren Sie gerne: 
                    <strong> moritz.treu@haw-hamburg.de</strong>
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-6">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Zur Startseite
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Variant introduction screens... (simplified for space)
  if (step === 'variant1_intro' || step === 'variant2_intro') {
    const variant = step === 'variant1_intro' ? getFirstVariant() : getSecondVariant()
    const nextStep = step === 'variant1_intro' ? 'variant1_survey' : 'variant2_survey'
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              {step === 'variant1_intro' ? 'Erste' : 'Zweite'} Variante: {variant}
            </h1>
          </div>

          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-6">
                <Badge className="mb-4">
                  {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
                </Badge>
                <p className="text-gray-600">
                  {variant === 'A' 
                    ? 'Sie sehen alle Formularfelder auf einmal und können diese direkt ausfüllen.'
                    : 'Das System führt Sie durch einen interaktiven Dialog und stellt Fragen.'
                  }
                </p>
              </div>

              <Button 
                onClick={() => {
                  startVariant(variant)
                  const url = variant === 'A' ? '/form-a' : '/form-b'
                  router.push(`${url}?study=true&step=${nextStep}&participant=${participantId}&variant=${variant}`)
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
              >
                Variante {variant} starten →
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return null
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StudyContent />
    </Suspense>
  )
}