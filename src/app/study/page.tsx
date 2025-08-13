'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudyPage() {
  const router = useRouter()
  const [step, setStep] = useState<'start' | 'demographics' | 'variant1' | 'survey1' | 'variant2' | 'survey2' | 'complete'>('start')
  const [participantId] = useState(() => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `P_${timestamp}_${random}`.toUpperCase()
  })
  const [randomization] = useState<'A-B' | 'B-A'>(() => Math.random() > 0.5 ? 'A-B' : 'B-A')
  const [demographics, setDemographics] = useState({
    age: '',
    education: '',
    experience: ''
  })

  const getFirstVariant = () => randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => randomization === 'A-B' ? 'B' : 'A'

  // Start Screen
  if (step === 'start') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">FormularIQ Studie</h1>
            <p className="text-xl text-gray-600">
              Forschungsstudie über KI-gestützte Formularsysteme
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Szenario</h2>
              <div className="bg-blue-50 p-6 rounded-lg">
                <p className="text-lg text-blue-900 leading-relaxed">
                  <strong>Stellen Sie sich vor:</strong> Sie möchten eine Energieberatung für Ihr Gebäude durchführen lassen. 
                  Dafür müssen Sie zunächst einige grundlegende Informationen zu Ihrem Gebäude angeben.
                </p>
                <p className="text-blue-800 mt-3">
                  Sie testen zwei verschiedene digitale Ansätze für diese Aufgabe und bewerten anschließend 
                  Ihre Erfahrung mit beiden Systemen.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Ablauf der Studie:</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span>Demografische Angaben (2 Minuten)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span>Erste Variante testen (5-8 Minuten)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span>Bewertung der ersten Variante (2 Minuten)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <span>Zweite Variante testen (5-8 Minuten)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</div>
                  <span>Bewertung der zweiten Variante (2 Minuten)</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-green-800 mb-2">Wichtige Hinweise:</h4>
              <ul className="text-green-700 space-y-1">
                <li>• Alle Daten werden anonymisiert behandelt</li>
                <li>• Die Teilnahme ist freiwillig und kann jederzeit abgebrochen werden</li>
                <li>• Gesamtdauer: ca. 15-20 Minuten</li>
                <li>• Ihre Teilnehmer-ID: <strong>{participantId}</strong></li>
              </ul>
            </div>

            <button 
              onClick={() => setStep('demographics')}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Studie starten
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Demographics
  if (step === 'demographics') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Demografische Angaben</h1>
            <p className="text-gray-600">Schritt 1 von 5</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={(e) => {
              e.preventDefault()
              setStep('variant1')
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
                    <option value="18-25">18-25 Jahre</option>
                    <option value="26-35">26-35 Jahre</option>
                    <option value="36-45">36-45 Jahre</option>
                    <option value="46-55">46-55 Jahre</option>
                    <option value="56+">56+ Jahre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Höchster Bildungsabschluss *
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
                    Erfahrung mit digitalen Formularen *
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
              </div>

              <button 
                type="submit"
                className="w-full mt-8 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Weiter zur ersten Variante
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Variant 1 Instructions
  if (step === 'variant1') {
    const variant = getFirstVariant()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Erste Variante: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h1>
            <p className="text-gray-600">Schritt 2 von 5</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📋 Erinnerung an das Szenario:
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-900">
                  Sie möchten eine <strong>Energieberatung für Ihr Gebäude</strong> durchführen lassen 
                  und müssen dafür grundlegende Gebäudeinformationen angeben.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {variant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  {variant === 'A' 
                    ? 'Sie sehen alle Formularfelder auf einmal und können bei Bedarf einen Chat-Assistenten um Hilfe bitten.'
                    : 'Ein KI-Assistent führt Sie Schritt für Schritt durch einen Dialog und stellt Ihnen nacheinander Fragen zu Ihrem Gebäude.'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <h4 className="font-semibold">Ihre Aufgabe:</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Füllen Sie das Formular für die Gebäude-Energieberatung aus</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Nutzen Sie die verfügbaren Hilfe-Funktionen wenn nötig</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Nehmen Sie sich die Zeit, die Sie benötigen</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>Am Ende folgt ein kurzer Fragebogen zu Ihrer Erfahrung</span>
                </li>
              </ul>
            </div>

            <button 
              onClick={() => {
                const url = variant === 'A' ? '/form-a' : '/form-b'
                router.push(`${url}?study=true&step=1&participant=${participantId}`)
              }}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
            >
              Variante {variant} jetzt starten
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Survey 1
  if (step === 'survey1') {
    const variant = getFirstVariant()
    const [ratings, setRatings] = useState({
      usability: '',
      satisfaction: '',
      efficiency: '',
      comments: ''
    })

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bewertung: Variante {variant}
            </h1>
            <p className="text-gray-600">Schritt 3 von 5</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={(e) => {
              e.preventDefault()
              setStep('variant2')
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wie bewerten Sie die Benutzerfreundlichkeit? *
                  </label>
                  <select 
                    required
                    value={ratings.usability}
                    onChange={(e) => setRatings(prev => ({ ...prev, usability: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bitte bewerten</option>
                    <option value="1">1 - Sehr schlecht</option>
                    <option value="2">2 - Schlecht</option>
                    <option value="3">3 - Neutral</option>
                    <option value="4">4 - Gut</option>
                    <option value="5">5 - Sehr gut</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wie zufrieden waren Sie mit dieser Variante? *
                  </label>
                  <select 
                    required
                    value={ratings.satisfaction}
                    onChange={(e) => setRatings(prev => ({ ...prev, satisfaction: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bitte bewerten</option>
                    <option value="1">1 - Sehr unzufrieden</option>
                    <option value="2">2 - Unzufrieden</option>
                    <option value="3">3 - Neutral</option>
                    <option value="4">4 - Zufrieden</option>
                    <option value="5">5 - Sehr zufrieden</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wie effizient konnten Sie die Aufgabe erledigen? *
                  </label>
                  <select 
                    required
                    value={ratings.efficiency}
                    onChange={(e) => setRatings(prev => ({ ...prev, efficiency: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bitte bewerten</option>
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
              </div>

              <button 
                type="submit"
                className="w-full mt-8 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Zur zweiten Variante
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Variant 2 Instructions
  if (step === 'variant2') {
    const variant = getSecondVariant()
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Zweite Variante: {variant === 'A' ? 'Sichtbares Formular' : 'Dialog-System'}
            </h1>
            <p className="text-gray-600">Schritt 4 von 5</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">
                📋 Gleiches Szenario, andere Variante:
              </h2>
              <div className="bg-blue-50 p-4 rounded-lg mb-6">
                <p className="text-blue-900">
                  Sie möchten wieder eine <strong>Energieberatung für Ihr Gebäude</strong> durchführen lassen. 
                  Diesmal verwenden Sie einen anderen digitalen Ansatz.
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {variant === 'A' ? '📋 Variante A: Sichtbares Formular' : '💬 Variante B: Dialog-System'}
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  {variant === 'A' 
                    ? 'Sie sehen alle Formularfelder auf einmal und können bei Bedarf einen Chat-Assistenten um Hilfe bitten.'
                    : 'Ein KI-Assistent führt Sie Schritt für Schritt durch einen Dialog und stellt Ihnen nacheinander Fragen zu Ihrem Gebäude.'
                  }
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                const url = variant === 'A' ? '/form-a' : '/form-b'
                router.push(`${url}?study=true&step=2&participant=${participantId}`)
              }}
              className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
            >
              Variante {variant} jetzt starten
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Survey 2
  if (step === 'survey2') {
    const variant = getSecondVariant()
    const [ratings, setRatings] = useState({
      usability: '',
      satisfaction: '',
      efficiency: '',
      comparison: '',
      comments: ''
    })

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Bewertung: Variante {variant}
            </h1>
            <p className="text-gray-600">Schritt 5 von 5</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <form onSubmit={(e) => {
              e.preventDefault()
              setStep('complete')
            }}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Wie bewerten Sie die Benutzerfreundlichkeit? *
                  </label>
                  <select 
                    required
                    value={ratings.usability}
                    onChange={(e) => setRatings(prev => ({ ...prev, usability: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bitte bewerten</option>
                    <option value="1">1 - Sehr schlecht</option>
                    <option value="2">2 - Schlecht</option>
                    <option value="3">3 - Neutral</option>
                    <option value="4">4 - Gut</option>
                    <option value="5">5 - Sehr gut</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welche Variante bevorzugen Sie? *
                  </label>
                  <select 
                    required
                    value={ratings.comparison}
                    onChange={(e) => setRatings(prev => ({ ...prev, comparison: e.target.value }))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bitte wählen</option>
                    <option value="A">Variante A (Sichtbares Formular)</option>
                    <option value="B">Variante B (Dialog-System)</option>
                    <option value="Keine Präferenz">Keine Präferenz</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Abschließende Kommentare (optional)
                  </label>
                  <textarea 
                    value={ratings.comments}
                    onChange={(e) => setRatings(prev => ({ ...prev, comments: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Welche Variante war besser und warum?"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-8 bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
              >
                Studie abschließen
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // Complete
  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                ✓
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">🎉 Studie abgeschlossen!</h1>
              <p className="text-lg text-gray-700">
                Vielen Dank für Ihre Teilnahme an unserer Forschungsstudie!
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg mb-6">
              <h3 className="font-semibold text-green-800 mb-2">Ihre Teilnehmer-ID:</h3>
              <p className="text-xl font-mono text-green-900">{participantId}</p>
              <p className="text-sm text-green-700 mt-2">
                Ihre Daten wurden erfolgreich und anonymisiert gespeichert.
              </p>
            </div>

            <div className="text-gray-600">
              <p>Bei Fragen zur Studie wenden Sie sich gerne an:</p>
              <p className="font-semibold">HAW Hamburg - Department Informatik</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}