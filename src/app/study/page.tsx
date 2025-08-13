'use client'

// src/app/study/page.tsx - VOLLSTÄNDIGE Study Page - SYNTAX KORRIGIERT

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Clock,
  User,
  FileText,
  MessageSquare,
  BarChart3,
  Trophy,
  ChevronDown,
  ChevronUp,
  Home,
  Save,
  Download
} from 'lucide-react'
import VariantA from '@/components/VariantA'
import VariantB from '@/components/VariantB'
import SUSQuestionnaire from '@/components/SUSQuestionnaire'
import ErrorBoundary from '@/components/ErrorBoundary'
import { 
  LoadingSpinner, 
  ProgressBar, 
  StudyTimer, 
  ConnectionStatus, 
  BackendStatus,
  LoadingOverlay,
  StepIndicator
} from '@/components/LoadingStates'

// Types
type StudyStep = 'welcome' | 'demographics' | 'first-variant' | 'first-sus' | 'second-variant' | 'second-sus' | 'comparison' | 'completion'

interface StudyData {
  participantId: string
  startTime: Date
  randomization: 'A-B' | 'B-A'
  demographics?: {
    age: string
    education: string
    tech_experience: string
    gender?: string
    profession?: string
  }
  variantAData?: any
  variantBData?: any
  variantASUS?: any
  variantBSUS?: any
  comparisonData?: {
    speed: 'A' | 'B' | 'equal'
    understandability: 'A' | 'B' | 'equal'
    pleasantness: 'A' | 'B' | 'equal'
    helpfulness: 'A' | 'B' | 'equal'
    future_preference: 'A_strong' | 'A_slight' | 'neutral' | 'B_slight' | 'B_strong'
    comments?: string
    completedAt: Date
  }
  completedAt?: Date
  totalDuration?: number
}

