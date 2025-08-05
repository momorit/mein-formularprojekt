// src/app/study/page.tsx - Aktualisierte Version mit Fragebogen-System

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SUSQuestionnaire } from '@/components/Questionnaire/SUSQuestionnaire'
import { CustomUsabilityItems } from '@/components/Questionnaire/CustomUsabilityItems'
import { ComparisonQuestionnaire } from '@/components/Questionnaire/ComparisonQuestionnaire'
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
  customResponses: Record<string, number>
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

  const { timingData, startVariant, endVariant, finishStudy } = useTimingTracker()

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">FormularIQ Nutzerstudie</h1>
          <p className="text-lg text-gray-600">Vergleich verschiedener Formular-Interaktionen</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Willkommen zur Studie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Study Info */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">📋 Was Sie erwartet:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold mr-3">1</span>
                  Kurzer Fragebogen zu Ihrer Person
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold mr-3">2</span>
                  Szenario-Beschreibung lesen
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold mr-3">3</span>
                  2 verschiedene Formular-Varianten testen
                </div>
                <div className="flex items-center">
                  <span className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-blue-900 font-semibold mr-3">4</span>
                  Feedback zu beiden Varianten geben
                </div>
              </div>
            </div>

            {/* Time & Data Info */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">⏱️ Zeitaufwand</h4>
                <p className="text-green-800 text-sm">Ca. 15-20 Minuten</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-purple-900 mb-2">📊 Ihre Daten</h4>
                <p className="text-purple-800 text-sm">Anonym & DSGVO-konform</p>
              </div>
            </div>

            {/* Participant Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">Ihre Teilnehmer-ID:</h4>
                  <p className="text-sm text-gray-600 font-mono">{studyData.participantId}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Reihenfolge:</h4>
                  <p className="text-sm text-gray-600">
                    {studyData.randomization === 'A-B' ? 'Variante A → B' : 'Variante B → A'}
                  </p>
                </div>
              </div>
            </div>

            {/* DSGVO Consent */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔒 Datenschutz & Einverständnis</h3>
              
              <div className="space-y-3 text-sm text-gray-700 mb-6">
                <p>• <strong>Anonymität:</strong> Ihre Daten werden vollständig anonymisiert gespeichert</p>
                <p>• <strong>Verwendung:</strong> Nur für wissenschaftliche Zwecke (Studienprojekt HAW Hamburg)</p>
                <p>• <strong>Speicherung:</strong> Lokal in Ihrem Browser, keine Server-Übertragung</p>
                <p>• <strong>Löschung:</strong> Sie können jederzeit abbrechen und Daten löschen</p>
              </div>

              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Ich habe die Datenschutzinformationen gelesen und stimme der anonymen 
                  Datenerhebung für wissenschaftliche Zwecke zu. Mir ist bewusst, dass ich 
                  jederzeit abbrechen kann.
                </span>
              </label>
            </div>

            {/* Start Button */}
            <div className="text-center pt-6">
              <Button
                onClick={onProceed}
                disabled={!consent}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                📋 Studie starten
              </Button>
              
              {!consent && (
                <p className="text-sm text-gray-500 mt-2">
                  Bitte stimmen Sie der Datenerhebung zu, um fortzufahren.
                </p>
              )}
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
  onComplete: (responses: { susResponses: Record<string, number>, customResponses: Record<string, number> }) => void 
}) {
  const [susResponses, setSusResponses] = useState<Record<string, number>>({})
  const [customResponses, setCustomResponses] = useState<Record<string, number>>({})
  const [currentSection, setCurrentSection] = useState<'sus' | 'custom'>('sus')

  const handleNext = () => {
    if (currentSection === 'sus') {
      setCurrentSection('custom')
    } else {
      onComplete({ susResponses, customResponses })
    }
  }

  const isSectionComplete = () => {
    if (currentSection === 'sus') {
      return Object.keys(susResponses).length === 10
    } else {
      return Object.keys(customResponses).length === 4
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">
              Fragebogen - {variantName}
            </CardTitle>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: currentSection === 'sus' ? '50%' : '100%' }}
              />
            </div>
          </CardHeader>
          <CardContent>
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

            <div className="flex justify-between mt-8">
              {currentSection === 'custom' && (
                <Button
                  onClick={() => setCurrentSection('sus')}
                  variant="outline"
                >
                  ← Zurück
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!isSectionComplete()}
                className="ml-auto"
              >
                {currentSection === 'sus' ? 'Weiter →' : 'Abschließen'}
              </Button>
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
    const required = ['speed', 'understandability', 'pleasantness', 'future_preference', 'overall_rating']
    return required.every(key => responses[key])
  }

  const handleComplete = () => {
    onComplete({
      responses,
      completedAt: new Date()
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Vergleich der Varianten</CardTitle>
          </CardHeader>
          <CardContent>
            <ComparisonQuestionnaire
              responses={responses}
              onChange={setResponses}
            />

            <div className="flex justify-center mt-8">
              <Button
                onClick={handleComplete}
                disabled={!isComplete()}
                className="px-8 py-3 text-lg"
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
    
    // Save to localStorage for now
    localStorage.setItem(`study_${studyData.participantId}`, JSON.stringify(finalData))
    
    // Download as JSON
    const blob = new Blob([JSON.stringify(finalData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `study_${studyData.participantId}.json`
    a.click()
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl text-green-600 text-center">
              🎉 Vielen Dank für Ihre Teilnahme!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-lg text-gray-700">
              Sie haben die Studie erfolgreich abgeschlossen. Ihre Daten wurden gespeichert.
            </p>
            
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">📊 Ihre Ergebnisse:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Teilnehmer-ID:</strong><br />
                  {studyData.participantId}
                </div>
                <div>
                  <strong>Gesamtdauer:</strong><br />
                  {Math.round((timingData.duration || 0) / 1000 / 60)} Minuten
                </div>
              </div>
            </div>

            <Button onClick={saveStudyData} className="px-8 py-3">
              📥 Studiendaten herunterladen
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Placeholder components (implement these based on your existing code)  
function DemographicsStep({ studyData, onComplete }: any) {
  // Use your existing demographics component
  return <div>Demographics Step</div>
}

function ScenarioStep({ studyData, firstVariant, firstVariantName, onProceed }: any) {
  // Use your existing scenario component  
  return <div>Scenario Step</div>
}

function VariantTestStep({ variant, variantName, redirectUrl, onComplete }: any) {
  // Redirect to the actual variant and track completion
  return <div>Variant Test Step</div>
}