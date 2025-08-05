// src/app/study/page.tsx - COMPLETE VERSION

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SUSQuestionnaire } from '@/components/Questionnaire/SUSQuestionnaire'
import { CustomUsabilityItems } from '@/components/Questionnaire/CustomUsabilityItems'
import { ComparisonQuestionnaire } from '@/components/Questionnaire/ComparisonQuestionnaire'
import { DemographicsForm } from '@/components/Questionnaire/DemographicsForm'
import { useTimingTracker } from '@/components/Questionnaire/TimingTracker'

// Types
interface StudyData {
  participantId: string
  randomization: 'A-B' | 'B-A'
  startTime: Date
  demographics?: DemographicData
  variantA?: VariantResponse
  variantB?: VariantResponse
  comparison?: ComparisonData
  timingData?: any
}

interface DemographicData {
  age: string
  role: string
  experience: string
  techAffinity: number
  formularFrequency: string
  device: string
  browser: string
}

interface VariantResponse {
  susResponses: Record<string, number>
  customResponses: Record<string, number | string>
  completedAt: Date
  variant: 'A' | 'B'
}

interface ComparisonData {
  responses: Record<string, string>
  completedAt: Date
}

type StudyStep = 
  | 'welcome' 
  | 'demographics' 
  | 'scenario' 
  | 'variant-a' 
  | 'questionnaire-a' 
  | 'variant-b' 
  | 'questionnaire-b' 
  | 'comparison' 
  | 'complete'

