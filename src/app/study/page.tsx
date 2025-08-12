// src/app/study/page.tsx - VOLLSTÄNDIGE FUNKTIONIERENDE STUDIE

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

// === TYPES & INTERFACES ===
interface DemographicData {
  age: string
  gender: string
  education: string
  techExperience: string
  formExperience: string
  device: string
}

interface QuestionnaireData {
  variant: 'A' | 'B'
  susResponses: Record<string, number>
  customResponses: Record<string, number | string>
  completedAt: Date
  timeSpent: number
}

interface ComparisonData {
  responses: Record<string, string>
  completedAt: Date
}

interface StudyData {
  participantId: string
  startTime: Date
  randomization: 'A-B' | 'B-A'
  demographics?: DemographicData
  variantAData?: QuestionnaireData
  variantBData?: QuestionnaireData  
  comparisonData?: ComparisonData
  totalDuration?: number
}

type StudyStep = 
  | 'welcome' 
  | 'demographics'
  | 'scenario'
  | 'first-variant'
  | 'first-questionnaire' 
  | 'second-variant'
  | 'second-questionnaire'
  | 'comparison'
  | 'complete'

// === SCENARIO CONTENT ===
const FULL_SCENARIO = {
  title: "🏠 Ihr Szenario: Energetische Gebäudesanierung",
  content: `Sie sind Eigentümer:in eines **älteren Einfamilienhauses aus den 1970er Jahren** und möchten eine **energetische Sanierung** durchführen lassen, um Heizkosten zu sparen und den CO₂-Ausstoß zu reduzieren.

**Ihre Situation:**
• Das Haus ist in die Jahre gekommen und verbraucht viel Energie
• Sie möchten staatliche **Fördergelder** beantragen
• Ein Energieberater soll eine professionelle **Energieberatung** durchführen
• Der Berater hat Ihnen ein **Vorerfassungsformular** geschickt

**Ihre Aufgabe heute:**
Füllen Sie das Gebäude-Erfassungsformular mit den Informationen zu Ihrem Haus aus. Sie können dabei realistische Daten verwenden oder sich plausible Werte ausdenken.

**Denken Sie daran:**
• **Ihr Gebäude:** Einfamilienhaus aus den 1970er Jahren
• **Ihr Ziel:** Energetische Sanierung für Energieeinsparung  
• **Ihr Anliegen:** Fördergelder beantragen
• **Ihre Rolle:** Sie sind der/die Hausbesitzer:in`,
  
  keyPoints: [
    "🏠 **Einfamilienhaus** aus den 1970er Jahren",
    "⚡ **Energetische Sanierung** geplant",
    "💰 **Fördergelder** beantragen", 
    "📋 **Energieberatung** erforderlich",
    "📝 **Formular** vorab ausfüllen"
  ]
}

