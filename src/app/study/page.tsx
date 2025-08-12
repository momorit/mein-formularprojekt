// src/app/study/page.tsx - VOLLSTÄNDIGE LÖSUNG (Fragebögen + Szenario-Fix)

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// === TIMING TRACKER ===
interface TimingData {
  studyStart: Date
  studyEnd?: Date
  totalDuration?: number
  variantTimes: {
    variantA?: { start: Date; end?: Date; duration?: number }
    variantB?: { start: Date; end?: Date; duration?: number }
  }
  questionnaireStartTimes: {
    demographics?: Date
    variantA?: Date
    variantB?: Date
    comparison?: Date
  }
  questionnaireDurations: {
    demographics?: number
    variantA?: number
    variantB?: number
    comparison?: number
  }
}

function useTimingTracker() {
  const [timingData, setTimingData] = useState<TimingData>({
    studyStart: new Date(),
    variantTimes: {},
    questionnaireStartTimes: {},
    questionnaireDurations: {}
  })

  const startVariant = (variant: 'A' | 'B') => {
    console.log(`⏱️ Starting variant ${variant}`)
    setTimingData(prev => ({
      ...prev,
      variantTimes: {
        ...prev.variantTimes,
        [`variant${variant}`]: { start: new Date() }
      }
    }))
  }

  const endVariant = (variant: 'A' | 'B') => {
    console.log(`⏱️ Ending variant ${variant}`)
    setTimingData(prev => {
      const variantKey = `variant${variant}` as keyof typeof prev.variantTimes
      const variantTime = prev.variantTimes[variantKey]
      
      if (variantTime && variantTime.start) {
        const endTime = new Date()
        const duration = endTime.getTime() - variantTime.start.getTime()
        
        return {
          ...prev,
          variantTimes: {
            ...prev.variantTimes,
            [variantKey]: {
              ...variantTime,
              end: endTime,
              duration
            }
          }
        }
      }
      return prev
    })
  }

  const startQuestionnaire = (type: 'demographics' | 'variantA' | 'variantB' | 'comparison') => {
    const startTime = new Date()
    setTimingData(prev => ({
      ...prev,
      questionnaireStartTimes: {
        ...prev.questionnaireStartTimes,
        [type]: startTime
      }
    }))
  }

  const endQuestionnaire = (type: 'demographics' | 'variantA' | 'variantB' | 'comparison') => {
    const endTime = new Date()
    setTimingData(prev => {
      const startTime = prev.questionnaireStartTimes[type]
      if (startTime) {
        const duration = endTime.getTime() - startTime.getTime()
        return {
          ...prev,
          questionnaireDurations: {
            ...prev.questionnaireDurations,
            [type]: duration
          }
        }
      }
      return prev
    })
  }

  const finishStudy = () => {
    const endTime = new Date()
    setTimingData(prev => ({
      ...prev,
      studyEnd: endTime,
      totalDuration: endTime.getTime() - prev.studyStart.getTime()
    }))
  }

  return {
    timingData,
    startVariant,
    endVariant,
    startQuestionnaire,
    endQuestionnaire,
    finishStudy
  }
}

// === QUESTIONNAIRE COMPONENTS ===
interface LikertScaleProps {
  question: string
  value: number
  onChange: (value: number) => void
  labels: [string, string]
  required?: boolean
  questionNumber?: number
}

const LikertScale: React.FC<LikertScaleProps> = ({
  question,
  value,
  onChange,
  labels,
  required = false,
  questionNumber
}) => {
  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-white">
      <label className="block text-sm font-medium text-gray-900 mb-4">
        {questionNumber && <span className="text-blue-600 font-semibold">{questionNumber}. </span>}
        {question} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <span className="max-w-[120px] text-left">{labels[0]}</span>
        <span className="max-w-[120px] text-right">{labels[1]}</span>
      </div>
      
      <div className="flex justify-center space-x-6">
        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="flex flex-col items-center cursor-pointer group">
            <input
              type="radio"
              name={`likert-${questionNumber}-${question.slice(0, 20)}`}
              value={num}
              checked={value === num}
              onChange={() => onChange(num)}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
              required={required}
            />
            <span className="text-sm mt-2 text-gray-600 group-hover:text-blue-600 font-medium">{num}</span>
          </label>
        ))}
      </div>
      
      {!value && required && (
        <p className="text-xs text-red-500 mt-2">Bitte wählen Sie eine Bewertung aus.</p>
      )}
    </div>
  )
}

