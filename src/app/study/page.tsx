'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnhancedQuestionnaire } from '@/components/Questionnaire'
import type { QuestionnaireData } from '@/components/Questionnaire'
import { LoadingSpinner } from '@/components/LoadingStates'

type StudyStep = 
  | 'intro' 
  | 'demographics' 
  | 'variant1_intro' 
  | 'variant1_survey' 
  | 'variant2_intro' 
  | 'variant2_survey' 
  | 'final_comparison' 
  | 'complete'

interface Demographics {
  age: string
  education: string
  experience: string
  tech_affinity: string
}

function StudyContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // URL Parameter lesen
  const urlStep = searchParams.get('step')
  const urlParticipant = searchParams.get('participant')
  
  const [step, setStep] = useState<StudyStep>('intro')
  const [participantId] = useState(() => {
    if (urlParticipant) return urlParticipant
    return `P${Math.random().toString(36).substr(2, 8).toUpperCase()}`
  })
  
  // FIX: Deterministic randomization based on participantId (no storage needed)
  const [randomization] = useState(() => {
    // Use participantId to create deterministic randomization
    const hash = participantId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    return Math.abs(hash) % 2 === 0 ? 'A-B' : 'B-A'
  })
  const [startTime] = useState(new Date())
  
  // Form states
  const [demographics, setDemographics] = useState<Demographics>({
    age: '', education: '', experience: '', tech_affinity: ''
  })

  // Store questionnaire data
  const [variant1QuestionnaireData, setVariant1QuestionnaireData] = useState<QuestionnaireData | null>(null)
  const [variant2QuestionnaireData, setVariant2QuestionnaireData] = useState<QuestionnaireData | null>(null)
  const [comparisonQuestionnaireData, setComparisonQuestionnaireData] = useState<QuestionnaireData | null>(null)

  // ALL HOOKS MUST BE AT THE TOP - BEFORE ANY CONDITIONALS OR RETURNS
  
  // URL Parameter in Step umwandeln
  useEffect(() => {
    if (urlStep) {
      console.log('🔗 URL Step detected:', urlStep)
      setStep(urlStep as StudyStep)
    }
  }, [urlStep])

  // Handle final save effect - MOVED TO TOP
  useEffect(() => {
    const handleFinalSave = async () => {
      if (step !== 'complete') return

      try {
        // Combine all study data
        const finalStudyData = {
          participant_id: participantId,
          randomization: randomization,
          start_time: startTime.toISOString(),
          end_time: new Date().toISOString(),
          demographics: demographics,
          variant1_questionnaire: variant1QuestionnaireData,
          variant2_questionnaire: variant2QuestionnaireData,
          comparison_questionnaire: comparisonQuestionnaireData,
          study_metadata: {
            project: 'FormularIQ - LLM-gestützte Formularbearbeitung',
            institution: 'HAW Hamburg',
            researcher: 'Moritz Treu',
            version: '2.0.0'
          }
        }

        console.log('📊 Final study data:', finalStudyData)

        // Save comprehensive study data
        const response = await fetch('/api/study/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(finalStudyData)
        })

        if (response.ok) {
          console.log('✅ Study completed successfully')
        } else {
          console.warn('⚠️ Failed to save final study data')
        }

      } catch (error) {
        console.error('❌ Error saving final study data:', error)
      }
    }

    handleFinalSave()
  }, [step, participantId, randomization, startTime, demographics, variant1QuestionnaireData, variant2QuestionnaireData, comparisonQuestionnaireData])

  // Debug randomization consistency
  useEffect(() => {
    console.log('🎲 DEBUG Randomization:', {
      participantId,
      randomization,
      firstVariant: getFirstVariant(),
      secondVariant: getSecondVariant()
    })
  }, [participantId, randomization])

  // Helper functions
  const getFirstVariant = () => randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => randomization === 'A-B' ? 'B' : 'A'

  // Helper function to update URL without causing re-render loop
  const updateStep = (newStep: StudyStep) => {
    setStep(newStep)
    const url = new URL(window.location.href)
    url.searchParams.set('step', newStep)
    url.searchParams.set('participant', participantId)
    window.history.replaceState({}, '', url.toString())
  }

  // Handle questionnaire completion
  const handleQuestionnaireComplete = async (data: QuestionnaireData, nextStep: StudyStep) => {
    try {
      console.log(`📋 Questionnaire completed for ${data.variant}:`, data)

      // Store the data locally for now
      if (data.variant === 'A' || data.variant === 'B') {
        if (step === 'variant1_survey') {
          setVariant1QuestionnaireData(data)
        } else if (step === 'variant2_survey') {
          setVariant2QuestionnaireData(data)
        }
      } else if (data.variant === 'comparison') {
        setComparisonQuestionnaireData(data)
      }

      // Save to API
      const response = await fetch('/api/questionnaire/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Failed to save questionnaire data')
      }

      const result = await response.json()
      console.log('✅ Questionnaire saved:', result)

      // Move to next step
      updateStep(nextStep)

    } catch (error) {
      console.error('❌ Failed to save questionnaire:', error)
      alert('Fehler beim Speichern der Fragebogen-Daten. Möchten Sie trotzdem fortfahren?')
      updateStep(nextStep)
    }
  }

  // NOW ALL THE CONDITIONAL RENDERS START HERE - AFTER ALL HOOKS

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
                  im Kontext von <strong>Gebäude-Energieberatungen</strong>. Als Teil eines Forschungsprojektes an der HAW Hamburg 
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
                  Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23. 
                  Es hat eine Rotklinkerfassade und 10 Wohneinheiten. Sie planen eine <strong>WDVS-Sanierung</strong> 
                  und müssen für einen Mieter (EG rechts, 57,5m²) die Mieterhöhung berechnen.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">🔄 Studienablauf (ca. 20-25 Minuten)</h3>
                <div className="space-y-3">
                  {[
                    { num: 1, text: 'Demografische Angaben', time: '2 Min.' },
                    { num: 2, text: `Erste Variante testen (${getFirstVariant()})`, time: '5-8 Min.' },
                    { num: 3, text: 'Fragebogen zur ersten Variante (Vertrauen & Usability)', time: '3-4 Min.' },
                    { num: 4, text: `Zweite Variante testen (${getSecondVariant()})`, time: '5-8 Min.' },
                    { num: 5, text: 'Fragebogen zur zweiten Variante (Vertrauen & Usability)', time: '3-4 Min.' },
                    { num: 6, text: 'Abschließender Vergleich & Präferenzen', time: '3-4 Min.' }
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
                onClick={() => updateStep('demographics')}
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      Bildungsabschluss *
                    </label>
                    <select 
                      required
                      value={demographics.education}
                      onChange={(e) => setDemographics(prev => ({ ...prev, education: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="hauptschule">Hauptschulabschluss</option>
                      <option value="realschule">Realschulabschluss/Mittlere Reife</option>
                      <option value="abitur">Abitur/Fachabitur</option>
                      <option value="ausbildung">Berufsausbildung</option>
                      <option value="bachelor">Bachelor-Abschluss</option>
                      <option value="master">Master-/Diplom-Abschluss</option>
                      <option value="promotion">Promotion</option>
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
                      <option value="keine">Keine Erfahrung</option>
                      <option value="wenig">Wenig Erfahrung (selten genutzt)</option>
                      <option value="etwas">Etwas Erfahrung (gelegentlich genutzt)</option>
                      <option value="viel">Viel Erfahrung (regelmäßig genutzt)</option>
                      <option value="experte">Experte (täglich genutzt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wie schätzen Sie Ihre Technikaffinität ein? *
                    </label>
                    <select 
                      required
                      value={demographics.tech_affinity}
                      onChange={(e) => setDemographics(prev => ({ ...prev, tech_affinity: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Bitte wählen</option>
                      <option value="niedrig">Niedrig (verwende nur grundlegende Funktionen)</option>
                      <option value="mittel">Mittel (bin aufgeschlossen für neue Technologien)</option>
                      <option value="hoch">Hoch (probiere gerne neue technische Lösungen aus)</option>
                      <option value="experte">Experte (bin sehr technikversiert)</option>
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

  // Intro für erste Variante
  if (step === 'variant1_intro') {
    const variant = getFirstVariant()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Erste Variante: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h1>
            <p className="text-gray-600">Schritt 2 von 6</p>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className={`p-4 rounded-lg ${variant === 'A' ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${variant === 'A' ? 'text-green-800' : 'text-purple-800'}`}>
                    {variant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
                  </h3>
                  <p className={`${variant === 'A' ? 'text-green-700' : 'text-purple-700'}`}>
                    {variant === 'A' 
                      ? 'Sie sehen ein klassisches Webformular mit allen Feldern gleichzeitig. Ein KI-Chat-Assistent steht für Hilfestellungen zur Verfügung.'
                      : 'Das System führt Sie in einem Dialog durch die Datenerfassung. Sie beantworten Fragen Schritt für Schritt in einer natürlichen Unterhaltung.'
                    }
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">🏢 Ihr Gebäudeszenario</h4>
                  <p className="text-blue-700 text-sm">
                    Mehrfamilienhaus, Baujahr 1965, Siedlungsstraße 23, 10 Wohneinheiten, 634m² Wohnfläche.
                    Geplante Sanierung: Wärmedämmverbundsystem (WDVS) aus Mineralwolle.
                  </p>
                </div>

                <div className={`p-3 rounded text-sm ${variant === 'A' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}`}>
                  <strong>Wichtig:</strong> {variant === 'A' 
                    ? 'Nutzen Sie bei Unsicherheiten den Chat-Assistenten!' 
                    : 'Antworten Sie natürlich und fragen Sie bei Unklarheiten einfach nach!'
                  }
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

  // ERWEITERTER FRAGEBOGEN für erste Variante
  if (step === 'variant1_survey') {
    const variant = getFirstVariant()
    
    console.log('🐛 DEBUG variant1_survey:', {
      step,
      randomization, 
      firstVariant: getFirstVariant(),
      variantToPass: variant
    })
    
    return (
      <EnhancedQuestionnaire
        key={`variant1-${variant}-questionnaire`} // Unique key per variant
        variant={variant}
        participantId={participantId}
        onComplete={(data) => handleQuestionnaireComplete(data, 'variant2_intro')}
        onBack={() => updateStep('variant1_intro')}
      />
    )
  }

  // Intro für zweite Variante
  if (step === 'variant2_intro') {
    const variant = getSecondVariant()
    
    // DEBUG LOGGING
    console.log('🐛 DEBUG variant2_intro:', {
      step,
      randomization,
      firstVariant: getFirstVariant(),
      secondVariant: getSecondVariant(),
      variant,
      participantId
    })
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Zweite Variante: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h1>
            <p className="text-gray-600">Schritt 4 von 6</p>
            
            {/* DEBUG INFO */}
            <div className="bg-yellow-50 p-3 rounded-lg mt-4 text-xs">
              <p><strong>Debug:</strong> Randomization: {randomization} | First: {getFirstVariant()} | Second: {getSecondVariant()}</p>
            </div>
          </div>

          <Card>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">🔄 Wechsel der Variante</h3>
                  <p className="text-blue-700">
                    Sie haben gerade Variante {getFirstVariant()} getestet. Jetzt probieren Sie die andere Herangehensweise aus.
                  </p>
                </div>

                <div className={`p-4 rounded-lg ${variant === 'A' ? 'bg-green-50 border border-green-200' : 'bg-purple-50 border border-purple-200'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${variant === 'A' ? 'text-green-800' : 'text-purple-800'}`}>
                    {variant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
                  </h3>
                  <p className={`${variant === 'A' ? 'text-green-700' : 'text-purple-700'}`}>
                    {variant === 'A' 
                      ? 'Diesmal sehen Sie ein klassisches Webformular mit allen Feldern gleichzeitig. Ein KI-Chat-Assistent steht für Hilfestellungen zur Verfügung.'
                      : 'Diesmal führt Sie das System in einem Dialog durch die Datenerfassung. Sie beantworten Fragen Schritt für Schritt in einer natürlichen Unterhaltung.'
                    }
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">📋 Gleiches Szenario</h4>
                  <p className="text-gray-700 text-sm">
                    Das Gebäudeszenario bleibt gleich: Mehrfamilienhaus, Baujahr 1965, geplante WDVS-Sanierung.
                  </p>
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

  // ERWEITERTER FRAGEBOGEN für zweite Variante
  if (step === 'variant2_survey') {
    const variant = getSecondVariant()
    
    console.log('🐛 DEBUG variant2_survey:', {
      step,
      randomization,
      secondVariant: getSecondVariant(), 
      variantToPass: variant
    })
    
    return (
      <EnhancedQuestionnaire
        key={`variant2-${variant}-questionnaire`} // Unique key per variant
        variant={variant}
        participantId={participantId}
        onComplete={(data) => handleQuestionnaireComplete(data, 'final_comparison')}
        onBack={() => updateStep('variant2_intro')}
      />
    )
  }

  // ERWEITERTER VERGLEICHS-FRAGEBOGEN
  if (step === 'final_comparison') {
    return (
      <EnhancedQuestionnaire
        variant="comparison"
        participantId={participantId}
        onComplete={(data) => handleQuestionnaireComplete(data, 'complete')}
        onBack={() => updateStep('variant2_intro')}
      />
    )
  }

  // Abschluss
  if (step === 'complete') {
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

              <div className="space-y-4 text-left bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-3">📊 Ihre Teilnahme im Überblick:</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Erste Variante:</span>
                    <br />Variante {getFirstVariant()} {variant1QuestionnaireData ? '✓' : '○'}
                  </div>
                  <div>
                    <span className="font-medium">Zweite Variante:</span>
                    <br />Variante {getSecondVariant()} {variant2QuestionnaireData ? '✓' : '○'}
                  </div>
                  <div>
                    <span className="font-medium">Vergleichs-Fragebogen:</span>
                    <br />{comparisonQuestionnaireData ? '✓ Vollständig' : '○ Unvollständig'}
                  </div>
                  <div>
                    <span className="font-medium">Gesamtdauer:</span>
                    <br />{Math.round((Date.now() - startTime.getTime()) / 60000)} Minuten
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg mt-6">
                <p className="text-sm text-yellow-800">
                  <strong>Wissenschaftlicher Hinweis:</strong> Ihre Daten fließen in das Forschungsprojekt 
                  "LLM-gestützte Formularbearbeitung" an der HAW Hamburg ein und helfen dabei, 
                  benutzerfreundlichere digitale Systeme zu entwickeln.
                </p>
              </div>

              <Button 
                onClick={() => router.push('/')}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white"
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

export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Studie wird geladen..." />
      </div>
    }>
      <StudyContent />
    </Suspense>
  )
}