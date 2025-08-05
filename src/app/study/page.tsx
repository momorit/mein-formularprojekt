"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// Study Flow Management
type StudyStep = 
  | 'welcome'
  | 'demographics' 
  | 'briefing'
  | 'variant-a'
  | 'questionnaire-a'
  | 'variant-b'
  | 'questionnaire-b'
  | 'comparison'
  | 'results'

interface StudyData {
  participantId: string
  randomization: 'A-B' | 'B-A'  // Randomized order
  startTime: Date
  currentStep: StudyStep
  demographics: any
  variantAData: any
  variantBData: any
  questionnaireA: any
  questionnaireB: any
  comparison: any
}

export default function StudyRouter() {
  const router = useRouter()
  const [studyData, setStudyData] = useState<StudyData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize or restore study session
    const existingStudy = localStorage.getItem('formulariq-study')
    
    if (existingStudy) {
      setStudyData(JSON.parse(existingStudy))
    } else {
      // Create new study session
      const newStudy: StudyData = {
        participantId: generateParticipantId(),
        randomization: Math.random() < 0.5 ? 'A-B' : 'B-A', // 50/50 randomization
        startTime: new Date(),
        currentStep: 'welcome',
        demographics: null,
        variantAData: null,
        variantBData: null,
        questionnaireA: null,
        questionnaireB: null,
        comparison: null
      }
      
      setStudyData(newStudy)
      localStorage.setItem('formulariq-study', JSON.stringify(newStudy))
    }
    
    setLoading(false)
  }, [])

  const generateParticipantId = () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P-${timestamp}-${random}`.toUpperCase()
  }

  const updateStudyData = (updates: Partial<StudyData>) => {
    if (!studyData) return
    
    const updated = { ...studyData, ...updates }
    setStudyData(updated)
    localStorage.setItem('formulariq-study', JSON.stringify(updated))
  }

  const proceedToStep = (step: StudyStep) => {
    updateStudyData({ currentStep: step })
  }

  const resetStudy = () => {
    localStorage.removeItem('formulariq-study')
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Studie wird geladen...</p>
        </div>
      </div>
    )
  }

  if (!studyData) return null

  // Route to appropriate component based on current step
  switch (studyData.currentStep) {
    case 'welcome':
      return <WelcomeStep studyData={studyData} onProceed={() => proceedToStep('demographics')} />
    
    case 'demographics':
      return <DemographicsStep 
        studyData={studyData} 
        onComplete={(data) => {
          updateStudyData({ demographics: data })
          proceedToStep('briefing')
        }} 
      />
    
    case 'briefing':
      return <BriefingStep 
        studyData={studyData} 
        onProceed={() => {
          const firstVariant = studyData.randomization === 'A-B' ? 'variant-a' : 'variant-b'
          proceedToStep(firstVariant)
        }} 
      />
    
    case 'variant-a':
      return <VariantAStep 
        studyData={studyData}
        questionSet={studyData.randomization === 'A-B' ? 'SET-A' : 'SET-B'}
        onComplete={(data) => {
          updateStudyData({ variantAData: data })
          proceedToStep('questionnaire-a')
        }}
      />
    
    case 'questionnaire-a':
      return <QuestionnaireStep
        variant="A"
        studyData={studyData}
        onComplete={(data) => {
          updateStudyData({ questionnaireA: data })
          proceedToStep('variant-b')
        }}
      />
    
    case 'variant-b':
      return <VariantBStep 
        studyData={studyData}
        questionSet={studyData.randomization === 'A-B' ? 'SET-B' : 'SET-A'}
        onComplete={(data) => {
          updateStudyData({ variantBData: data })
          proceedToStep('questionnaire-b')
        }}
      />
    
    case 'questionnaire-b':
      return <QuestionnaireStep
        variant="B"
        studyData={studyData}
        onComplete={(data) => {
          updateStudyData({ questionnaireB: data })
          proceedToStep('comparison')
        }}
      />
    
    case 'comparison':
      return <ComparisonStep
        studyData={studyData}
        onComplete={(data) => {
          updateStudyData({ comparison: data })
          proceedToStep('results')
        }}
      />
    
    case 'results':
      return <ResultsStep studyData={studyData} onReset={resetStudy} />
    
    default:
      return <div>Unbekannter Schritt</div>
  }
}

// Welcome Step Component
function WelcomeStep({ studyData, onProceed }: { studyData: StudyData, onProceed: () => void }) {
  const [consent, setConsent] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              FormularIQ Nutzerstudie
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Helfen Sie uns, digitale Formulare zu verbessern!
            </p>
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
                  <p>• <strong>Verwendung:</strong> Nur für wissenschaftliche Zwecke (Masterarbeit HAW Hamburg)</p>
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
    </div>
  )
}

// Demographics Step Component (ersetze die Placeholder-Funktion)
function DemographicsStep({ studyData, onComplete }: { studyData: StudyData, onComplete: (data: any) => void }) {
  const [formData, setFormData] = useState({
    age: '',
    role: '',
    experience: '',
    techAffinity: 3,
    formularFrequency: '',
    device: '',
    browser: navigator.userAgent.includes('Chrome') ? 'Chrome' : 
             navigator.userAgent.includes('Firefox') ? 'Firefox' : 
             navigator.userAgent.includes('Safari') ? 'Safari' : 'Other'
  })

  const handleSubmit = () => {
    if (!formData.age || !formData.role || !formData.experience || !formData.formularFrequency) {
      alert('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }
    
    const demographics = {
      ...formData,
      timestamp: new Date(),
      userAgent: navigator.userAgent
    }
    
    onComplete(demographics)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span className="bg-blue-600 text-white px-2 py-1 rounded mr-2">2</span>
              Schritt 2 von 8: Demografische Angaben
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">📊 Angaben zu Ihrer Person</CardTitle>
              <p className="text-gray-600">
                Diese Informationen helfen uns, die Ergebnisse besser zu verstehen. 
                Alle Angaben bleiben anonym.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altersgruppe *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {['18-29', '30-39', '40-49', '50-59', '60+'].map(age => (
                    <label key={age} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="age"
                        value={age}
                        checked={formData.age === age}
                        onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="text-sm">{age}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ihre Rolle im Immobilienbereich *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { value: 'vermieter', label: 'Vermieter/in' },
                    { value: 'verwalter', label: 'Immobilienverwalter/in' },
                    { value: 'mieter', label: 'Mieter/in' },
                    { value: 'sonstige', label: 'Sonstige' }
                  ].map(role => (
                    <label key={role.value} className="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="role"
                        value={role.value}
                        checked={formData.role === role.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                        className="mr-3"
                      />
                      <span className="text-sm">{role.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Immobilien-Erfahrung *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { value: '<1', label: 'Weniger als 1 Jahr' },
                    { value: '1-5', label: '1-5 Jahre' },
                    { value: '5-15', label: '5-15 Jahre' },
                    { value: '>15', label: 'Mehr als 15 Jahre' }
                  ].map(exp => (
                    <label key={exp.value} className="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="experience"
                        value={exp.value}
                        checked={formData.experience === exp.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                        className="mr-3"
                      />
                      <span className="text-sm">{exp.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Tech Affinity Slider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Technische Affinität
                </label>
                <div className="px-3">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={formData.techAffinity}
                    onChange={(e) => setFormData(prev => ({ ...prev, techAffinity: parseInt(e.target.value) }))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Gar nicht (1)</span>
                    <span className="font-medium">Aktuell: {formData.techAffinity}</span>
                    <span>Sehr (5)</span>
                  </div>
                </div>
              </div>

              {/* Formular Frequency */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Wie oft füllen Sie Formulare aus? *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    { value: 'täglich', label: 'Täglich' },
                    { value: 'wöchentlich', label: 'Wöchentlich' },
                    { value: 'monatlich', label: 'Monatlich' },
                    { value: 'selten', label: 'Selten' }
                  ].map(freq => (
                    <label key={freq.value} className="flex items-center cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                      <input
                        type="radio"
                        name="formularFrequency"
                        value={freq.value}
                        checked={formData.formularFrequency === freq.value}
                        onChange={(e) => setFormData(prev => ({ ...prev, formularFrequency: e.target.value }))}
                        className="mr-3"
                      />
                      <span className="text-sm">{freq.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Device Detection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">📱 Technische Informationen</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p><strong>Gerät:</strong> {/Mobile|Tablet/.test(navigator.userAgent) ? 'Mobil/Tablet' : 'Desktop/Laptop'}</p>
                  <p><strong>Browser:</strong> {formData.browser}</strong></p>
                  <p><strong>Teilnehmer-ID:</strong> {studyData.participantId}</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="text-center pt-6">
                <Button
                  onClick={handleSubmit}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  ➡️ Weiter zum Szenario
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Briefing Step Component (ersetze die Placeholder-Funktion)
function BriefingStep({ studyData, onProceed }: { studyData: StudyData, onProceed: () => void }) {
  const [readComplete, setReadComplete] = useState(false)

  const firstVariant = studyData.randomization === 'A-B' ? 'A' : 'B'
  const firstVariantName = firstVariant === 'A' ? 'Sichtbares Formular' : 'Dialog-basiert'

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <span className="bg-blue-600 text-white px-2 py-1 rounded mr-2">3</span>
              Schritt 3 von 8: Szenario-Briefing
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '37.5%' }}></div>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900">🏠 Ihr Szenario</CardTitle>
              <p className="text-gray-600">
                Lesen Sie die folgende Situation aufmerksam durch. Sie werden gleich ein 
                Formular zu diesem Gebäude ausfüllen.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Scenario */}
              <div className="bg-blue-50 rounded-lg p-6 border-l-4 border-blue-500">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">
                  📋 Situationsbeschreibung
                </h3>
                
                <div className="space-y-4 text-gray-800">
                  <p>
                    Sie sind <strong>Eigentümer eines Mehrfamilienhauses in Hamburg-Stadtrand</strong> und 
                    planen eine <strong>energetische Sanierung</strong>. Ein Energieberater hat Ihnen erste 
                    Empfehlungen gegeben, aber Sie müssen noch einige Details für die Förderanträge klären.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🏢 Ihr Gebäude:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Baujahr:</strong> 1965 (Rotklinkerfassade)</li>
                        <li>• <strong>Typ:</strong> Mehrfamilienhaus mit 10 Wohneinheiten</li>
                        <li>• <strong>Stockwerke:</strong> 3 Etagen + ausgebautes Dachgeschoss</li>
                        <li>• <strong>Wohnfläche:</strong> 634 m² gesamt</li>
                        <li>• <strong>Heizung:</strong> Alte Ölheizung im Keller</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">🔧 Geplante Sanierung:</h4>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Fassadendämmung</strong> mit Mineralwolle (140mm WDVS)</li>
                        <li>• <strong>Eingangsfassade:</strong> Spaltklinkerverkleidung</li>
                        <li>• <strong>Hoffassade:</strong> Weiß verputzt</li>
                        <li>• <strong>Eventuell:</strong> Neue Heizungsanlage</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <h4 className="font-semibold text-yellow-900 mb-2">❓ Was Sie NICHT genau wissen:</h4>
                    <ul className="text-sm text-yellow-800 space-y-1">
                      <li>• <strong>Genaue Fassadenflächen</strong> - Der Energieberater meinte "ca. 345m² vorn, 182m² hinten"</li>
                      <li>• <strong>U-Wert Details</strong> - Er erwähnte "1,7 W/m²K aktuell", aber für welche Fassaden?</li>
                      <li>• <strong>Heizungsmodernisierung</strong> - Noch unklar ob Wärmepumpe, Gas oder bei Öl bleiben</li>
                      <li>• <strong>Dachgeschoss-Status</strong> - Teilweise ausgebaut, aber wie genau zählt das?</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Task Description */}
              <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
                <h3 className="text-lg font-semibold text-green-900 mb-3">🎯 Ihre Aufgabe</h3>
                <p className="text-green-800">
                  <strong>Füllen Sie das Gebäudeformular aus</strong>, um eine erste Kosteneinschätzung 
                  und Förderberatung zu erhalten. Bei unsicheren Angaben verwenden Sie die bereitgestellten 
                  Informationen als Anhaltspunkt - Sie müssen teilweise <strong>schätzen oder nachfragen</strong>.
                </p>
                <p className="text-green-700 text-sm mt-2">
                  💡 <em>Hinweis: Es gibt "Weiß ich nicht" und "Müsste ich nachschlagen" Optionen bei schwierigeren Fragen.</em>
                </p>
              </div>

              {/* Next Steps */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">📋 Nächste Schritte</h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>1. Sie werden <strong>Variante {firstVariant} ({firstVariantName})</strong> testen</p>
                  <p>2. Kurzer Fragebogen zu dieser Variante</p>
                  <p>3. Variante {studyData.randomization === 'A-B' ? 'B' : 'A'} testen</p>
                  <p>4. Fragebogen und Vergleich</p>
                </div>
              </div>

              {/* Confirmation */}
              <div className="border border-gray-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={readComplete}
                    onChange={(e) => setReadComplete(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    Ich habe das Szenario gelesen und verstanden. Ich bin bereit, 
                    das Formular als Eigentümer des beschriebenen Gebäudes auszufüllen.
                  </span>
                </label>
              </div>

              {/* Start Button */}
              <div className="text-center pt-6">
                <Button
                  onClick={onProceed}
                  disabled={!readComplete}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  🚀 Variante {firstVariant} starten
                </Button>
                
                {!readComplete && (
                  <p className="text-sm text-gray-500 mt-2">
                    Bitte bestätigen Sie, dass Sie das Szenario gelesen haben.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}