const SUSQuestionnaire = ({ responses, onChange, variantName }: {
  responses: Record<string, number>
  onChange: (responses: Record<string, number>) => void
  variantName: string
}) => {
  const SUS_QUESTIONS = [
    "Ich kann mir vorstellen, dieses System regelmäßig zu nutzen",
    "Ich fand das System unnötig komplex", 
    "Ich fand das System einfach zu bedienen",
    "Ich glaube, ich würde technische Unterstützung brauchen, um das System zu nutzen",
    "Die verschiedenen Funktionen in diesem System waren gut integriert",
    "Ich fand, es gab zu viele Unstimmigkeiten in diesem System",
    "Ich kann mir vorstellen, dass die meisten Menschen dieses System schnell lernen",
    "Ich fand das System sehr umständlich zu bedienen",
    "Ich fühlte mich bei der Nutzung des Systems sehr sicher",
    "Ich musste viele Dinge lernen, bevor ich mit diesem System arbeiten konnte"
  ]

  const handleChange = (questionIndex: number, value: number) => {
    onChange({
      ...responses,
      [`sus_${questionIndex + 1}`]: value
    })
  }

  const completedQuestions = Object.keys(responses).filter(key => key.startsWith('sus_')).length
  const progress = (completedQuestions / 10) * 100

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-2">
          📊 System Usability Scale (SUS)
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          Bewerten Sie bitte Ihre Erfahrung mit <strong>{variantName}</strong>. 
        </p>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-600 mt-1">
          {completedQuestions} von 10 Fragen beantwortet
        </p>
      </div>

      {SUS_QUESTIONS.map((question, index) => (
        <LikertScale
          key={index}
          questionNumber={index + 1}
          question={question}
          value={responses[`sus_${index + 1}`] || 0}
          onChange={(value) => handleChange(index, value)}
          labels={["Stimme gar nicht zu", "Stimme voll zu"]}
          required
        />
      ))}
    </div>
  )
}

const ComparisonQuestionnaire = ({ responses, onChange }: {
  responses: Record<string, string>
  onChange: (responses: Record<string, string>) => void
}) => {
  const COMPARISON_QUESTIONS = [
    {
      key: 'speed',
      question: 'Welche Variante war schneller zu bedienen?',
      options: ['Variante A (Sichtbares Formular)', 'Variante B (Dialog-System)', 'Etwa gleich schnell']
    },
    {
      key: 'understandability',
      question: 'Welche Variante war verständlicher und intuitiver?',
      options: ['Variante A (Sichtbares Formular)', 'Variante B (Dialog-System)', 'Etwa gleich verständlich']
    },
    {
      key: 'future_preference',
      question: 'Welche Variante würden Sie in Zukunft für ähnliche Aufgaben wählen?',
      options: ['Eindeutig Variante A', 'Eher Variante A', 'Mir egal', 'Eher Variante B', 'Eindeutig Variante B']
    }
  ]

  const handleChange = (key: string, value: string) => {
    onChange({
      ...responses,
      [key]: value
    })
  }

  const completedQuestions = Object.keys(responses).filter(key => 
    COMPARISON_QUESTIONS.some(q => q.key === key)
  ).length
  const progress = (completedQuestions / COMPARISON_QUESTIONS.length) * 100

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-purple-900 mb-2">
          ⚖️ Direkter Vergleich
        </h3>
        <p className="text-sm text-purple-700 mb-3">
          Vergleichen Sie beide Varianten direkt miteinander.
        </p>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-purple-600 mt-1">
          {completedQuestions} von {COMPARISON_QUESTIONS.length} Fragen beantwortet
        </p>
      </div>

      {COMPARISON_QUESTIONS.map((item, index) => (
        <div key={item.key} className="p-4 border border-gray-200 rounded-lg bg-white">
          <label className="block text-sm font-medium text-gray-900 mb-4">
            <span className="text-purple-600 font-semibold">{index + 1}. </span>
            {item.question} <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-3">
            {item.options.map((option, optionIndex) => (
              <label key={optionIndex} className="flex items-center cursor-pointer group">
                <input
                  type="radio"
                  name={item.key}
                  value={option}
                  checked={responses[item.key] === option}
                  onChange={() => handleChange(item.key, option)}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  required
                />
                <span className="ml-3 text-sm text-gray-700 group-hover:text-purple-700">
                  {option}
                </span>
              </label>
            ))}
          </div>
          
          {!responses[item.key] && (
            <p className="text-xs text-red-500 mt-2">Bitte wählen Sie eine Option aus.</p>
          )}
        </div>
      ))}
    </div>
  )
}

