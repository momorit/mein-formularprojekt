// src/app/study/page.tsx - UPDATED: Masterarbeit → Forschungsprojekt + Suspense fix
'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Users, Clock, FileText, MessageSquare } from 'lucide-react'
import VariantA from '@/components/VariantA'
import VariantB from '@/components/VariantB'
import { EnhancedQuestionnaire } from '@/components/Questionnaire/EnhancedQuestionnaire'

// Separate component that uses useSearchParams
function StudyPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = searchParams.get('step') || 'intro'
  const participantId = searchParams.get('participant') || ''
  const [formData, setFormData] = useState<Record<string, any>>({})

  // Deterministic randomization based on participant ID
  const getVariantOrder = (id: string) => {
    const hash = id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return hash % 2 === 0 ? ['A', 'B'] : ['B', 'A']
  }

  // Render different steps
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏢 FormularIQ Nutzerstudie
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              KI-gestützte Formularbearbeitung im Vergleich
            </p>
            <Badge variant="outline" className="text-sm bg-white">
              Als Teil eines Forschungsprojekts an der HAW Hamburg
            </Badge>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800">
                🎯 Willkommen zur Studie!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 text-center">
                  Als Teil eines Forschungsprojekts an der HAW Hamburg 
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
                  energetische Modernisierung der Fassade mit Wärmedämmverbundsystem. 
                  Für die Beratung benötigen Sie eine digitale Erfassung der Gebäudedaten zur Mieterhöhungsberechnung nach der geplanten Sanierung.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-gray-800 mb-3">🔄 Studienablauf (ca. 20-25 Minuten)</h3>
                <div className="space-y-3">
                  {studySteps.map((stepInfo) => (
                    <div key={stepInfo.num} className="flex items-center p-3 bg-white rounded-lg border">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm mr-4">
                        {stepInfo.num}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{stepInfo.text}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{stepInfo.time}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">ℹ️ Wichtige Hinweise</h3>
                <ul className="text-blue-900 space-y-2 text-sm">
                  <li>• <strong>Anonymität:</strong> Alle Daten werden vollständig anonymisiert verarbeitet</li>
                  <li>• <strong>Freiwilligkeit:</strong> Die Teilnahme ist freiwillig und kann jederzeit beendet werden</li>
                  <li>• <strong>Datenschutz:</strong> DSGVO-konforme Speicherung und Verarbeitung</li>
                  <li>• <strong>Zeitaufwand:</strong> Ca. 20-25 Minuten Gesamtdauer</li>
                </ul>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => router.push('/study?step=demographics')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Studie starten
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'demographics') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Demografische Angaben</h1>
            <p className="text-gray-600">Schritt 1 von 6 - Kurze Angaben zu Ihrer Person</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Informationen</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDemographicsSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Alter</Label>
                    <Input 
                      id="age" 
                      name="age" 
                      type="number" 
                      min="18" 
                      max="99" 
                      required 
                      placeholder="z.B. 25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Geschlecht</Label>
                    <select id="gender" name="gender" required className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Bitte wählen</option>
                      <option value="male">Männlich</option>
                      <option value="female">Weiblich</option>
                      <option value="diverse">Divers</option>
                      <option value="prefer_not_to_say">Keine Angabe</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="education">Höchster Bildungsabschluss</Label>
                  <select id="education" name="education" required className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Bitte wählen</option>
                    <option value="hauptschule">Hauptschulabschluss</option>
                    <option value="realschule">Realschulabschluss</option>
                    <option value="abitur">Abitur/Fachabitur</option>
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master/Diplom</option>
                    <option value="phd">Promotion</option>
                    <option value="other">Anderer Abschluss</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="tech_experience">Erfahrung mit digitalen Formularen</Label>
                  <select id="tech_experience" name="tech_experience" required className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Bitte wählen</option>
                    <option value="very_low">Sehr gering (fast nie)</option>
                    <option value="low">Gering (selten)</option>
                    <option value="medium">Mittel (gelegentlich)</option>
                    <option value="high">Hoch (regelmäßig)</option>
                    <option value="very_high">Sehr hoch (täglich)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="ai_experience">Erfahrung mit KI-Systemen (ChatGPT, etc.)</Label>
                  <select id="ai_experience" name="ai_experience" required className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Bitte wählen</option>
                    <option value="none">Keine Erfahrung</option>
                    <option value="very_low">Sehr wenig</option>
                    <option value="low">Wenig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Viel</option>
                    <option value="very_high">Sehr viel</option>
                  </select>
                </div>

                <div className="text-center">
                  <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Weiter zu den Testszenarien
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'variant1_intro' || step === 'variant2_intro') {
    const currentVariant = step === 'variant1_intro' ? getFirstVariant() : getSecondVariant()
    const variantNumber = step === 'variant1_intro' ? 'erste' : 'zweite'
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 {variantNumber === 'erste' ? 'Erste' : 'Zweite'} Testvariante
            </h1>
            <p className="text-gray-600">
              {step === 'variant1_intro' ? 'Schritt 2 von 6' : 'Schritt 4 von 6'} - Variante {currentVariant}
            </p>
            <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {currentVariant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  {currentVariant === 'A' ? '📋 So funktioniert das sichtbare Formular:' : '💬 So funktioniert das Dialog-System:'}
                </h3>
                <ul className="text-blue-900 space-y-2">
                  {currentVariant === 'A' ? [
                    'Alle Formularfelder sind gleichzeitig sichtbar',
                    'Jedes Feld hat hilfreiche Tipps und Beispiele',
                    'Bei Fragen können Sie den KI-Assistenten rechts verwenden',
                    'Füllen Sie die Felder in beliebiger Reihenfolge aus'
                  ] : [
                    'Die KI stellt Ihnen nacheinander Fragen',
                    'Antworten Sie in natürlicher Sprache',
                    'Bei Unklarheiten können Sie nachfragen (einfach "?" eingeben)',
                    'Der Dialog führt Sie durch alle benötigten Informationen'
                  ]}
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">🏢 Ihr Szenario (zur Erinnerung)</h3>
                <p className="text-green-900">
                  Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23, Großstadt. 
                  Das Gebäude hat <strong>10 Wohneinheiten mit 634m² Wohnfläche</strong>. Sie planen eine 
                  <strong>Fassadensanierung mit WDVS (140mm Mineralwolle)</strong> und benötigen dafür eine Energieberatung.
                </p>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => handleNext()}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {currentVariant === 'A' ? 'Formular öffnen' : 'Dialog starten'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === '2' || step === '4') {
    const currentVariant = getCurrentVariant()
    return currentVariant === 'A' ? (
      <VariantA 
        onComplete={handleNext}
        startTime={new Date()}
      />
    ) : (
      <VariantB 
        onComplete={handleNext}
        startTime={new Date()}
      />
    )
  }

  if (step === 'variant1_survey' || step === 'variant2_survey') {
    const currentVariant = step === 'variant1_survey' ? getFirstVariant() : getSecondVariant()
    
    return (
      <EnhancedQuestionnaire
        variant={currentVariant as 'A' | 'B'}
        onComplete={handleNext}
        participantId={participantId}
      />
    )
  }

  if (step === 'final_comparison') {
    return (
      <EnhancedQuestionnaire
        variant="comparison"
        onComplete={handleNext}
        participantId={participantId}
      />
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl text-green-800">
                🎉 Studie erfolgreich abgeschlossen!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Vielen Dank für Ihre Teilnahme!
                </h3>
                <p className="text-green-900">
                  Ihre Daten wurden erfolgreich gespeichert und tragen wertvolle Erkenntnisse 
                  zu unserem Forschungsprojekt an der HAW Hamburg bei.
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  📊 Ergebnisse der Studie
                </h3>
                <p className="text-blue-900 text-sm">
                  Die Ergebnisse dieser Studie werden nach Abschluss aller Datenerhebungen 
                  wissenschaftlich ausgewertet und in anonymisierter Form veröffentlicht.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>Teilnehmer-ID:</strong> {participantId}
                </p>
                <p className="text-gray-700">
                  <strong>Getestete Reihenfolge:</strong> {getFirstVariant()} → {getSecondVariant()}
                </p>
                <p className="text-gray-600 text-sm">
                  Bei Fragen zum Forschungsprojekt kontaktieren Sie gerne die HAW Hamburg.
                </p>
              </div>

              <Button 
                onClick={() => router.push('/')}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Zur Startseite
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const getFirstVariant = () => {
    if (!participantId) return 'A'
    return getVariantOrder(participantId)[0]
  }

  const getSecondVariant = () => {
    if (!participantId) return 'B'
    return getVariantOrder(participantId)[1]
  }

  const getCurrentVariant = () => {
    if (step === '2') return getFirstVariant()
    if (step === '4') return getSecondVariant()
    return 'A'
  }

  // Navigation handlers
  const handleNext = (data?: any) => {
    if (data) {
      setFormData(prev => ({ ...prev, ...data }))
    }

    const stepMap: Record<string, string> = {
      'intro': 'demographics',
      'demographics': 'variant1_intro', 
      'variant1_intro': '2',
      '2': 'variant1_survey',
      'variant1_survey': 'variant2_intro',
      'variant2_intro': '4',
      '4': 'variant2_survey', 
      'variant2_survey': 'final_comparison',
      'final_comparison': 'complete'
    }

    const nextStep = stepMap[step]
    if (nextStep) {
      router.push(`/study?step=${nextStep}&participant=${participantId}`)
    }
  }

  const handleDemographicsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const formDataObj = new FormData(e.target as HTMLFormElement)
    const demographics = Object.fromEntries(formDataObj.entries())

    try {
      await fetch('/api/demographics/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, ...demographics })
      })
      handleNext(demographics)
    } catch (error) {
      console.error('Error saving demographics:', error)
      handleNext(demographics) // Continue even if save fails
    }
  }

  // Steps array AFTER function definitions
  const studySteps = [
    { num: 1, text: 'Demografische Angaben', time: '2 Min.' },
    { num: 2, text: `Erste Variante testen (${getFirstVariant()})`, time: '5-8 Min.' },
    { num: 3, text: 'Fragebogen zur ersten Variante (Vertrauen & Usability)', time: '3-4 Min.' },
    { num: 4, text: `Zweite Variante testen (${getSecondVariant()})`, time: '5-8 Min.' },
    { num: 5, text: 'Fragebogen zur zweiten Variante (Vertrauen & Usability)', time: '3-4 Min.' },
    { num: 6, text: 'Abschließender Vergleich & Präferenzen', time: '3-4 Min.' }
  ]

  // Render different steps
  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🏢 FormularIQ Nutzerstudie
            </h1>
            <p className="text-xl text-gray-600 mb-2">
              KI-gestützte Formularbearbeitung im Vergleich
            </p>
            <Badge variant="outline" className="text-sm bg-white">
              Als Teil eines Forschungsprojekts an der HAW Hamburg
            </Badge>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl text-center text-gray-800">
                🎯 Willkommen zur Studie!
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <p className="text-gray-700 text-center">
                  Als Teil eines Forschungsprojekts an der HAW Hamburg 
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
                  energetische Modernisierung der Fassade mit Wärmedämmverbundsystem. 
                  Für die Beratung benötigen Sie eine digitale Erfassung der Gebäudedaten zur Mieterhöhungsberechnung nach der geplanten Sanierung.
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
                  ].map((stepInfo) => (
                    <div key={stepInfo.num} className="flex items-center p-3 bg-white rounded-lg border">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm mr-4">
                        {stepInfo.num}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium text-gray-800">{stepInfo.text}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">{stepInfo.time}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-blue-800 mb-3">ℹ️ Wichtige Hinweise</h3>
                <ul className="text-blue-900 space-y-2 text-sm">
                  <li>• <strong>Anonymität:</strong> Alle Daten werden vollständig anonymisiert verarbeitet</li>
                  <li>• <strong>Freiwilligkeit:</strong> Die Teilnahme ist freiwillig und kann jederzeit beendet werden</li>
                  <li>• <strong>Datenschutz:</strong> DSGVO-konforme Speicherung und Verarbeitung</li>
                  <li>• <strong>Zeitaufwand:</strong> Ca. 20-25 Minuten Gesamtdauer</li>
                </ul>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => router.push('/study?step=demographics')}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Studie starten
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'demographics') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Demografische Angaben</h1>
            <p className="text-gray-600">Schritt 1 von 6 - Kurze Angaben zu Ihrer Person</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Allgemeine Informationen</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDemographicsSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="age">Alter</Label>
                    <Input 
                      id="age" 
                      name="age" 
                      type="number" 
                      min="18" 
                      max="99" 
                      required 
                      placeholder="z.B. 25"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Geschlecht</Label>
                    <select id="gender" name="gender" required className="w-full p-2 border border-gray-300 rounded-md">
                      <option value="">Bitte wählen</option>
                      <option value="male">Männlich</option>
                      <option value="female">Weiblich</option>
                      <option value="diverse">Divers</option>
                      <option value="prefer_not_to_say">Keine Angabe</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="education">Höchster Bildungsabschluss</Label>
                  <select id="education" name="education" required className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Bitte wählen</option>
                    <option value="hauptschule">Hauptschulabschluss</option>
                    <option value="realschule">Realschulabschluss</option>
                    <option value="abitur">Abitur/Fachabitur</option>
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master/Diplom</option>
                    <option value="phd">Promotion</option>
                    <option value="other">Anderer Abschluss</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="tech_experience">Erfahrung mit digitalen Formularen</Label>
                  <select id="tech_experience" name="tech_experience" required className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Bitte wählen</option>
                    <option value="very_low">Sehr gering (fast nie)</option>
                    <option value="low">Gering (selten)</option>
                    <option value="medium">Mittel (gelegentlich)</option>
                    <option value="high">Hoch (regelmäßig)</option>
                    <option value="very_high">Sehr hoch (täglich)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="ai_experience">Erfahrung mit KI-Systemen (ChatGPT, etc.)</Label>
                  <select id="ai_experience" name="ai_experience" required className="w-full p-2 border border-gray-300 rounded-md">
                    <option value="">Bitte wählen</option>
                    <option value="none">Keine Erfahrung</option>
                    <option value="very_low">Sehr wenig</option>
                    <option value="low">Wenig</option>
                    <option value="medium">Mittel</option>
                    <option value="high">Viel</option>
                    <option value="very_high">Sehr viel</option>
                  </select>
                </div>

                <div className="text-center">
                  <Button type="submit" size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Weiter zu den Testszenarien
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'variant1_intro' || step === 'variant2_intro') {
    const currentVariant = step === 'variant1_intro' ? getFirstVariant() : getSecondVariant()
    const variantNumber = step === 'variant1_intro' ? 'erste' : 'zweite'
    
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🎯 {variantNumber === 'erste' ? 'Erste' : 'Zweite'} Testvariante
            </h1>
            <p className="text-gray-600">
              {step === 'variant1_intro' ? 'Schritt 2 von 6' : 'Schritt 4 von 6'} - Variante {currentVariant}
            </p>
            <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {currentVariant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  {currentVariant === 'A' ? '📋 So funktioniert das sichtbare Formular:' : '💬 So funktioniert das Dialog-System:'}
                </h3>
                <ul className="text-blue-900 space-y-2">
                  {currentVariant === 'A' ? [
                    'Alle Formularfelder sind gleichzeitig sichtbar',
                    'Jedes Feld hat hilfreiche Tipps und Beispiele',
                    'Bei Fragen können Sie den KI-Assistenten rechts verwenden',
                    'Füllen Sie die Felder in beliebiger Reihenfolge aus'
                  ] : [
                    'Die KI stellt Ihnen nacheinander Fragen',
                    'Antworten Sie in natürlicher Sprache',
                    'Bei Unklarheiten können Sie nachfragen (einfach "?" eingeben)',
                    'Der Dialog führt Sie durch alle benötigten Informationen'
                  ]}
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">🏢 Ihr Szenario (zur Erinnerung)</h3>
                <p className="text-green-900">
                  Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23, Großstadt. 
                  Das Gebäude hat <strong>10 Wohneinheiten mit 634m² Wohnfläche</strong>. Sie planen eine 
                  <strong>Fassadensanierung mit WDVS (140mm Mineralwolle)</strong> und benötigen dafür eine Energieberatung.
                </p>
              </div>

              <div className="text-center">
                <Button 
                  onClick={() => handleNext()}
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {currentVariant === 'A' ? 'Formular öffnen' : 'Dialog starten'}
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === '2' || step === '4') {
    const currentVariant = getCurrentVariant()
    return currentVariant === 'A' ? (
      <VariantA 
        onComplete={handleNext}
        startTime={new Date()}
      />
    ) : (
      <VariantB 
        onComplete={handleNext}
        startTime={new Date()}
      />
    )
  }

  if (step === 'variant1_survey' || step === 'variant2_survey') {
    const currentVariant = step === 'variant1_survey' ? getFirstVariant() : getSecondVariant()
    
    return (
      <EnhancedQuestionnaire
        variant={currentVariant as 'A' | 'B'}
        onComplete={handleNext}
        participantId={participantId}
      />
    )
  }

  if (step === 'final_comparison') {
    return (
      <EnhancedQuestionnaire
        variant="comparison"
        onComplete={handleNext}
        participantId={participantId}
      />
    )
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
        <div className="container mx-auto px-4 max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-2xl text-green-800">
                🎉 Studie erfolgreich abgeschlossen!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-center">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Vielen Dank für Ihre Teilnahme!
                </h3>
                <p className="text-green-900">
                  Ihre Daten wurden erfolgreich gespeichert und tragen wertvolle Erkenntnisse 
                  zu unserem Forschungsprojekt an der HAW Hamburg bei.
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">
                  📊 Ergebnisse der Studie
                </h3>
                <p className="text-blue-900 text-sm">
                  Die Ergebnisse dieser Studie werden nach Abschluss aller Datenerhebungen 
                  wissenschaftlich ausgewertet und in anonymisierter Form veröffentlicht.
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-gray-700">
                  <strong>Teilnehmer-ID:</strong> {participantId}
                </p>
                <p className="text-gray-700">
                  <strong>Getestete Reihenfolge:</strong> {getFirstVariant()} → {getSecondVariant()}
                </p>
                <p className="text-gray-600 text-sm">
                  Bei Fragen zum Forschungsprojekt kontaktieren Sie gerne die HAW Hamburg.
                </p>
              </div>

              <Button 
                onClick={() => router.push('/')}
                size="lg"
                className="bg-green-600 hover:bg-green-700"
              >
                Zur Startseite
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return <div>Loading...</div>
}

// Main component with Suspense wrapper
export default function StudyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Studie wird geladen...</p>
        </div>
      </div>
    }>
      <StudyPageContent />
    </Suspense>
  )
}