export default function StudyPage() {
  const [currentStep, setCurrentStep] = useState<StudyStep>('welcome')
  const [studyData, setStudyData] = useState<StudyData>(() => ({
    participantId: generateParticipantId(),
    randomization: Math.random() > 0.5 ? 'A-B' : 'B-A',
    startTime: new Date()
  }))

  const { 
    timingData, 
    startVariant, 
    endVariant, 
    startQuestionnaire, 
    endQuestionnaire, 
    finishStudy 
  } = useTimingTracker()

  // Auto-start timing for each step
  useEffect(() => {
    if (currentStep === 'demographics') {
      startQuestionnaire('demographics')
    } else if (currentStep === 'questionnaire-a') {
      startQuestionnaire('variantA')
    } else if (currentStep === 'questionnaire-b') {
      startQuestionnaire('variantB')
    } else if (currentStep === 'comparison') {
      startQuestionnaire('comparison')
    }
  }, [currentStep])

  // Generate unique participant ID
  function generateParticipantId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P_${timestamp}_${random}`.toUpperCase()
  }

  // Get first variant based on randomization
  const firstVariant = studyData.randomization === 'A-B' ? 'A' : 'B'
  const secondVariant = studyData.randomization === 'A-B' ? 'B' : 'A'
  const firstVariantName = firstVariant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'
  const secondVariantName = secondVariant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'

  // Render based on current step
  switch (currentStep) {
    case 'welcome':
      return <WelcomeStep studyData={studyData} onProceed={() => setCurrentStep('demographics')} />
    
    case 'demographics':
      return (
        <DemographicsStep 
          studyData={studyData} 
          onComplete={(demographics) => {
            endQuestionnaire('demographics')
            setStudyData(prev => ({ ...prev, demographics }))
            setCurrentStep('scenario')
          }} 
        />
      )
    
    case 'scenario':
      return (
        <ScenarioStep 
          studyData={studyData}
          firstVariant={firstVariant}
          firstVariantName={firstVariantName}
          onProceed={() => {
            startVariant(firstVariant as 'A' | 'B')
            setCurrentStep(firstVariant === 'A' ? 'variant-a' : 'variant-b')
          }}
        />
      )
    
    case 'variant-a':
      return (
        <VariantTestStep
          variant="A"
          variantName="Sichtbares Formular"
          redirectUrl="/form-a"
          onComplete={() => {
            endVariant('A')
            setCurrentStep('questionnaire-a')
          }}
        />
      )
    
    case 'variant-b':
      return (
        <VariantTestStep
          variant="B"
          variantName="Dialog-System"
          redirectUrl="/form-b"
          onComplete={() => {
            endVariant('B')
            setCurrentStep('questionnaire-b')
          }}
        />
      )
    
    case 'questionnaire-a':
      return (
        <QuestionnaireStep
          variant="A"
          variantName="Sichtbares Formular"
          onComplete={(responses) => {
            endQuestionnaire('variantA')
            setStudyData(prev => ({ 
              ...prev, 
              variantA: {
                ...responses,
                completedAt: new Date(),
                variant: 'A'
              }
            }))
            
            // Go to second variant or comparison
            if (secondVariant === 'B') {
              startVariant('B')
              setCurrentStep('variant-b')
            } else if (secondVariant === 'A') {
              // This shouldn't happen, but just in case
              setCurrentStep('comparison')
            } else {
              setCurrentStep('comparison')
            }
          }}
        />
      )
    
    case 'questionnaire-b':
      return (
        <QuestionnaireStep
          variant="B"
          variantName="Dialog-System"
          onComplete={(responses) => {
            endQuestionnaire('variantB')
            setStudyData(prev => ({ 
              ...prev, 
              variantB: {
                ...responses,
                completedAt: new Date(),
                variant: 'B'
              }
            }))
            setCurrentStep('comparison')
          }}
        />
      )
    
    case 'comparison':
      return (
        <ComparisonStep
          onComplete={(comparison) => {
            endQuestionnaire('comparison')
            setStudyData(prev => ({ ...prev, comparison }))
            finishStudy()
            setCurrentStep('complete')
          }}
        />
      )
    
    case 'complete':
      return <CompletionStep studyData={studyData} timingData={timingData} />
    
    default:
      return <div>Unbekannter Schritt</div>
  }
}

// Individual Step Components
function WelcomeStep({ studyData, onProceed }: { studyData: StudyData, onProceed: () => void }) {
  const [consent, setConsent] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🏢 FormularIQ Nutzerstudie
          </h1>
          <p className="text-xl text-gray-600">
            Vergleich verschiedener Formular-Interaktionen
          </p>
          <p className="text-sm text-gray-500 mt-2">
            HAW Hamburg • Studienprojekt 2025
          </p>
        </div>

        <Card className="mb-8 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">Willkommen zur Studie</CardTitle>
            <p className="text-blue-100">
              Helfen Sie uns dabei, die beste Art der Formular-Interaktion zu finden!
            </p>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            
            {/* Study Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">📋 Was Sie erwartet:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-bold mr-3">1</span>
                  <span>Kurzer Fragebogen zu Ihrer Person (2-3 Min.)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-bold mr-3">2</span>
                  <span>Szenario-Beschreibung lesen (1 Min.)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-bold mr-3">3</span>
                  <span>2 verschiedene Formular-Varianten testen (8-10 Min.)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-bold mr-3">4</span>
                  <span>Bewertung und Vergleich (5-7 Min.)</span>
                </div>
              </div>
            </div>

            {/* Time & Data Info */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2 flex items-center">
                  ⏱️ <span className="ml-2">Zeitaufwand</span>
                </h4>
                <p className="text-green-800 text-sm">Ca. 15-20 Minuten</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
                  📊 <span className="ml-2">Ihre Daten</span>
                </h4>
                <p className="text-purple-800 text-sm">Anonym & DSGVO-konform</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
                  🎯 <span className="ml-2">Ziel</span>
                </h4>
                <p className="text-orange-800 text-sm">Bessere Formular-Designs</p>
              </div>
            </div>

            {/* Participant Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🆔 Ihre Teilnehmer-ID:</h4>
                  <p className="text-lg text-gray-700 font-mono bg-white px-3 py-2 rounded border">
                    {studyData.participantId}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">🔄 Test-Reihenfolge:</h4>
                  <p className="text-lg text-gray-700 bg-white px-3 py-2 rounded border">
                    {studyData.randomization === 'A-B' ? 
                      '1. Sichtbares Formular → 2. Dialog-System' : 
                      '1. Dialog-System → 2. Sichtbares Formular'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* DSGVO Consent */}
            <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                🔒 <span className="ml-2">Datenschutz & Einverständnis</span>
              </h3>
              
              <div className="space-y-3 text-sm text-gray-700 mb-6">
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Anonymität:</strong> Ihre Daten werden vollständig anonymisiert gespeichert</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Verwendung:</strong> Nur für wissenschaftliche Zwecke (Studienprojekt HAW Hamburg)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Speicherung:</strong> Lokal in Ihrem Browser, keine Server-Übertragung</span>
                </div>
                <div className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Löschung:</strong> Sie können jederzeit abbrechen und Daten löschen</span>
                </div>
              </div>

              <label className="flex items-start space-x-3 cursor-pointer bg-blue-50 p-4 rounded-lg border border-blue-200">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  <strong>Ich stimme zu:</strong> Ich habe die Datenschutzinformationen gelesen und verstanden. 
                  Ich stimme der anonymen Datenerhebung für wissenschaftliche Zwecke zu. 
                  Mir ist bewusst, dass ich jederzeit abbrechen kann.
                </span>
              </label>
            </div>

            {/* Start Button */}
            <div className="text-center pt-6">
              <Button
                onClick={onProceed}
                disabled={!consent}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-semibold shadow-lg"
              >
                📋 Studie starten
              </Button>
              
              {!consent && (
                <p className="text-sm text-red-500 mt-3">
                  ⚠️ Bitte stimmen Sie der Datenerhebung zu, um fortzufahren.
                </p>
              )}
              
              {consent && (
                <p className="text-sm text-green-600 mt-3">
                  ✅ Bereit zum Start! Klicken Sie den Button, um zu beginnen.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DemographicsStep({ studyData, onComplete }: { studyData: StudyData, onComplete: (data: DemographicData) => void }) {
  const [formData, setFormData] = useState<DemographicData>({
    age: '',
    role: '',
    experience: '',
    techAffinity: 0,
    formularFrequency: '',
    device: '',
    browser: getBrowserName()
  })

  const isValid = () => {
    return formData.age && 
           formData.role && 
           formData.experience && 
           formData.techAffinity > 0 && 
           formData.formularFrequency && 
           formData.device
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schritt 1: Über Sie</h1>
          <p className="text-gray-600">Teilnehmer-ID: <span className="font-mono">{studyData.participantId}</span></p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            <DemographicsForm 
              formData={formData}
              onChange={setFormData}
            />

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Schritt 1 von 7 • Demografische Daten
              </div>
              <Button
                onClick={() => onComplete(formData)}
                disabled={!isValid()}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
              >
                Weiter zum Szenario →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ScenarioStep({ studyData, firstVariant, firstVariantName, onProceed }: any) {
  const [readComplete, setReadComplete] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Schritt 2: Ihr Szenario</h1>
          <p className="text-gray-600">Teilnehmer-ID: <span className="font-mono">{studyData.participantId}</span></p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
            <CardTitle className="text-2xl">🏠 Ihr Testszenario</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            
            {/* Main Scenario */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-green-800 mb-4">🎭 Stellen Sie sich vor:</h3>
              <div className="text-green-700 space-y-3">
                <p className="text-lg leading-relaxed">
                  Sie sind <strong>Eigentümer eines Mehrfamilienhauses</strong> aus den 1980er Jahren 
                  mit 6 Wohneinheiten in Hamburg. Das Gebäude wird aktuell saniert.
                </p>
                <p>
                  Sie müssen für die Stadtverwaltung ein <strong>Gebäudeerfassungsformular</strong> ausfüllen, 
                  um Fördergelder für die energetische Sanierung zu beantragen.
                </p>
                <p>
                  <strong>Sie haben alle nötigen Informationen zur Hand:</strong> Baupläne, 
                  Energieausweis, Heizungsunterlagen, etc.
                </p>
              </div>
            </div>

            {/* Building Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">🏢 Gebäudedaten (als Hilfe):</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-700">
                <div>• <strong>Typ:</strong> Mehrfamilienhaus</div>
                <div>• <strong>Baujahr:</strong> 1984</div>
                <div>• <strong>Wohnfläche:</strong> ca. 480 m²</div>
                <div>• <strong>Stockwerke:</strong> 3 + Keller</div>
                <div>• <strong>Wohneinheiten:</strong> 6</div>
                <div>• <strong>Heizung:</strong> Gas-Zentralheizung</div>
                <div>• <strong>Dach:</strong> Satteldach, teilgedämmt</div>
                <div>• <strong>Fenster:</strong> Kunststoff, Doppelverglasung</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-yellow-800 mb-3">📝 Ihre Aufgabe:</h3>
              <div className="text-yellow-700 space-y-2">
                <p>
                  Bei unsicheren Angaben verwenden Sie die bereitgestellten 
                  Informationen als Anhaltspunkt - Sie müssen teilweise <strong>schätzen oder nachfragen</strong>.
                </p>
                <p className="text-green-700 text-sm mt-2">
                  💡 <em>Hinweis: Es gibt "Weiß ich nicht" und "Müsste ich nachschlagen" Optionen bei schwierigeren Fragen.</em>
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">📋 Ihr Testablauf:</h3>
              <div className="space-y-3 text-sm text-purple-700">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-900 font-bold mr-3 text-xs">1</span>
                  <span>Sie testen <strong>Variante {firstVariant} ({firstVariantName})</strong></span>
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-900 font-bold mr-3 text-xs">2</span>
                  <span>Kurzer Fragebogen zu dieser Variante</span>
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-900 font-bold mr-3 text-xs">3</span>
                  <span>Variante {studyData.randomization === 'A-B' ? 'B' : 'A'} testen</span>
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center text-purple-900 font-bold mr-3 text-xs">4</span>
                  <span>Fragebogen und direkter Vergleich</span>
                </div>
              </div>
            </div>

            {/* Confirmation */}
            <div className="border-2 border-gray-300 rounded-lg p-6 bg-white">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={readComplete}
                  onChange={(e) => setReadComplete(e.target.checked)}
                  className="mt-1 w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-700 leading-relaxed">
                  <strong>✅ Bereit zum Test:</strong> Ich habe das Szenario gelesen und verstanden. 
                  Ich bin bereit, das Formular als Eigentümer des beschriebenen Mehrfamilienhauses auszufüllen.
                </span>
              </label>
            </div>

            {/* Action */}
            <div className="flex justify-between items-center pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Schritt 2 von 7 • Szenario-Einführung
              </div>
              <Button
                onClick={onProceed}
                disabled={!readComplete}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 px-8"
              >
                🚀 Variante {firstVariant} starten
              </Button>
            </div>
            
            {!readComplete && (
              <p className="text-sm text-red-500 text-center">
                ⚠️ Bitte bestätigen Sie, dass Sie das Szenario gelesen haben.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function VariantTestStep({ variant, variantName, redirectUrl, onComplete }: any) {
  const [testStarted, setTestStarted] = useState(false)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Test: Variante {variant}
          </h1>
          <p className="text-xl text-gray-600">{variantName}</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-2xl">🚀 Bereit zum Testen</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">
                📝 So geht's weiter:
              </h3>
              <div className="space-y-3 text-purple-700">
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 font-bold">1.</span>
                  <span>Klicken Sie auf "Variante {variant} öffnen" (öffnet in neuem Tab)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 font-bold">2.</span>
                  <span>Füllen Sie das Formular als Gebäude-Eigentümer aus</span>
                </div>
                <div className="flex items-start">
                  <span className="text-purple-600 mr-2 font-bold">3.</span>
                  <span>Kehren Sie hierher zurück und klicken "Test abgeschlossen"</span>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 text-sm">
                💡 <strong>Tipp:</strong> Nutzen Sie die Hilfe-Funktionen, falls Sie unsicher sind. 
                Das ist Teil des Tests!
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => {
                  setTestStarted(true)
                  window.open(redirectUrl, '_blank')
                }}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8"
              >
                📝 Variante {variant} öffnen
              </Button>
              
              <Button
                onClick={onComplete}
                disabled={!testStarted}
                variant={testStarted ? "default" : "outline"}
                size="lg"
                className={testStarted ? "bg-green-600 hover:bg-green-700 text-white px-8" : "px-8"}
              >
                ✅ Test abgeschlossen
              </Button>
            </div>

            {!testStarted && (
              <p className="text-sm text-gray-500 text-center">
                Öffnen Sie zuerst die Variante, bevor Sie "Test abgeschlossen" klicken können.
              </p>
            )}

            <div className="text-center pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Schritt {variant === 'A' ? '3' : '5'} von 7 • Variante {variant} testen
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function QuestionnaireStep({ 
  variant, 
  variantName, 
  onComplete 
}: { 
  variant: 'A' | 'B'
  variantName: string 
  onComplete: (responses: { susResponses: Record<string, number>, customResponses: Record<string, number | string> }) => void 
}) {
  const [susResponses, setSusResponses] = useState<Record<string, number>>({})
  const [customResponses, setCustomResponses] = useState<Record<string, number | string>>({})
  const [currentSection, setCurrentSection] = useState<'sus' | 'custom'>('sus')

  const handleNext = () => {
    if (currentSection === 'sus') {
      setCurrentSection('custom')
    } else {
      onComplete({ susResponses, customResponses })
    }
  }

  const handleBack = () => {
    setCurrentSection('sus')
  }

  const isSUSComplete = () => {
    return Object.keys(susResponses).filter(key => key.startsWith('sus_')).length === 10
  }

  const isCustomComplete = () => {
    const requiredKeys = ['helpfulness', 'efficiency', 'trust', 'frustration', 'satisfaction']
    return requiredKeys.every(key => customResponses[key] && customResponses[key] !== 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bewertung: {variantName}
          </h1>
          <p className="text-gray-600">
            {currentSection === 'sus' ? 'System Usability Scale (SUS)' : 'Spezifische Bewertung'}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-gray-900">
                Fragebogen zu Variante {variant}
              </CardTitle>
              <div className="text-sm text-gray-500">
                Teil {currentSection === 'sus' ? '1' : '2'} von 2
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: currentSection === 'sus' ? '50%' : '100%' }}
              />
            </div>
          </CardHeader>
          <CardContent className="p-8">
            {currentSection === 'sus' ? (
              <SUSQuestionnaire
                responses={susResponses}
                onChange={setSusResponses}
                variantName={variantName}
              />
            ) : (
              <CustomUsabilityItems
                responses={customResponses}
                onChange={setCustomResponses}
              />
            )}

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Schritt {variant === 'A' ? '4' : '6'} von 7 • Fragebogen {variant}
              </div>
              
              <div className="flex gap-4">
                {currentSection === 'custom' && (
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    size="lg"
                  >
                    ← Zurück
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  disabled={currentSection === 'sus' ? !isSUSComplete() : !isCustomComplete()}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8"
                >
                  {currentSection === 'sus' ? 'Weiter →' : 'Fragebogen abschließen →'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ComparisonStep({ onComplete }: { onComplete: (comparison: ComparisonData) => void }) {
  const [responses, setResponses] = useState<Record<string, string>>({})

  const isComplete = () => {
    const required = ['speed', 'understandability', 'pleasantness', 'helpfulness', 'future_preference', 'overall_rating']
    return required.every(key => responses[key])
  }

  const handleComplete = () => {
    onComplete({
      responses,
      completedAt: new Date()
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vergleich der Varianten</h1>
          <p className="text-gray-600">Welche Variante hat Ihnen besser gefallen?</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <CardTitle className="text-2xl">⚖️ Direkter Vergleich</CardTitle>
            <p className="text-purple-100">
              Vergleichen Sie das sichtbare Formular (A) mit dem Dialog-System (B)
            </p>
          </CardHeader>
          <CardContent className="p-8">
            <ComparisonQuestionnaire
              responses={responses}
              onChange={setResponses}
            />

            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Schritt 7 von 7 • Vergleich & Abschluss
              </div>
              <Button
                onClick={handleComplete}
                disabled={!isComplete()}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 px-12 py-4 text-lg font-semibold"
              >
                🎉 Studie abschließen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CompletionStep({ studyData, timingData }: { studyData: StudyData, timingData: any }) {
  const saveStudyData = () => {
    const finalData = {
      ...studyData,
      timingData,
      completedAt: new Date()
    }
    
    // Save to localStorage
    localStorage.setItem(`study_${studyData.participantId}`, JSON.stringify(finalData))
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(finalData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FormularIQ_Study_${studyData.participantId}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalMinutes = timingData.totalDuration ? Math.round(timingData.totalDuration / 1000 / 60) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-600 to-teal-600 text-white text-center py-12">
            <CardTitle className="text-4xl mb-4">
              🎉 Herzlichen Dank!
            </CardTitle>
            <p className="text-xl text-green-100">
              Sie haben die FormularIQ Studie erfolgreich abgeschlossen!
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-8 p-12">
            
            <p className="text-xl text-gray-700 leading-relaxed">
              Ihre Teilnahme hilft uns dabei, bessere und benutzerfreundlichere 
              Formular-Interfaces zu entwickeln. Vielen Dank für Ihre Zeit und Ihr wertvolles Feedback!
            </p>
            
            {/* Results Summary */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-8">
              <h3 className="text-2xl font-semibold text-green-900 mb-6">📊 Ihre Studien-Zusammenfassung</h3>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">🆔 Teilnehmer-Daten</h4>
                  <p className="text-sm text-gray-700 font-mono">{studyData.participantId}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">⏱️ Gesamtdauer</h4>
                  <p className="text-sm text-gray-700">{totalMinutes} Minuten</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">🔄 Test-Reihenfolge</h4>
                  <p className="text-sm text-gray-700">{studyData.randomization}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Status</h4>
                  <p className="text-sm text-green-700 font-semibold">Vollständig abgeschlossen</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button 
                onClick={saveStudyData} 
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg font-semibold"
              >
                📥 Studiendaten herunterladen
              </Button>
              
              <p className="text-sm text-gray-500">
                Optional: Laden Sie Ihre anonymisierten Studiendaten als JSON-Datei herunter.
              </p>
            </div>

            {/* Thank you message */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-blue-900 mb-2">
                🙏 Danke für Ihre Unterstützung
              </h4>
              <p className="text-blue-700 text-sm">
                Diese Studie ist Teil eines Studienprojekts an der HAW Hamburg. 
                Ihre Daten werden ausschließlich für wissenschaftliche Zwecke verwendet 
                und helfen dabei, die Zukunft der digitalen Formular-Interaktion zu gestalten.
              </p>
            </div>

            {/* Navigation */}
            <div className="pt-6 border-t border-gray-200">
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                size="lg"
              >
                🏠 Zur Startseite
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Helper function
function getBrowserName(): string {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari'
  if (userAgent.includes('Edg')) return 'Edge'
  return 'Unbekannt'
}