// === MAIN STUDY COMPONENT ===
interface StudyData {
  participantId: string
  randomization: 'A-B' | 'B-A'
  startTime: Date
  variantA?: {
    susResponses: Record<string, number>
    completedAt: Date
    variant: 'A'
  }
  variantB?: {
    susResponses: Record<string, number>
    completedAt: Date
    variant: 'B'
  }
  comparison?: {
    responses: Record<string, string>
    completedAt: Date
  }
}

type StudyStep = 
  | 'welcome' 
  | 'overview' 
  | 'scenario' 
  | 'variant-selection'
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
  const [scenarioAcknowledged, setScenarioAcknowledged] = useState(false)

  const { 
    timingData, 
    startVariant, 
    endVariant, 
    startQuestionnaire, 
    endQuestionnaire, 
    finishStudy 
  } = useTimingTracker()

  function generateParticipantId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P_${timestamp}_${random}`.toUpperCase()
  }

  // Auto-start timing for each step
  useEffect(() => {
    if (currentStep === 'questionnaire-a') {
      startQuestionnaire('variantA')
    } else if (currentStep === 'questionnaire-b') {
      startQuestionnaire('variantB')
    } else if (currentStep === 'comparison') {
      startQuestionnaire('comparison')
    }
  }, [currentStep])

  // Render basierend auf aktuellem Schritt
  switch (currentStep) {
    case 'welcome':
      return <WelcomeStep onProceed={() => setCurrentStep('overview')} />
    
    case 'overview':
      return <OverviewStep onProceed={() => setCurrentStep('scenario')} />
      
    case 'scenario':
      return (
        <ScenarioStep 
          scenarioAcknowledged={scenarioAcknowledged}
          onAcknowledge={() => {
            setScenarioAcknowledged(true)
            setCurrentStep('variant-selection')
          }}
        />
      )
      
    case 'variant-selection':
      return (
        <VariantSelectionStep 
          studyData={studyData}
          scenarioAcknowledged={scenarioAcknowledged}
          onVariantSelect={(variant) => {
            startVariant(variant)
            setCurrentStep(variant === 'A' ? 'variant-a' : 'variant-b')
          }}
        />
      )
      
    case 'variant-a':
      return (
        <VariantTestStep
          variant="A"
          variantName="Sichtbares Formular"
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
            
            // Prüfe ob noch Variante B getestet werden muss
            if (!studyData.variantB) {
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
            endQuestionnaire('variantB')
            setStudyData(prev => ({ 
              ...prev, 
              variantB: {
                ...responses,
                completedAt: new Date(),
                variant: 'B'
              }
            }))
            
            // Prüfe ob noch Variante A getestet werden muss
            if (!studyData.variantA) {
              startVariant('A')
              setCurrentStep('variant-a')
            } else {
              setCurrentStep('comparison')
            }
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

// === INDIVIDUAL STEP COMPONENTS ===

function WelcomeStep({ onProceed }: { onProceed: () => void }) {
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
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">Willkommen zur Studie</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Was erwartet Sie?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Test von zwei verschiedenen Formular-Systemen
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Kurze Bewertung der beiden Systeme
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Geschätzte Dauer: 15-20 Minuten
                  </li>
                </ul>
              </div>

              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="consent" 
                  checked={consent} 
                  onChange={(e) => setConsent(e.target.checked)}
                  className="w-4 h-4 text-blue-600" 
                />
                <label htmlFor="consent" className="text-gray-700">
                  Ich stimme der Teilnahme zu und bin mit der anonymen Datenverarbeitung einverstanden.
                </label>
              </div>

              <Button 
                onClick={onProceed}
                disabled={!consent}
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-4"
              >
                Studie beginnen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OverviewStep({ onProceed }: { onProceed: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📋 Übersicht der Varianten
          </h1>
          <p className="text-lg text-gray-600">
            Sie werden zwei verschiedene Ansätze für das Ausfüllen von Formularen testen
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="text-2xl">A: Sichtbares Formular</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Ein klassisches Formular mit allen Feldern sichtbar und KI-Chat-Unterstützung.
              </p>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">⚡ Vorteile</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Vollständige Übersicht</li>
                  <li>• Freie Navigation</li>
                  <li>• KI-Hilfe verfügbar</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="text-2xl">B: Dialog-System</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <p className="text-gray-600 text-sm mb-4">
                Die KI führt Sie durch einen strukturierten Dialog mit gezielten Fragen.
              </p>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">⚡ Vorteile</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Geführter Prozess</li>
                  <li>• Kontextuelle Nachfragen</li>
                  <li>• Natürliche Konversation</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button 
            onClick={onProceed}
            className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-4 px-8"
          >
            Weiter zum Szenario →
          </Button>
        </div>
      </div>
    </div>
  )
}

function ScenarioStep({ scenarioAcknowledged, onAcknowledge }: { 
  scenarioAcknowledged: boolean, 
  onAcknowledge: () => void 
}) {
  const [showScenario, setShowScenario] = useState(true)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🏠 Szenario-Briefing
          </h1>
        </div>

        {showScenario && (
          <Card className="shadow-xl mb-6">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="text-2xl">🏢 Ihr Szenario</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed text-gray-800 mb-4">
                  Sie sind Eigentümer:in eines <strong>älteren Einfamilienhauses aus den 1970er Jahren</strong> 
                  und möchten eine <strong>energetische Sanierung</strong> durchführen lassen.
                </p>
                
                <p className="text-lg leading-relaxed text-gray-800 mb-4">
                  Um staatliche <strong>Fördergelder</strong> zu beantragen, benötigen Sie eine 
                  professionelle <strong>Energieberatung</strong>. Der Berater hat Ihnen ein 
                  Formular geschickt, das Sie vorab ausfüllen sollen.
                </p>

                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400 my-6">
                  <h4 className="font-semibold text-blue-800 mb-2">📝 Ihre Aufgabe</h4>
                  <p className="text-blue-700">
                    Füllen Sie das <strong>Gebäude-Erfassungsformular</strong> mit Informationen 
                    zu Ihrem Haus aus. Sie können realistische Daten verwenden oder sich 
                    plausible Werte ausdenken.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center space-x-4">
          {scenarioAcknowledged && (
            <Button
              onClick={() => setShowScenario(!showScenario)}
              variant="outline"
              className="border-blue-300 text-blue-600 hover:bg-blue-50"
            >
              {showScenario ? "Szenario minimieren" : "Szenario erneut anzeigen"}
            </Button>
          )}
          
          {!scenarioAcknowledged ? (
            <Button 
              onClick={onAcknowledge}
              className="bg-green-600 hover:bg-green-700 text-white text-lg py-3 px-8"
            >
              Verstanden, weiter zu den Varianten →
            </Button>
          ) : showScenario ? (
            <Button 
              onClick={() => setShowScenario(false)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg py-3 px-8"
            >
              Weiter zu den Varianten →
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function VariantSelectionStep({ studyData, scenarioAcknowledged, onVariantSelect }: { 
  studyData: StudyData,
  scenarioAcknowledged: boolean,
  onVariantSelect: (variant: 'A' | 'B') => void
}) {
  const [showScenario, setShowScenario] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🚀 Varianten-Test
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            Wählen Sie eine der beiden Varianten zum Starten
          </p>
        </div>

        {/* Szenario-Anzeige (collapsible) */}
        {scenarioAcknowledged && (
          <Card className="mb-6 bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <Button
                onClick={() => setShowScenario(!showScenario)}
                variant="outline"
                className="mb-4 text-sm"
              >
                {showScenario ? "📄 Szenario ausblenden" : "📄 Szenario erneut anzeigen"}
              </Button>
              
              {showScenario && (
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-semibold mb-2">🏢 Ihr Szenario:</h4>
                  <p className="text-sm text-gray-700">
                    <strong>Einfamilienhaus (1970er Jahre)</strong> → <strong>Energetische Sanierung</strong> → 
                    <strong>Fördergelder beantragen</strong> → <strong>Energieberatung nötig</strong> → 
                    <strong>Formular vorab ausfüllen</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Variante A */}
          <Card className="shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all group">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardTitle className="text-2xl">A: Sichtbares Formular</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Button 
                onClick={() => onVariantSelect('A')}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 text-lg font-medium"
              >
                Variante A testen
              </Button>
            </CardContent>
          </Card>

          {/* Variante B */}
          <Card className="shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all group">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardTitle className="text-2xl">B: Dialog-System</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Button
                onClick={() => onVariantSelect('B')}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 text-lg font-medium"
              >
                Variante B testen
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function VariantTestStep({ variant, variantName, onComplete }: {
  variant: 'A' | 'B',
  variantName: string,
  onComplete: () => void
}) {
  const [currentUrl, setCurrentUrl] = useState<string>('')

  useEffect(() => {
    // Redirect to variant page
    const targetUrl = variant === 'A' ? '/form-a' : '/form-b'
    window.location.href = targetUrl
  }, [variant])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 flex items-center justify-center">
      <Card className="max-w-md">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Variante {variant}: {variantName}
          </h2>
          <p className="text-gray-600 mb-4">Sie werden weitergeleitet...</p>
          <Button onClick={onComplete} variant="outline">
            Zurück zur Studie
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function QuestionnaireStep({ variant, variantName, onComplete }: {
  variant: 'A' | 'B',
  variantName: string,
  onComplete: (responses: { susResponses: Record<string, number> }) => void
}) {
  const [susResponses, setSusResponses] = useState<Record<string, number>>({})

  const handleComplete = () => {
    // Validate required responses
    const requiredResponses = 10 // SUS has 10 questions
    const completedResponses = Object.keys(susResponses).filter(key => key.startsWith('sus_')).length
    
    if (completedResponses < requiredResponses) {
      alert(`Bitte beantworten Sie alle ${requiredResponses} Fragen.`)
      return
    }

    onComplete({ susResponses })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            📊 Bewertung: Variante {variant}
          </h1>
          <p className="text-lg text-gray-600">
            Bewerten Sie Ihre Erfahrung mit {variantName}
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            <SUSQuestionnaire
              responses={susResponses}
              onChange={setSusResponses}
              variantName={variantName}
            />

            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleComplete}
                className="bg-green-600 hover:bg-green-700 text-white text-lg py-3 px-8"
              >
                Bewertung abschließen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ComparisonStep({ onComplete }: {
  onComplete: (comparison: { responses: Record<string, string> }) => void
}) {
  const [responses, setResponses] = useState<Record<string, string>>({})

  const handleComplete = () => {
    const requiredQuestions = ['speed', 'understandability', 'future_preference']
    const missingQuestions = requiredQuestions.filter(q => !responses[q])
    
    if (missingQuestions.length > 0) {
      alert('Bitte beantworten Sie alle Vergleichsfragen.')
      return
    }

    onComplete({ responses })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            ⚖️ Abschließender Vergleich
          </h1>
          <p className="text-lg text-gray-600">
            Vergleichen Sie beide Varianten direkt miteinander
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8">
            <ComparisonQuestionnaire
              responses={responses}
              onChange={setResponses}
            />

            <div className="mt-8 flex justify-center">
              <Button 
                onClick={handleComplete}
                className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-3 px-8"
              >
                Studie abschließen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CompletionStep({ studyData, timingData }: {
  studyData: StudyData,
  timingData: TimingData
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            🎉 Studie erfolgreich abgeschlossen!
          </h1>
          <p className="text-xl text-gray-600">
            Vielen Dank für Ihre Teilnahme an der FormularIQ Studie
          </p>
        </div>

        <Card className="shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Ihre Teilnahme-ID:
                </h3>
                <code className="bg-gray-100 px-4 py-2 rounded text-lg font-mono">
                  {studyData.participantId}
                </code>
              </div>

              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-semibold text-blue-800">Getestete Varianten</h4>
                  <p>{studyData.variantA ? '✅' : '❌'} Variante A (Sichtbares Formular)</p>
                  <p>{studyData.variantB ? '✅' : '❌'} Variante B (Dialog-System)</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <h4 className="font-semibold text-green-800">Studiendauer</h4>
                  <p>{Math.round((timingData.totalDuration || 0) / 60000)} Minuten</p>
                </div>
              </div>

              <div className="bg-yellow-50 p-6 rounded border-l-4 border-yellow-400">
                <h4 className="font-semibold text-yellow-800 mb-2">Wichtig für die Forschung</h4>
                <p className="text-yellow-700 text-sm">
                  Ihre Daten wurden anonymisiert gespeichert und tragen zur Verbesserung 
                  von benutzerfreundlichen Formular-Systemen bei. 
                </p>
              </div>

              <div className="pt-4">
                <p className="text-gray-600 mb-4">
                  HAW Hamburg • Fakultät Technik und Informatik<br/>
                  Masterarbeit: Moritz Treu • 2025
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}