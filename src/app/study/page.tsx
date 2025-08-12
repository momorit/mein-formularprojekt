// src/app/study/page.tsx - OPTIMIERTE VERSION (Interface-Fix)

'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type StudyStep = 'welcome' | 'overview' | 'scenario' | 'variant-selection' | 'complete'

interface StudyData {
  participantId: string
  startTime: Date
  scenarioAcknowledged: boolean
}

export default function StudyPage() {
  const [currentStep, setCurrentStep] = useState<StudyStep>('welcome')
  const [studyData, setStudyData] = useState<StudyData>({
    participantId: generateParticipantId(),
    startTime: new Date(),
    scenarioAcknowledged: false
  })

  function generateParticipantId(): string {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P_${timestamp}_${random}`.toUpperCase()
  }

  // Render basierend auf aktuellem Schritt
  switch (currentStep) {
    case 'welcome':
      return <WelcomeStep onProceed={() => setCurrentStep('overview')} />
    
    case 'overview':
      return <OverviewStep onProceed={() => setCurrentStep('scenario')} />
      
    case 'scenario':
      return (
        <ScenarioStep 
          scenarioAcknowledged={studyData.scenarioAcknowledged}
          onAcknowledge={() => {
            setStudyData(prev => ({ ...prev, scenarioAcknowledged: true }))
            setCurrentStep('variant-selection')
          }}
        />
      )
      
    case 'variant-selection':
      return <VariantSelectionStep studyData={studyData} />
      
    default:
      return <div>Unbekannter Schritt</div>
  }
}

// === INDIVIDUAL COMPONENTS ===

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
          <p className="text-sm text-gray-500 mt-2">
            HAW Hamburg • Masterarbeit 2025 • Moritz Treu
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="text-2xl">Willkommen zur Studie</CardTitle>
            <p className="text-blue-100">
              Helfen Sie uns dabei, die beste Art der Formular-Interaktion zu finden!
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
                    Ausfüllen eines Gebäude-Energieberatungsformulars
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

              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Datenschutz & Anonymität</h3>
                <ul className="space-y-1 text-green-700 text-sm">
                  <li>✅ Vollständig anonyme Teilnahme</li>
                  <li>✅ DSGVO-konforme Datenspeicherung</li>
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
          {/* Variante A Erklärung */}
          <Card className="shadow-xl border-2 border-blue-200">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <CardTitle className="text-2xl">Sichtbares Formular</CardTitle>
                  <p className="text-blue-100">Traditioneller Ansatz mit KI-Unterstützung</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🎯 Konzept</h4>
                  <p className="text-gray-600 text-sm">
                    Ein klassisches Formular, bei dem alle Felder sichtbar sind. Ein KI-Chat-Assistent 
                    hilft bei spezifischen Fragen und gibt kontextuelle Unterstützung.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">⚡ Vorteile</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Vollständige Übersicht über alle Felder</li>
                    <li>• Freie Navigationsreihenfolge</li>
                    <li>• Vertraute Benutzeroberfläche</li>
                    <li>• KI-Hilfe bei Bedarf verfügbar</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variante B Erklärung */}
          <Card className="shadow-xl border-2 border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <div>
                  <CardTitle className="text-2xl">Dialog-System</CardTitle>
                  <p className="text-green-100">Konversationeller Ansatz</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">🎯 Konzept</h4>
                  <p className="text-gray-600 text-sm">
                    Die KI führt Sie durch einen strukturierten Dialog und stellt nacheinander 
                    alle notwendigen Fragen. Das System passt sich dynamisch Ihren Antworten an.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">⚡ Vorteile</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Geführter Prozess ohne Überforderung</li>
                    <li>• Kontextuelle Nachfragen</li>
                    <li>• Intelligente Anpassung</li>
                    <li>• Natürliche Konversation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="text-yellow-600 text-2xl">💡</div>
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">Ablauf der Studie</h3>
                <ol className="list-decimal list-inside space-y-1 text-yellow-700 text-sm">
                  <li>Szenario-Briefing lesen</li>
                  <li>Eine der beiden Varianten testen</li>
                  <li>Die andere Variante testen</li>
                  <li>Kurze Bewertung der Systeme</li>
                  <li>Abschluss und Dankeschön</li>
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8">
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
          <p className="text-lg text-gray-600">
            Bitte lesen Sie das folgende Szenario aufmerksam durch
          </p>
        </div>

        {/* Szenario-Anzeige */}
        {showScenario && (
          <Card className="shadow-xl mb-6">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <CardTitle className="text-2xl">🏢 Ihr Szenario</CardTitle>
              <p className="text-orange-100">
                Stellen Sie sich vor, Sie befinden sich in folgender Situation...
              </p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="prose max-w-none">
                <p className="text-lg leading-relaxed text-gray-800 mb-4">
                  Sie sind Eigentümer:in eines <strong>älteren Einfamilienhauses aus den 1970er Jahren</strong> 
                  und möchten eine <strong>energetische Sanierung</strong> durchführen lassen, um Heizkosten zu sparen 
                  und den CO₂-Ausstoß zu reduzieren.
                </p>
                
                <p className="text-lg leading-relaxed text-gray-800 mb-4">
                  Um staatliche <strong>Fördergelder</strong> zu beantragen, benötigen Sie eine 
                  professionelle <strong>Energieberatung</strong>. Der Berater hat Ihnen ein 
                  Formular geschickt, das Sie vorab ausfüllen sollen.
                </p>

                <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-400 my-6">
                  <h4 className="font-semibold text-blue-800 mb-2">📝 Ihre Aufgabe</h4>
                  <p className="text-blue-700">
                    Füllen Sie das <strong>Gebäude-Erfassungsformular</strong> mit den Informationen 
                    zu Ihrem Haus aus. Sie können gerne realistische Daten verwenden oder sich 
                    plausible Werte ausdenken.
                  </p>
                </div>

                <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-400">
                  <h4 className="font-semibold text-green-800 mb-2">💭 Denken Sie daran</h4>
                  <ul className="text-green-700 space-y-1">
                    <li>• Es geht um <strong>Ihr eigenes Haus</strong> (1970er Jahre)</li>
                    <li>• Sie möchten eine <strong>energetische Sanierung</strong></li>
                    <li>• Das Formular dient der <strong>Energieberatung</strong></li>
                    <li>• <strong>Fördergelder</strong> sollen beantragt werden</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Buttons */}
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

function VariantSelectionStep({ studyData }: { studyData: StudyData }) {
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
          <p className="text-sm text-gray-500">
            Sie können beide Varianten in beliebiger Reihenfolge testen
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Variante A */}
          <Card className="shadow-xl border-2 border-blue-200 hover:shadow-2xl transition-all group">
            <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">A</span>
                </div>
                <div>
                  <CardTitle className="text-2xl">Sichtbares Formular</CardTitle>
                  <p className="text-blue-100">Klassische Ansicht mit KI-Chat</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    Alle Formularfelder sind sichtbar. Ein KI-Assistent hilft bei Fragen.
                  </p>
                </div>

                <Link 
                  href="/form-a"
                  className="block w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium text-center group-hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Variante A starten
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Variante B */}
          <Card className="shadow-xl border-2 border-green-200 hover:shadow-2xl transition-all group">
            <CardHeader className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <div>
                  <CardTitle className="text-2xl">Dialog-System</CardTitle>
                  <p className="text-green-100">Konversationeller Ansatz</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-6">
                    Die KI führt Sie durch einen strukturierten Dialog mit gezielten Fragen.
                  </p>
                </div>

                <Link
                  href="/form-b"
                  className="block w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 transition-colors text-lg font-medium text-center group-hover:bg-green-700"
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Variante B starten
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-yellow-50 border-yellow-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="text-yellow-600 text-2xl">💡</div>
                <h3 className="font-semibold text-yellow-800">Hinweis</h3>
              </div>
              <p className="text-yellow-700 text-sm">
                Nach Abschluss einer Variante kehren Sie automatisch hierher zurück, 
                um die andere Variante zu testen. Am Ende folgt eine kurze Bewertung beider Systeme.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}