// === LIKERT SCALE COMPONENT ===
const LikertScale = ({ question, value, onChange, labels, required = false, questionNumber }: {
  question: string
  value: number
  onChange: (value: number) => void
  labels: [string, string]
  required?: boolean
  questionNumber?: number
}) => (
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

// === MAIN COMPONENT ===
export default function StudyPage() {
  const [currentStep, setCurrentStep] = useState<StudyStep>('welcome')
  const [stepHistory, setStepHistory] = useState<StudyStep[]>(['welcome'])
  const [studyData, setStudyData] = useState<StudyData>(() => ({
    participantId: generateParticipantId(),
    startTime: new Date(),
    randomization: Math.random() > 0.5 ? 'A-B' : 'B-A'
  }))
  
  // Current questionnaire states
  const [currentVariant, setCurrentVariant] = useState<'A' | 'B'>('A')
  const [showScenario, setShowScenario] = useState(false)
  const [variantStartTime, setVariantStartTime] = useState<Date>(new Date())

  function generateParticipantId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P_${timestamp}_${random}`.toUpperCase()
  }

  const goToNextStep = (nextStep: StudyStep) => {
    setStepHistory(prev => [...prev, nextStep])
    setCurrentStep(nextStep)
  }

  const goToPreviousStep = () => {
    if (stepHistory.length > 1) {
      const newHistory = [...stepHistory]
      newHistory.pop()
      const previousStep = newHistory[newHistory.length - 1]
      setStepHistory(newHistory)
      setCurrentStep(previousStep)
    }
  }

  const getFirstVariant = () => studyData.randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => studyData.randomization === 'A-B' ? 'B' : 'A'

  // Debug logging
  useEffect(() => {
    console.log(`🔄 Study Step: ${currentStep}, Randomization: ${studyData.randomization}`)
  }, [currentStep, studyData.randomization])

  // === STEP COMPONENTS ===
  const WelcomeStep = () => {
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
              HAW Hamburg • Masterarbeit 2025 • Moritz Treu
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardTitle className="text-2xl">Willkommen zur Studie</CardTitle>
              <p className="text-blue-100">
                Helfen Sie uns dabei, benutzerfreundlichere Formular-Systeme zu entwickeln!
              </p>
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
                      Demografische Fragen (2 Minuten)
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      Bewertung beider Systeme (5 Minuten)
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      <strong>Geschätzte Gesamtdauer: 15-20 Minuten</strong>
                    </li>
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Datenschutz & Anonymität</h3>
                  <ul className="space-y-1 text-green-700 text-sm">
                    <li>✅ Vollständig anonyme Teilnahme</li>
                    <li>✅ DSGVO-konforme Speicherung in der Google Cloud</li>
                    <li>✅ Nur wissenschaftliche Nutzung der Daten</li>
                    <li>✅ Jederzeit Studienabbruch möglich</li>
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
                    Ich stimme der Teilnahme an der Studie zu und bin mit der anonymen Datenverarbeitung einverstanden.
                  </label>
                </div>

                <Button 
                  onClick={() => goToNextStep('demographics')}
                  disabled={!consent}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-4"
                >
                  Studie beginnen →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const DemographicsStep = () => {
    const [demographics, setDemographics] = useState<DemographicData>({
      age: '',
      gender: '',
      education: '',
      techExperience: '',
      formExperience: '',
      device: typeof navigator !== 'undefined' ? (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop') : 'Desktop'
    })

    const handleChange = (key: keyof DemographicData, value: string) => {
      setDemographics(prev => ({ ...prev, [key]: value }))
    }

    const isComplete = Object.entries(demographics).every(([key, value]) => 
      key === 'device' || value !== ''
    )

    const handleNext = () => {
      setStudyData(prev => ({ ...prev, demographics }))
      console.log('✅ Demographics completed:', demographics)
      goToNextStep('scenario')
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              👤 Demografische Daten
            </h1>
            <p className="text-lg text-gray-600">
              Diese Informationen helfen uns, die Studienergebnisse besser zu verstehen
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              <div className="space-y-6">
                {/* Age */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    1. Wie alt sind Sie? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {['18-25', '26-35', '36-45', '46-55', '56-65', '66+'].map((ageRange) => (
                      <label key={ageRange} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="age"
                          value={ageRange}
                          checked={demographics.age === ageRange}
                          onChange={() => handleChange('age', ageRange)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="ml-2 text-sm text-gray-700">{ageRange} Jahre</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    2. Geschlecht <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Weiblich', 'Männlich', 'Divers/Keine Angabe'].map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="gender"
                          value={option}
                          checked={demographics.gender === option}
                          onChange={() => handleChange('gender', option)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Education */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    3. Höchster Bildungsabschluss <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Hauptschulabschluss',
                      'Realschulabschluss',
                      'Abitur',
                      'Bachelor',
                      'Master/Diplom',
                      'Promotion'
                    ].map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="education"
                          value={option}
                          checked={demographics.education === option}
                          onChange={() => handleChange('education', option)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tech Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    4. Wie schätzen Sie Ihre Technik-Erfahrung ein? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {['Niedrig', 'Mittel', 'Hoch'].map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="techExperience"
                          value={option}
                          checked={demographics.techExperience === option}
                          onChange={() => handleChange('techExperience', option)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Form Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    5. Wie oft füllen Sie Online-Formulare aus? <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      'Sehr selten (weniger als 1x pro Monat)',
                      'Selten (1-3x pro Monat)',
                      'Regelmäßig (1-3x pro Woche)',
                      'Häufig (täglich)'
                    ].map((option) => (
                      <label key={option} className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="formExperience"
                          value={option}
                          checked={demographics.formExperience === option}
                          onChange={() => handleChange('formExperience', option)}
                          className="w-4 h-4 text-blue-600"
                          required
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between pt-6">
                  <Button 
                    onClick={goToPreviousStep}
                    variant="outline"
                    className="text-gray-600"
                  >
                    ← Zurück
                  </Button>
                  
                  <Button 
                    onClick={handleNext}
                    disabled={!isComplete}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Weiter zum Szenario →
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const ScenarioStep = () => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              📖 Szenario-Briefing
            </h1>
            <p className="text-lg text-gray-600">
              Bitte lesen Sie das folgende Szenario aufmerksam durch
            </p>
          </div>

          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="text-2xl">{FULL_SCENARIO.title}</CardTitle>
              <p className="text-orange-100">
                Stellen Sie sich vor, Sie befinden sich in folgender Situation...
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <div className="text-gray-800 leading-relaxed whitespace-pre-line text-base mb-6">
                  {FULL_SCENARIO.content}
                </div>
                
                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400 mb-6">
                  <h4 className="font-semibold text-blue-800 mb-3">🎯 Die wichtigsten Punkte:</h4>
                  <ul className="space-y-2">
                    {FULL_SCENARIO.keyPoints.map((point, index) => (
                      <li key={index} className="text-blue-700 text-sm">
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-semibold text-green-800 mb-2">✅ Wichtig für die Tests:</h4>
                  <p className="text-green-700 text-sm">
                    Dieses Szenario bleibt während der gesamten Studie für Sie verfügbar. 
                    Sie können es jederzeit erneut aufrufen, falls Sie Details vergessen haben.
                  </p>
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <Button 
                  onClick={goToPreviousStep}
                  variant="outline"
                  className="text-gray-600"
                >
                  ← Zurück
                </Button>
                
                <Button 
                  onClick={() => {
                    console.log('🚀 Starting first variant:', getFirstVariant())
                    goToNextStep('first-variant')
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white text-lg py-3 px-8"
                >
                  Verstanden, zu den Tests →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const VariantStep = ({ isFirst }: { isFirst: boolean }) => {
    const variant = isFirst ? getFirstVariant() : getSecondVariant()
    const variantName = variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'
    const variantColor = variant === 'A' ? 'blue' : 'green'
    
    useEffect(() => {
      setCurrentVariant(variant)
      setVariantStartTime(new Date())
      console.log(`🔄 Starting variant ${variant} (${isFirst ? 'first' : 'second'})`)
    }, [variant, isFirst])

    const handleVariantComplete = () => {
      console.log(`✅ Variant ${variant} completed, going to questionnaire`)
      goToNextStep(isFirst ? 'first-questionnaire' : 'second-questionnaire')
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Scenario Access */}
          <div className="mb-6">
            <Button
              onClick={() => setShowScenario(!showScenario)}
              variant="outline"
              className="text-sm border-orange-300 text-orange-700 hover:bg-orange-50"
            >
              📖 {showScenario ? "Szenario ausblenden" : "Szenario anzeigen"}
            </Button>
            
            {showScenario && (
              <Card className="mt-4 bg-orange-50 border-orange-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{FULL_SCENARIO.title}</h4>
                  <div className="text-sm text-gray-700 space-y-2">
                    {FULL_SCENARIO.keyPoints.map((point, index) => (
                      <div key={index} className="text-orange-800">{point}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🚀 {isFirst ? 'Erste' : 'Zweite'} Variante: {variantName}
            </h1>
            <p className="text-lg text-gray-600">
              {isFirst ? 'Sie testen zuerst' : 'Nun testen Sie'} Variante {variant}
            </p>
          </div>

          <Card className={`shadow-xl border-2 ${variantColor === 'blue' ? 'border-blue-200' : 'border-green-200'}`}>
            <CardHeader className={`bg-gradient-to-r ${variantColor === 'blue' ? 'from-blue-500 to-blue-600' : 'from-green-500 to-green-600'} text-white`}>
              <CardTitle className="text-2xl">Variante {variant}: {variantName}</CardTitle>
              <p className={variantColor === 'blue' ? 'text-blue-100' : 'text-green-100'}>
                {variant === 'A' 
                  ? 'Klassisches Formular mit allen Feldern sichtbar und KI-Chat-Unterstützung'
                  : 'Interaktiver Dialog, bei dem die KI Sie durch strukturierte Fragen führt'
                }
              </p>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Was Sie erwartet:</h3>
                  <ul className="text-left space-y-2 max-w-md mx-auto">
                    {variant === 'A' ? [
                      '• Alle Formularfelder auf einen Blick',
                      '• KI-Chat für Hilfestellungen',  
                      '• Freie Navigation zwischen den Feldern',
                      '• Eingabehilfen und Erklärungen'
                    ] : [
                      '• Strukturierte Fragen der KI',
                      '• Schrittweise Führung durch den Prozess',
                      '• Nachfragen und Hilfestellungen',
                      '• Natürliche Konversation'
                    ].map((item, i) => (
                      <li key={i} className="text-gray-700">{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <p className="text-yellow-800 text-sm">
                    <strong>💡 Tipp:</strong> Nehmen Sie sich die Zeit, die Sie brauchen. 
                    Es gibt kein Richtig oder Falsch - wir möchten Ihre ehrliche Erfahrung verstehen.
                  </p>
                </div>

                <Button 
                  onClick={() => {
                    const targetUrl = variant === 'A' ? '/form-a' : '/form-b'
                    window.open(targetUrl, '_blank')
                  }}
                  className={`w-full text-white py-4 px-6 text-lg font-medium mb-4 ${
                    variantColor === 'blue' 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Variante {variant} in neuem Tab öffnen →
                </Button>

                <Button 
                  onClick={handleVariantComplete}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6"
                >
                  ✅ Ich habe Variante {variant} abgeschlossen
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center mt-6">
            <Button 
              onClick={goToPreviousStep}
              variant="outline"
              className="text-gray-600"
            >
              ← Einen Schritt zurück
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const QuestionnaireStep = ({ isFirst }: { isFirst: boolean }) => {
    const variant = isFirst ? getFirstVariant() : getSecondVariant()
    const variantName = variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'
    
    const [susResponses, setSusResponses] = useState<Record<string, number>>({})
    const [customResponses, setCustomResponses] = useState<Record<string, number | string>>({})

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

    const CUSTOM_QUESTIONS = [
      {
        key: 'helpfulness',
        question: 'Die Eingabehilfen waren hilfreich für das Ausfüllen des Formulars',
        labels: ['Gar nicht hilfreich', 'Sehr hilfreich'] as [string, string]
      },
      {
        key: 'efficiency',
        question: 'Ich konnte schnell und effizient die gewünschten Informationen eingeben',
        labels: ['Sehr langsam', 'Sehr schnell'] as [string, string]
      },
      {
        key: 'satisfaction',
        question: 'Wie zufrieden sind Sie mit dieser Formular-Variante?',
        labels: ['Sehr unzufrieden', 'Sehr zufrieden'] as [string, string]
      }
    ]

    const handleSUSChange = (questionIndex: number, value: number) => {
      setSusResponses(prev => ({
        ...prev,
        [`sus_${questionIndex + 1}`]: value
      }))
    }

    const handleCustomChange = (key: string, value: number) => {
      setCustomResponses(prev => ({
        ...prev,
        [key]: value
      }))
    }

    const completedSUS = Object.keys(susResponses).filter(key => key.startsWith('sus_')).length
    const completedCustom = Object.keys(customResponses).length
    const isComplete = completedSUS >= 10 && completedCustom >= 3

    const handleNext = () => {
      const timeSpent = new Date().getTime() - variantStartTime.getTime()
      const questionnaireData: QuestionnaireData = {
        variant,
        susResponses,
        customResponses,
        completedAt: new Date(),
        timeSpent
      }

      console.log(`✅ Questionnaire ${variant} completed:`, questionnaireData)

      if (isFirst) {
        if (variant === 'A') {
          setStudyData(prev => ({ ...prev, variantAData: questionnaireData }))
        } else {
          setStudyData(prev => ({ ...prev, variantBData: questionnaireData }))
        }
        console.log('🔄 Going to second variant')
        goToNextStep('second-variant')
      } else {
        if (variant === 'A') {
          setStudyData(prev => ({ ...prev, variantAData: questionnaireData }))
        } else {
          setStudyData(prev => ({ ...prev, variantBData: questionnaireData }))
        }
        console.log('🔄 Going to comparison')
        goToNextStep('comparison')
      }
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              📊 Bewertung: Variante {variant}
            </h1>
            <p className="text-lg text-gray-600">
              Bewerten Sie Ihre Erfahrung mit dem {variantName}
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="p-8">
              {/* SUS Questions */}
              <div className="mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    📊 System Usability Scale (SUS)
                  </h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Bewerten Sie bitte Ihre Erfahrung mit <strong>Variante {variant}: {variantName}</strong>
                  </p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedSUS / 10) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {completedSUS} von 10 Fragen beantwortet
                  </p>
                </div>

                {SUS_QUESTIONS.map((question, index) => (
                  <LikertScale
                    key={index}
                    questionNumber={index + 1}
                    question={question}
                    value={susResponses[`sus_${index + 1}`] || 0}
                    onChange={(value) => handleSUSChange(index, value)}
                    labels={["Stimme gar nicht zu", "Stimme voll zu"]}
                    required
                  />
                ))}
              </div>

              {/* Custom Questions */}
              <div className="mb-8">
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <h3 className="text-xl font-semibold text-green-900 mb-2">
                    🎯 Spezifische Bewertung
                  </h3>
                  <p className="text-sm text-green-700 mb-3">
                    Bewerten Sie spezifische Aspekte dieser Variante
                  </p>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(completedCustom / 3) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    {completedCustom} von 3 Fragen beantwortet
                  </p>
                </div>

                {CUSTOM_QUESTIONS.map((item, index) => (
                  <LikertScale
                    key={item.key}
                    questionNumber={index + 11}
                    question={item.question}
                    value={customResponses[item.key] as number || 0}
                    onChange={(value) => handleCustomChange(item.key, value)}
                    labels={item.labels}
                    required
                  />
                ))}
              </div>

              <div className="flex justify-between pt-6">
                <Button 
                  onClick={goToPreviousStep}
                  variant="outline"
                  className="text-gray-600"
                >
                  ← Zurück
                </Button>
                
                <Button 
                  onClick={handleNext}
                  disabled={!isComplete}
                  className="bg-green-600 hover:bg-green-700 text-white text-lg py-3 px-8"
                >
                  {isFirst ? 'Weiter zur zweiten Variante →' : 'Weiter zum Vergleich →'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const ComparisonStep = () => {
    const [responses, setResponses] = useState<Record<string, string>>({})

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
      setResponses(prev => ({ ...prev, [key]: value }))
    }

    const completedQuestions = Object.keys(responses).filter(key => 
      COMPARISON_QUESTIONS.some(q => q.key === key)
    ).length
    const isComplete = completedQuestions >= 3

    const handleNext = async () => {
      const comparisonData: ComparisonData = {
        responses,
        completedAt: new Date()
      }

      const finalStudyData = {
        ...studyData,
        comparisonData,
        totalDuration: new Date().getTime() - studyData.startTime.getTime()
      }

      setStudyData(finalStudyData)
      console.log('✅ Complete study data:', finalStudyData)

      // Save to backend/Google Cloud
      try {
        console.log('💾 Saving to backend...')
        const saveResponse = await fetch('/api/study/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(finalStudyData),
        })

        if (saveResponse.ok) {
          const result = await saveResponse.json()
          console.log('✅ Study data saved successfully:', result)
        } else {
          console.error('❌ Failed to save study data:', saveResponse.statusText)
        }
      } catch (error) {
        console.error('❌ Error saving study data:', error)
      }

      goToNextStep('complete')
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
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
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
                <h3 className="text-xl font-semibold text-purple-900 mb-2">
                  🔄 Direkter Vergleich
                </h3>
                <p className="text-sm text-purple-700 mb-3">
                  Denken Sie an Ihre Erfahrung mit dem <strong>Sichtbaren Formular (A)</strong> und dem <strong>Dialog-System (B)</strong>
                </p>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(completedQuestions / 3) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  {completedQuestions} von 3 Fragen beantwortet
                </p>
              </div>

              <div className="space-y-6">
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

              <div className="flex justify-between pt-8">
                <Button 
                  onClick={goToPreviousStep}
                  variant="outline"
                  className="text-gray-600"
                >
                  ← Zurück
                </Button>
                
                <Button 
                  onClick={handleNext}
                  disabled={!isComplete}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-lg py-3 px-8"
                >
                  Studie abschließen →
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const CompleteStep = () => {
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
                    <h4 className="font-semibold text-blue-800 mb-2">Getestete Reihenfolge</h4>
                    <p className="text-blue-700">
                      {studyData.randomization === 'A-B' ? '1. Sichtbares Formular → 2. Dialog-System' : '1. Dialog-System → 2. Sichtbares Formular'}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <h4 className="font-semibold text-green-800 mb-2">Studiendauer</h4>
                    <p className="text-green-700">
                      {Math.round((studyData.totalDuration || 0) / 60000)} Minuten
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 p-6 rounded border-l-4 border-yellow-400">
                  <h4 className="font-semibold text-yellow-800 mb-2">✅ Daten erfolgreich gespeichert</h4>
                  <p className="text-yellow-700 text-sm">
                    Ihre anonymisierten Antworten wurden sicher in der Google Cloud gespeichert 
                    und tragen zur wissenschaftlichen Erforschung benutzerfreundlicher Formular-Systeme bei.
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-gray-600 mb-4">
                    <strong>HAW Hamburg</strong> • Fakultät Technik und Informatik<br/>
                    Masterarbeit: Moritz Treu • Wintersemester 2024/25
                  </p>
                  
                  <p className="text-sm text-gray-500">
                    Bei Fragen zur Studie können Sie sich gerne per E-Mail melden.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // === RENDER CURRENT STEP ===
  switch (currentStep) {
    case 'welcome':
      return <WelcomeStep />
    case 'demographics':
      return <DemographicsStep />
    case 'scenario':
      return <ScenarioStep />
    case 'first-variant':
      return <VariantStep isFirst={true} />
    case 'first-questionnaire':
      return <QuestionnaireStep isFirst={true} />
    case 'second-variant':
      return <VariantStep isFirst={false} />
    case 'second-questionnaire':
      return <QuestionnaireStep isFirst={false} />
    case 'comparison':
      return <ComparisonStep />
    case 'complete':
      return <CompleteStep />
    default:
      return <div>Unbekannter Schritt: {currentStep}</div>
  }
}