// Scenario Component
function ScenarioDisplay({ 
  variant, 
  isExpanded = true,
  onToggle 
}: { 
  variant?: 'A' | 'B'
  isExpanded?: boolean
  onToggle?: () => void
}) {
  const scenarioText = `
**Szenario: Gebäude-Energieberatung**

Sie sind Eigentümer eines Mehrfamilienhauses und möchten eine staatliche Förderung für eine energetische Sanierung beantragen.

Dafür müssen Sie ein umfangreiches Formular ausfüllen, das detaillierte Informationen zu Ihrem Gebäude erfordert:

• **Gebäudedaten:** Baujahr, Wohnfläche, Anzahl Stockwerke
• **Energetische Details:** Heizungsart, Dämmung, Fenstertypen
• **Technische Angaben:** U-Werte, Energieverbrauch, bauliche Besonderheiten
• **Rechtliche Informationen:** Eigentümerdaten, Nutzungsart

**Ihre Aufgabe:** Füllen Sie das Formular so vollständig und korrekt wie möglich aus. Bei Unsicherheiten können Sie jederzeit nachfragen.
`

  const formatScenarioText = (text: string) => {
    return text.split('\n').map((line, index) => {
      line = line.trim()
      if (!line) return null
      
      if (line.startsWith('**') && line.endsWith('**')) {
        return (
          <h3 key={index} className="font-bold text-blue-900 mt-4 mb-2 first:mt-0">
            {line.replace(/\*\*/g, '')}
          </h3>
        )
      }
      
      if (line.startsWith('• ')) {
        const content = line.substring(2)
        const [boldPart, ...rest] = content.split(':')
        return (
          <li key={index} className="text-gray-700 mb-1 ml-4 list-disc">
            <strong className="text-gray-900">{boldPart}:</strong>
            {rest.join(':')}
          </li>
        )
      }
      
      if (line.length > 10) {
        return (
          <p key={index} className="text-gray-700 mb-3">
            {line}
          </p>
        )
      }
      
      return null
    }).filter(Boolean)
  }

  return (
    <div className="bg-blue-50 border-l-4 border-blue-400 mb-6">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-blue-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-200 rounded-full">
            <FileText className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-blue-900">
              Aufgabe: Förderantrag ausfüllen
              {variant && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded-full">
                  Variante {variant}
                </span>
              )}
            </h2>
            {!isExpanded && (
              <p className="text-sm text-blue-700">
                Gebäude-Energieberatung • Staatliche Förderung
              </p>
            )}
          </div>
        </div>
        
        <button className="text-blue-600 hover:text-blue-800 transition-colors">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
            <div className="prose prose-sm max-w-none">
              {formatScenarioText(scenarioText)}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Home className="w-4 h-4 mr-2" />
                Hilfreiche Gebäudedaten (Beispiel)
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                <div>
                  <strong>Baujahr:</strong> 1985<br/>
                  <strong>Wohnfläche:</strong> 420 m²<br/>
                  <strong>Stockwerke:</strong> 3 + Dachgeschoss
                </div>
                <div>
                  <strong>Heizung:</strong> Gas-Brennwert<br/>
                  <strong>Dämmung:</strong> Teilweise vorhanden<br/>
                  <strong>Fenster:</strong> Doppelverglasung
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Navigation Component
function StudyNavigation({ 
  currentStep, 
  studyData, 
  onNavigate,
  onSave
}: {
  currentStep: StudyStep
  studyData: StudyData
  onNavigate: (step: StudyStep) => void
  onSave?: () => void
}) {
  const getFirstVariant = () => studyData.randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => studyData.randomization === 'A-B' ? 'B' : 'A'

  const steps = [
    { id: 'welcome', title: 'Start', icon: User, completed: currentStep !== 'welcome' },
    { id: 'demographics', title: 'Daten', icon: User, completed: !!studyData.demographics },
    { id: 'first-variant', title: `Var ${getFirstVariant()}`, icon: getFirstVariant() === 'A' ? FileText : MessageSquare, completed: !!(studyData.variantAData || studyData.variantBData) },
    { id: 'first-sus', title: `SUS ${getFirstVariant()}`, icon: BarChart3, completed: !!(studyData.variantASUS || studyData.variantBSUS) },
    { id: 'second-variant', title: `Var ${getSecondVariant()}`, icon: getSecondVariant() === 'A' ? FileText : MessageSquare, completed: !!(studyData.variantAData && studyData.variantBData) },
    { id: 'second-sus', title: `SUS ${getSecondVariant()}`, icon: BarChart3, completed: !!(studyData.variantASUS && studyData.variantBSUS) },
    { id: 'comparison', title: 'Vergleich', icon: BarChart3, completed: !!studyData.comparisonData },
    { id: 'completion', title: 'Ende', icon: Trophy, completed: false }
  ]

  const currentIndex = steps.findIndex(step => step.id === currentStep)
  const progress = Math.round(((currentIndex + 1) / steps.length) * 100)

  const canGoNext = () => {
    switch (currentStep) {
      case 'welcome': return true
      case 'demographics': return !!studyData.demographics
      case 'first-variant': return !!(studyData.variantAData || studyData.variantBData)
      case 'first-sus': return !!(studyData.variantASUS || studyData.variantBSUS)
      case 'second-variant': return !!(studyData.variantAData && studyData.variantBData)
      case 'second-sus': return !!(studyData.variantASUS && studyData.variantBSUS)
      case 'comparison': return !!studyData.comparisonData
      default: return false
    }
  }

  const getNextStep = (): StudyStep | null => {
    const nextIndex = currentIndex + 1
    return nextIndex < steps.length ? steps[nextIndex].id as StudyStep : null
  }

  const getPrevStep = (): StudyStep | null => {
    const prevIndex = currentIndex - 1
    return prevIndex >= 0 ? steps[prevIndex].id as StudyStep : null
  }

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      <ProgressBar 
        current={currentIndex + 1} 
        total={steps.length} 
        variant="blue"
        className="px-4 pt-2"
        showPercentage={false}
      />
      
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => {
            const prev = getPrevStep()
            if (prev) onNavigate(prev)
          }}
          disabled={currentIndex === 0}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            currentIndex === 0
              ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück</span>
        </button>

        <div className="flex-1 text-center">
          <div className="flex items-center justify-center space-x-2">
            {steps[currentIndex] && (
              <>
                {(() => {
                  const IconComponent = steps[currentIndex].icon
                  return <IconComponent className="w-5 h-5 text-blue-600" />
                })()}
                <span className="font-medium text-gray-900">
                  {steps[currentIndex].title}
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Schritt {currentIndex + 1} von {steps.length} • {progress}%
          </div>
        </div>

        <div className="flex space-x-2">
          {onSave && currentStep === 'completion' && (
            <button
              onClick={onSave}
              className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Speichern</span>
            </button>
          )}
          
          <button
            onClick={() => {
              const next = getNextStep()
              if (next && canGoNext()) onNavigate(next)
            }}
            disabled={!canGoNext() || !getNextStep()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
              canGoNext() && getNextStep()
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed'
            }`}
          >
            <span>Weiter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-2">
        <StepIndicator 
          steps={steps.map(step => ({
            id: step.id,
            title: step.title,
            completed: step.completed,
            current: step.id === currentStep
          }))}
        />
      </div>
    </div>
  )
}

// Main Study Component
export default function StudyPage() {
  // State
  const [currentStep, setCurrentStep] = useState<StudyStep>('welcome')
  const [studyData, setStudyData] = useState<StudyData>(() => ({
    participantId: generateParticipantId(),
    startTime: new Date(),
    randomization: Math.random() > 0.5 ? 'A-B' : 'B-A'
  }))
  
  const [backendStatus, setBackendStatus] = useState<'checking' | 'healthy' | 'error'>('checking')
  const [isLoading, setIsLoading] = useState(false)
  const [scenarioExpanded, setScenarioExpanded] = useState(true)

  // Helper functions
  function generateParticipantId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P_${timestamp}_${random}`.toUpperCase()
  }

  const getFirstVariant = () => studyData.randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => studyData.randomization === 'A-B' ? 'B' : 'A'

  // Backend Health Check
  useEffect(() => {
    checkBackendHealth()
  }, [])

  const checkBackendHealth = async () => {
    try {
      setBackendStatus('checking')
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mein-formularprojekt-production.up.railway.app'
      const response = await fetch(`${backendUrl}/health`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors'
      })

      if (response.ok) {
        setBackendStatus('healthy')
        console.log('✅ Backend Health Check successful')
      } else {
        setBackendStatus('error')
        console.warn('⚠️ Backend responded with error:', response.status)
      }
    } catch (error) {
      console.error('💥 Backend Health Check failed:', error)
      setBackendStatus('error')
    }
  }

  const saveStudyData = async () => {
    try {
      setIsLoading(true)
      
      const completeStudyData = {
        ...studyData,
        completedAt: new Date(),
        totalDuration: new Date().getTime() - studyData.startTime.getTime()
      }

      console.log('💾 Saving complete study data...')
      const response = await fetch('/api/study/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeStudyData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Study data save result:', result)
        
        if (result.storage_type === 'cloud_backup') {
          alert('🎉 Studie erfolgreich gespeichert!\n\nVielen Dank für Ihre Teilnahme. Ihre Daten wurden sicher in der Cloud gespeichert.')
        } else if (result.storage_type === 'local_backup' && result.download_data) {
          const dataStr = JSON.stringify(result.download_data, null, 2)
          const dataBlob = new Blob([dataStr], { type: 'application/json' })
          const url = URL.createObjectURL(dataBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = result.filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
          
          alert('📁 Cloud-Speicherung nicht verfügbar!\n\nIhre Daten wurden automatisch heruntergeladen. Bitte senden Sie die JSON-Datei an den Studienleiter.\n\nVielen Dank für Ihre Teilnahme!')
        } else {
          throw new Error('Unbekannter Speicher-Typ')
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
    } catch (error) {
      console.error('💥 Save failed:', error)
      
      try {
        const emergencyData = {
          ...studyData,
          completedAt: new Date(),
          totalDuration: new Date().getTime() - studyData.startTime.getTime(),
          note: 'Emergency save due to network error'
        }
        
        const dataStr = JSON.stringify(emergencyData, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `emergency_study_${studyData.participantId}_${Date.now()}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        alert('🚨 Notfall-Speicherung!\n\nDa die normale Speicherung fehlgeschlagen ist, wurden Ihre Daten als Notfall-Download gespeichert.\n\nBitte senden Sie diese Datei unbedingt an den Studienleiter!')
      } catch (emergencyError) {
        alert('❌ Kritischer Fehler!\n\nSpeichern fehlgeschlagen. Bitte kontaktieren Sie den Studienleiter und teilen Sie Ihre Teilnehmer-ID mit: ' + studyData.participantId)
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Step Components
  const WelcomeStep = () => (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          FormularIQ Usability-Studie
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Vergleich von LLM-gestützten Formularlösungen
        </p>
        
        <div className="mb-8 p-4 rounded-lg border">
          {backendStatus === 'checking' && (
            <div className="flex items-center justify-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Verbindung zum System wird geprüft...</span>
            </div>
          )}
          
          {backendStatus === 'healthy' && (
            <div className="flex items-center justify-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>System bereit • Cloud-Speicherung verfügbar</span>
            </div>
          )}
          
          {backendStatus === 'error' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span>Cloud-Verbindung nicht verfügbar</span>
              </div>
              <p className="text-xs text-gray-500">
                Die Studie wird mit lokaler Speicherung fortgesetzt
              </p>
              <button 
                onClick={checkBackendHealth}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Erneut versuchen
              </button>
            </div>
          )}
        </div>

        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Studienablauf</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full mx-auto mb-2 flex items-center justify-center font-bold">1</div>
              <h3 className="font-medium">Demografische Daten</h3>
              <p className="text-sm text-gray-600">Kurze Angaben zu Ihrer Person</p>
            </div>
            <div className="text-center p-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full mx-auto mb-2 flex items-center justify-center font-bold">2</div>
              <h3 className="font-medium">Variante {getFirstVariant()}</h3>
              <p className="text-sm text-gray-600">{getFirstVariant() === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}</p>
            </div>
            <div className="text-center p-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full mx-auto mb-2 flex items-center justify-center font-bold">3</div>
              <h3 className="font-medium">Variante {getSecondVariant()}</h3>
              <p className="text-sm text-gray-600">{getSecondVariant() === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}</p>
            </div>
            <div className="text-center p-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full mx-auto mb-2 flex items-center justify-center font-bold">4</div>
              <h3 className="font-medium">Vergleich & Abschluss</h3>
              <p className="text-sm text-gray-600">Bewertung der Varianten</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <strong>Teilnehmer-ID:</strong><br/>
                {studyData.participantId}
              </div>
              <div>
                <strong>Randomisierung:</strong><br/>
                {studyData.randomization}
              </div>
              <div>
                <strong>Geschätzte Dauer:</strong><br/>
                15-20 Minuten
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const DemographicsStep = () => {
    const [demographics, setDemographics] = useState(studyData.demographics || {
      age: '',
      education: '',
      tech_experience: '',
      gender: '',
      profession: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      const newErrors: Record<string, string> = {}
      
      if (!demographics.age || parseInt(demographics.age) < 18 || parseInt(demographics.age) > 100) {
        newErrors.age = 'Bitte geben Sie ein gültiges Alter zwischen 18 und 100 Jahren an'
      }
      if (!demographics.education) {
        newErrors.education = 'Bitte wählen Sie Ihren höchsten Bildungsabschluss'
      }
      if (!demographics.tech_experience) {
        newErrors.tech_experience = 'Bitte bewerten Sie Ihre Technik-Erfahrung'
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      setStudyData(prev => ({ ...prev, demographics }))
      setCurrentStep('first-variant')
    }

    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-6">Demografische Angaben</h2>
          <p className="text-gray-600 mb-6">
            Diese Angaben helfen uns bei der wissenschaftlichen Auswertung. Alle Daten werden anonymisiert behandelt.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alter *
              </label>
              <input
                type="number"
                min="18"
                max="100"
                value={demographics.age || ''}
                onChange={(e) => setDemographics(prev => ({ ...prev, age: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. 25"
              />
              {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geschlecht (optional)
              </label>
              <select
                value={demographics.gender || ''}
                onChange={(e) => setDemographics(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                value={demographics.education || ''}
                onChange={(e) => setDemographics(prev => ({ ...prev, education: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Bitte wählen</option>
                <option value="hauptschule">Hauptschulabschluss</option>
                <option value="realschule">Realschulabschluss</option>
                <option value="abitur">Abitur/Fachabitur</option>
                <option value="ausbildung">Berufsausbildung</option>
                <option value="bachelor">Bachelor</option>
                <option value="master">Master</option>
                <option value="phd">Promotion</option>
                <option value="other">Anderes</option>
              </select>
              {errors.education && <p className="text-red-500 text-sm mt-1">{errors.education}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beruflicher Bereich (optional)
              </label>
              <input
                type="text"
                value={demographics.profession || ''}
                onChange={(e) => setDemographics(prev => ({ ...prev, profession: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="z.B. IT, Bildung, Gesundheit, Verwaltung..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wie schätzen Sie Ihre Erfahrung mit digitalen Technologien ein? *
              </label>
              <div className="space-y-2">
                {[
                  { value: '1', label: 'Sehr gering - ich nutze Technologie selten' },
                  { value: '2', label: 'Gering - ich nutze nur grundlegende Funktionen' },
                  { value: '3', label: 'Mittel - ich komme gut mit den meisten Anwendungen zurecht' },
                  { value: '4', label: 'Hoch - ich nutze Technologie sehr häufig und vielseitig' },
                  { value: '5', label: 'Sehr hoch - ich bin ein Technik-Experte' }
                ].map(option => (
                  <label key={option.value} className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="tech_experience"
                      value={option.value}
                      checked={demographics.tech_experience === option.value}
                      onChange={(e) => setDemographics(prev => ({ ...prev, tech_experience: e.target.value }))}
                      className="mt-1 mr-3"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.tech_experience && <p className="text-red-500 text-sm mt-1">{errors.tech_experience}</p>}
            </div>

            <div className="pt-4 border-t">
              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                Weiter zur ersten Variante ({getFirstVariant()})
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  const FirstVariantStep = () => {
    const variant = getFirstVariant()
    const [variantStartTime] = useState(new Date())

    const handleVariantComplete = (variantData: any) => {
      if (variant === 'A') {
        setStudyData(prev => ({ ...prev, variantAData: variantData }))
      } else {
        setStudyData(prev => ({ ...prev, variantBData: variantData }))
      }
      setCurrentStep('first-sus')
    }

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ScenarioDisplay 
          variant={variant} 
          isExpanded={scenarioExpanded}
          onToggle={() => setScenarioExpanded(!scenarioExpanded)}
        />
        
        <div className="mt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">
              Variante {variant}: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h2>
            <p className="text-gray-600">
              {variant === 'A' 
                ? 'Füllen Sie das Formular aus. Bei Fragen nutzen Sie die Hilfe-Funktion.'
                : 'Beantworten Sie die Fragen im Dialog. Das System führt Sie durch das Formular.'
              }
            </p>
          </div>

          {variant === 'A' ? (
            <VariantA onComplete={handleVariantComplete} startTime={variantStartTime} />
          ) : (
            <VariantB onComplete={handleVariantComplete} startTime={variantStartTime} />
          )}
        </div>
      </div>
    )
  }

  const FirstSUSStep = () => {
    const variant = getFirstVariant()
    
    const handleSUSComplete = (susData: any) => {
      if (variant === 'A') {
        setStudyData(prev => ({ ...prev, variantASUS: susData }))
      } else {
        setStudyData(prev => ({ ...prev, variantBSUS: susData }))
      }
      setCurrentStep('second-variant')
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Bewertung - Variante {variant}
          </h2>
          <p className="text-gray-600">
            Bitte bewerten Sie Ihre Erfahrung mit Variante {variant} ({variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}).
          </p>
        </div>

        <SUSQuestionnaire 
          variant={variant}
          onComplete={handleSUSComplete}
        />
      </div>
    )
  }

  const SecondVariantStep = () => {
    const variant = getSecondVariant()
    const [variantStartTime] = useState(new Date())

    const handleVariantComplete = (variantData: any) => {
      if (variant === 'A') {
        setStudyData(prev => ({ ...prev, variantAData: variantData }))
      } else {
        setStudyData(prev => ({ ...prev, variantBData: variantData }))
      }
      setCurrentStep('second-sus')
    }

    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <ScenarioDisplay 
          variant={variant} 
          isExpanded={scenarioExpanded}
          onToggle={() => setScenarioExpanded(!scenarioExpanded)}
        />
        
        <div className="mt-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">
              Variante {variant}: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h2>
            <p className="text-gray-600">
              {variant === 'A' 
                ? 'Füllen Sie dasselbe Formular mit der anderen Methode aus.'
                : 'Beantworten Sie dieselben Fragen im Dialog-Format.'
              }
            </p>
            
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">📝 Kurze Pause</h3>
              <p className="text-sm text-yellow-700">
                Sie haben Variante {getFirstVariant()} abgeschlossen. 
                Nehmen Sie sich einen Moment Zeit, bevor Sie mit Variante {variant} beginnen. 
                Die Aufgabe ist dieselbe, nur die Bedienweise ist anders.
              </p>
            </div>
          </div>

          {variant === 'A' ? (
            <VariantA onComplete={handleVariantComplete} startTime={variantStartTime} />
          ) : (
            <VariantB onComplete={handleVariantComplete} startTime={variantStartTime} />
          )}
        </div>
      </div>
    )
  }

  const SecondSUSStep = () => {
    const variant = getSecondVariant()
    
    const handleSUSComplete = (susData: any) => {
      if (variant === 'A') {
        setStudyData(prev => ({ ...prev, variantASUS: susData }))
      } else {
        setStudyData(prev => ({ ...prev, variantBSUS: susData }))
      }
      setCurrentStep('comparison')
    }

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Bewertung - Variante {variant}
          </h2>
          <p className="text-gray-600">
            Bitte bewerten Sie nun auch Ihre Erfahrung mit Variante {variant} ({variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}).
          </p>
        </div>

        <SUSQuestionnaire 
          variant={variant}
          onComplete={handleSUSComplete}
        />
      </div>
    )
  }

  const ComparisonStep = () => {
    const [comparison, setComparison] = useState(studyData.comparisonData || {
      speed: undefined,
      understandability: undefined,
      pleasantness: undefined,
      helpfulness: undefined,
      future_preference: undefined,
      comments: ''
    })
    
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      
      const newErrors: Record<string, string> = {}
      
      if (!comparison.speed) newErrors.speed = 'Bitte bewerten Sie die Geschwindigkeit'
      if (!comparison.understandability) newErrors.understandability = 'Bitte bewerten Sie die Verständlichkeit'
      if (!comparison.pleasantness) newErrors.pleasantness = 'Bitte bewerten Sie die Bedienfreundlichkeit'
      if (!comparison.helpfulness) newErrors.helpfulness = 'Bitte bewerten Sie die Hilfsbereitschaft'
      if (!comparison.future_preference) newErrors.future_preference = 'Bitte geben Sie Ihre Präferenz an'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      const comparisonData = {
        speed: comparison.speed as 'A' | 'B' | 'equal',
        understandability: comparison.understandability as 'A' | 'B' | 'equal',
        pleasantness: comparison.pleasantness as 'A' | 'B' | 'equal',
        helpfulness: comparison.helpfulness as 'A' | 'B' | 'equal',
        future_preference: comparison.future_preference as 'A_strong' | 'A_slight' | 'neutral' | 'B_slight' | 'B_strong',
        comments: comparison.comments || '',
        completedAt: new Date()
      }
      
      setStudyData(prev => ({ ...prev, comparisonData }))
      setCurrentStep('completion')
    }

    const ComparisonQuestion = ({ 
      title, 
      name, 
      error 
    }: { 
      title: string
      name: keyof typeof comparison
      error?: string 
    }) => (
      <div className="space-y-3">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <div className="flex justify-center space-x-8">
          <label className="flex flex-col items-center cursor-pointer">
            <input
              type="radio"
              name={name}
              value="A"
              checked={comparison[name] === 'A'}
              onChange={(e) => setComparison(prev => ({ ...prev, [name]: e.target.value }))}
              className="mb-2"
            />
            <span className="text-sm font-medium">Variante A</span>
            <span className="text-xs text-gray-500">
              {getFirstVariant() === 'A' ? 'Formular' : 'Dialog'}
            </span>
          </label>
          
          <label className="flex flex-col items-center cursor-pointer">
            <input
              type="radio"
              name={name}
              value="equal"
              checked={comparison[name] === 'equal'}
              onChange={(e) => setComparison(prev => ({ ...prev, [name]: e.target.value }))}
              className="mb-2"
            />
            <span className="text-sm font-medium">Gleich gut</span>
          </label>
          
          <label className="flex flex-col items-center cursor-pointer">
            <input
              type="radio"
              name={name}
              value="B"
              checked={comparison[name] === 'B'}
              onChange={(e) => setComparison(prev => ({ ...prev, [name]: e.target.value }))}
              className="mb-2"
            />
            <span className="text-sm font-medium">Variante B</span>
            <span className="text-xs text-gray-500">
              {getSecondVariant() === 'A' ? 'Formular' : 'Dialog'}
            </span>
          </label>
        </div>
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </div>
    )

    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Vergleich der Varianten</h2>
          <p className="text-gray-600 mb-8 text-center">
            Bitte vergleichen Sie die beiden Varianten, die Sie gerade getestet haben.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            <ComparisonQuestion
              title="Welche Variante war schneller zu bedienen?"
              name="speed"
              error={errors.speed}
            />

            <ComparisonQuestion
              title="Welche Variante war verständlicher?"
              name="understandability"
              error={errors.understandability}
            />

            <ComparisonQuestion
              title="Welche Variante war angenehmer zu bedienen?"
              name="pleasantness"
              error={errors.pleasantness}
            />

            <ComparisonQuestion
              title="Welche Variante war hilfreicher?"
              name="helpfulness"
              error={errors.helpfulness}
            />

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">
                Welche Variante würden Sie in Zukunft bevorzugen?
              </h3>
              <div className="space-y-2">
                {[
                  { value: 'A_strong', label: 'Definitiv Variante A' },
                  { value: 'A_slight', label: 'Eher Variante A' },
                  { value: 'neutral', label: 'Mir ist es egal' },
                  { value: 'B_slight', label: 'Eher Variante B' },
                  { value: 'B_strong', label: 'Definitiv Variante B' }
                ].map(option => (
                  <label key={option.value} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="future_preference"
                      value={option.value}
                      checked={comparison.future_preference === option.value}
                      onChange={(e) => setComparison(prev => ({ 
                        ...prev, 
                        future_preference: e.target.value as any 
                      }))}
                      className="mr-3"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
              {errors.future_preference && (
                <p className="text-red-500 text-sm">{errors.future_preference}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zusätzliche Kommentare (optional)
              </label>
              <textarea
                value={comparison.comments || ''}
                onChange={(e) => setComparison(prev => ({ ...prev, comments: e.target.value }))}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Was ist Ihnen besonders aufgefallen? Haben Sie Verbesserungsvorschläge?"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Zum Abschluss
            </button>
          </form>
        </div>
      </div>
    )
  }

  const CompletionStep = () => {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Vielen Dank für Ihre Teilnahme!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Sie haben die FormularIQ Usability-Studie erfolgreich abgeschlossen.
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-green-900 mb-4">
              Ihre Daten im Überblick
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <strong>Teilnehmer-ID:</strong> {studyData.participantId}<br/>
                <strong>Studienzeit:</strong> {Math.round((Date.now() - studyData.startTime.getTime()) / 1000 / 60)} Minuten<br/>
                <strong>Randomisierung:</strong> {studyData.randomization}
              </div>
              <div className="text-left">
                <strong>Demografische Daten:</strong> {studyData.demographics ? '✅' : '❌'}<br/>
                <strong>Beide Varianten getestet:</strong> {(studyData.variantAData && studyData.variantBData) ? '✅' : '❌'}<br/>
                <strong>Vergleich ausgefüllt:</strong> {studyData.comparisonData ? '✅' : '❌'}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              Ihre Daten werden anonymisiert für wissenschaftliche Zwecke ausgewertet und tragen zur Verbesserung von 
              LLM-gestützten Formularlösungen bei.
            </p>

            {backendStatus === 'error' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Hinweis:</strong> Da die Cloud-Verbindung nicht verfügbar ist, 
                  werden Ihre Daten beim Speichern automatisch als Datei heruntergeladen.
                </p>
              </div>
            )}

            <button
              onClick={saveStudyData}
              disabled={isLoading}
              className={`inline-flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-colors ${
                isLoading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Speichere...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Studie abschließen und Daten speichern</span>
                </>
              )}
            </button>

            <div className="pt-4 border-t">
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Zurück zur Startseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep />
      case 'demographics':
        return <DemographicsStep />
      case 'first-variant':
        return <FirstVariantStep />
      case 'first-sus':
        return <FirstSUSStep />
      case 'second-variant':
        return <SecondVariantStep />
      case 'second-sus':
        return <SecondSUSStep />
      case 'comparison':
        return <ComparisonStep />
      case 'completion':
        return <CompletionStep />
      default:
        return <WelcomeStep />
    }
  }

  return (
    <ErrorBoundary participantId={studyData.participantId}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <StudyTimer startTime={studyData.startTime} />
              <ConnectionStatus />
              <BackendStatus status={backendStatus} url={process.env.NEXT_PUBLIC_BACKEND_URL} />
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>ID: {studyData.participantId}</span>
              <span>•</span>
              <span>{studyData.randomization}</span>
            </div>
          </div>
        </div>

        <LoadingOverlay isLoading={isLoading} text="Studie wird gespeichert...">
          <div className="container mx-auto min-h-screen pb-32">
            {renderCurrentStep()}
          </div>
        </LoadingOverlay>
        
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <StudyNavigation 
            currentStep={currentStep}
            studyData={studyData}
            onNavigate={setCurrentStep}
            onSave={saveStudyData}
          />
        </div>
      </div>
    </ErrorBoundary>
  )
}