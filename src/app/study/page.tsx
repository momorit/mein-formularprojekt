'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface StudyData {
  participantId: string
  startTime: Date
  randomization: 'A-B' | 'B-A'
  demographics?: {
    age: string
    education: string
    experience: string
  }
  variantAData?: any
  variantBData?: any
  comparisonData?: any
}

export default function StudyPage() {
  const router = useRouter()
  const [step, setStep] = useState<'demographics' | 'variant1' | 'survey1' | 'variant2' | 'survey2' | 'complete'>('demographics')
  const [studyData, setStudyData] = useState<StudyData>(() => ({
    participantId: generateParticipantId(),
    startTime: new Date(),
    randomization: Math.random() > 0.5 ? 'A-B' : 'B-A'
  }))

  function generateParticipantId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P_${timestamp}_${random}`.toUpperCase()
  }

  const getFirstVariant = () => studyData.randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => studyData.randomization === 'A-B' ? 'B' : 'A'

  const handleDemographicsComplete = (demographics: any) => {
    setStudyData(prev => ({ ...prev, demographics }))
    setStep('variant1')
  }

  const handleVariant1Complete = (data: any) => {
    const variantType = getFirstVariant()
    setStudyData(prev => ({
      ...prev,
      [variantType === 'A' ? 'variantAData' : 'variantBData']: data
    }))
    setStep('survey1')
  }

  const handleSurvey1Complete = (surveyData: any) => {
    // Survey data bereits in variant data integriert
    setStep('variant2')
  }

  const handleVariant2Complete = (data: any) => {
    const variantType = getSecondVariant()
    setStudyData(prev => ({
      ...prev,
      [variantType === 'A' ? 'variantAData' : 'variantBData']: data
    }))
    setStep('survey2')
  }

  const handleSurvey2Complete = (surveyData: any) => {
    setStep('complete')
    saveCompleteStudy()
  }

  const saveCompleteStudy = async () => {
    try {
      const response = await fetch('/api/study/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...studyData,
          completedAt: new Date(),
          totalDuration: new Date().getTime() - studyData.startTime.getTime()
        })
      })
      
      if (response.ok) {
        console.log('✅ Study data saved successfully')
      }
    } catch (error) {
      console.error('❌ Failed to save study data:', error)
    }
  }

  // Demographics Component
  const DemographicsForm = () => {
    const [demographics, setDemographics] = useState({
      age: '',
      education: '',
      experience: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      handleDemographicsComplete(demographics)
    }

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Demografische Angaben</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Altersgruppe
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
              Höchster Bildungsabschluss
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
              Erfahrung mit digitalen Formularen
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

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Weiter zur ersten Variante
          </button>
        </form>
      </div>
    )
  }

  // Variant Instructions Component
  const VariantInstructions = ({ variant, isFirst }: { variant: 'A' | 'B', isFirst: boolean }) => {
    const handleStart = () => {
      if (variant === 'A') {
        router.push('/form-a?study=true&step=' + (isFirst ? '1' : '2'))
      } else {
        router.push('/form-b?study=true&step=' + (isFirst ? '1' : '2'))
      }
    }

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          {isFirst ? 'Erste' : 'Zweite'} Variante: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
        </h2>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">
            {variant === 'A' ? '📋 Sichtbares Formular' : '💬 Dialog-System'}
          </h3>
          <p className="text-blue-700">
            {variant === 'A' 
              ? 'Sie sehen alle Formularfelder auf einmal und können bei Bedarf einen Chat-Assistenten um Hilfe bitten.'
              : 'Ein KI-Assistent führt Sie Schritt für Schritt durch einen Dialog und stellt Ihnen nacheinander Fragen.'
            }
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <h4 className="font-semibold">Aufgabe:</h4>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Füllen Sie ein Formular für Gebäude-Energieberatung aus</li>
            <li>Nutzen Sie die verfügbaren Hilfe-Funktionen wenn nötig</li>
            <li>Nehmen Sie sich die Zeit, die Sie benötigen</li>
            <li>Am Ende folgt ein kurzer Fragebogen zu Ihrer Erfahrung</li>
          </ul>
        </div>

        <button 
          onClick={handleStart}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 transition-colors font-medium"
        >
          Variante {variant} starten
        </button>
      </div>
    )
  }

  // Survey Component
  const SurveyForm = ({ variant, isFirst }: { variant: 'A' | 'B', isFirst: boolean }) => {
    const [ratings, setRatings] = useState({
      usability: '',
      satisfaction: '',
      efficiency: '',
      comments: ''
    })

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if (isFirst) {
        handleSurvey1Complete(ratings)
      } else {
        handleSurvey2Complete(ratings)
      }
    }

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Bewertung: Variante {variant}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wie bewerten Sie die Benutzerfreundlichkeit?
            </label>
            <select 
              required
              value={ratings.usability}
              onChange={(e) => setRatings(prev => ({ ...prev, usability: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen</option>
              <option value="1">1 - Sehr schlecht</option>
              <option value="2">2 - Schlecht</option>
              <option value="3">3 - Neutral</option>
              <option value="4">4 - Gut</option>
              <option value="5">5 - Sehr gut</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wie zufrieden waren Sie mit dieser Variante?
            </label>
            <select 
              required
              value={ratings.satisfaction}
              onChange={(e) => setRatings(prev => ({ ...prev, satisfaction: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen</option>
              <option value="1">1 - Sehr unzufrieden</option>
              <option value="2">2 - Unzufrieden</option>
              <option value="3">3 - Neutral</option>
              <option value="4">4 - Zufrieden</option>
              <option value="5">5 - Sehr zufrieden</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wie effizient konnten Sie die Aufgabe erledigen?
            </label>
            <select 
              required
              value={ratings.efficiency}
              onChange={(e) => setRatings(prev => ({ ...prev, efficiency: e.target.value }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Bitte wählen</option>
              <option value="1">1 - Sehr ineffizient</option>
              <option value="2">2 - Ineffizient</option>
              <option value="3">3 - Neutral</option>
              <option value="4">4 - Effizient</option>
              <option value="5">5 - Sehr effizient</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weitere Kommentare (optional)
            </label>
            <textarea 
              value={ratings.comments}
              onChange={(e) => setRatings(prev => ({ ...prev, comments: e.target.value }))}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Was hat Ihnen gefallen oder nicht gefallen?"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            {isFirst ? 'Zur zweiten Variante' : 'Studie abschließen'}
          </button>
        </form>
      </div>
    )
  }

  // Completion Component
  const StudyComplete = () => (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <h2 className="text-3xl font-bold text-green-600 mb-4">🎉 Studie abgeschlossen!</h2>
      <p className="text-lg text-gray-700 mb-6">
        Vielen Dank für Ihre Teilnahme an unserer Forschungsstudie. 
        Ihre Daten wurden erfolgreich und anonymisiert gespeichert.
      </p>
      <div className="bg-green-50 p-4 rounded-lg">
        <p className="text-green-800">
          Ihre Teilnehmer-ID: <strong>{studyData.participantId}</strong>
        </p>
      </div>
    </div>
  )

  // Progress Bar
  const ProgressBar = () => {
    const steps = ['demographics', 'variant1', 'survey1', 'variant2', 'survey2', 'complete']
    const currentIndex = steps.indexOf(step)
    const progress = (currentIndex / (steps.length - 1)) * 100

    return (
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Demografisch</span>
          <span>Variante 1</span>
          <span>Bewertung 1</span>
          <span>Variante 2</span>
          <span>Bewertung 2</span>
          <span>Fertig</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">FormularIQ Studie</h1>
          <p className="text-gray-600">Teilnehmer-ID: {studyData.participantId}</p>
        </div>

        <ProgressBar />

        {step === 'demographics' && <DemographicsForm />}
        {step === 'variant1' && <VariantInstructions variant={getFirstVariant()} isFirst={true} />}
        {step === 'survey1' && <SurveyForm variant={getFirstVariant()} isFirst={true} />}
        {step === 'variant2' && <VariantInstructions variant={getSecondVariant()} isFirst={false} />}
        {step === 'survey2' && <SurveyForm variant={getSecondVariant()} isFirst={false} />}
        {step === 'complete' && <StudyComplete />}
      </div>
    </div>
  )
}