'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { saveFormData, getChatHelp } from '@/lib/api'

interface ChatMessage {
  type: 'user' | 'bot'
  message: string
  timestamp: Date
}

// Variante A: 4 Felder (2 leichte + 2 schwere)
const FORM_FIELDS = {
  GEBÄUDEART: {
    label: "Gebäudeart",
    type: "select",
    required: true,
    difficulty: "leicht",
    placeholder: "Bitte wählen Sie die Gebäudeart",
    options: [
      "Einfamilienhaus", 
      "Mehrfamilienhaus", 
      "Reihenmittelhaus", 
      "Reihenendhaus", 
      "Doppelhaushälfte"
    ]
  },
  BAUJAHR: {
    label: "Baujahr",
    type: "number",
    required: true,
    difficulty: "leicht",
    placeholder: "z.B. 1985"
  },
  ENERGIEAUSWEIS: {
    label: "Energieausweis",
    type: "select",
    required: true,
    difficulty: "schwer",
    placeholder: "Energieklasse bzw. Verbrauchswert",
    options: [
      "Energieklasse A+ (unter 30 kWh/m²a)",
      "Energieklasse A (30-50 kWh/m²a)", 
      "Energieklasse B (50-75 kWh/m²a)",
      "Energieklasse C (75-100 kWh/m²a)",
      "Energieklasse D (100-130 kWh/m²a)",
      "Energieklasse E (130-160 kWh/m²a)",
      "Energieklasse F (160-200 kWh/m²a)",
      "Energieklasse G (200-250 kWh/m²a)",
      "Energieklasse H (über 250 kWh/m²a)",
      "Kein Energieausweis vorhanden",
      "Energieausweis vorhanden, aber Klasse unbekannt"
    ]
  },
  SANIERUNGSBEDARF: {
    label: "Geplante Sanierungsmaßnahmen",
    type: "textarea",
    required: true,
    difficulty: "schwer",
    placeholder: "Beschreiben Sie detailliert welche energetischen Sanierungsmaßnahmen geplant sind (z.B. Fassadendämmung, Fensteraustausch, Heizungserneuerung, Dachdämmung). Bitte schätzen Sie auch ungefähre Kosten und Zeitplanung."
  }
}

export default function FormAPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")

  const handleInputChange = (key: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    }

    setChatHistory(prev => [...prev, userMessage])
    setChatLoading(true)

    try {
      const response = await getChatHelp(chatInput, "Gebäudeformular Variante A - Energetische Sanierung")
      
      const botMessage: ChatMessage = {
        type: 'bot',
        message: response,
        timestamp: new Date()
      }
      
      setChatHistory(prev => [...prev, botMessage])
    } catch (error) {
      console.error("Chat error:", error)
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        message: "Entschuldigung, der Chat-Service ist momentan nicht verfügbar. Bitte versuchen Sie es erneut.", 
        timestamp: new Date() 
      }])
    } finally {
      setChatLoading(false)
      setChatInput("")
    }
  }

  const handleFinishSurvey = async () => {
    // Prüfung ob alle Pflichtfelder ausgefüllt sind
    const missingFields = Object.entries(FORM_FIELDS)
      .filter(([key, field]) => field.required && !values[key]?.trim())
      .map(([key, field]) => field.label)

    if (missingFields.length > 0) {
      alert(`Bitte füllen Sie folgende Pflichtfelder aus: ${missingFields.join(', ')}`)
      return
    }

    setSaving(true)

    try {
      // Convert FORM_FIELDS to instructions format for API
      const instructions = Object.fromEntries(
        Object.entries(FORM_FIELDS).map(([key, field]) => [
          key,
          {
            label: field.label,
            type: field.type,
            required: field.required,
            placeholder: field.placeholder,
            options: field.options,
            difficulty: field.difficulty
          }
        ])
      )

      const result = await saveFormData(instructions, values)
      
      setSaveSuccess(`✅ Umfrage erfolgreich abgeschlossen und gespeichert!
      
📁 Ihre Daten wurden automatisch gespeichert.
📂 Google Drive Ordner: ${result.folder}
📄 Dateiname: ${result.filename}

Sie können das Browserfenster jetzt schließen.`)
      
      setCompleted(true)
      
    } catch (error) {
      console.error("Speicher-Fehler:", error)
      alert("❌ Fehler beim Speichern. Bitte versuchen Sie es erneut.")
    } finally {
      setSaving(false)
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-green-800 mb-4">
              Umfrage erfolgreich abgeschlossen!
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="text-green-800 whitespace-pre-line text-left">
                {saveSuccess}
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Vielen Dank für Ihre Teilnahme an der Studie zur Gebäudeerfassung!
            </p>
            <div className="text-sm text-gray-500">
              Sie können dieses Browserfenster jetzt schließen.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const filledFields = Object.keys(values).filter(key => values[key]?.trim()).length
  const totalFields = Object.keys(FORM_FIELDS).length
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-blue-600 hover:text-blue-800 mb-4 text-sm">
            ← Zurück zur Hauptseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            📝 Variante A: Sichtbares Formular
          </h1>
          <p className="text-gray-600">
            Gebäudeerfassung für energetische Sanierung ({totalFields} Felder)
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Linke Spalte: Formular */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                🏢 Gebäudeformular
              </h2>
              <div className="text-sm text-gray-600">
                {filledFields}/{totalFields} Felder ausgefüllt
              </div>
            </div>

            {/* Fortschrittsbalken */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            {/* Formularfelder */}
            <div className="space-y-6">
              {Object.entries(FORM_FIELDS).map(([key, field]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                    <span className={`ml-2 px-2 py-1 text-xs rounded ${
                      field.difficulty === 'leicht' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {field.difficulty}
                    </span>
                  </label>
                  
                  {field.type === 'select' && field.options ? (
                    <select
                      value={values[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options.map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'textarea' ? (
                    <textarea
                      value={values[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required={field.required}
                    />
                  ) : (
                    <input
                      type={field.type}
                      value={values[key] || ''}
                      onChange={(e) => handleInputChange(key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                      min={field.type === 'number' ? "1900" : undefined}
                      max={field.type === 'number' ? "2025" : undefined}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Umfrage beenden Button */}
            <div className="mt-8">
              <button
                onClick={handleFinishSurvey}
                disabled={saving}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Umfrage wird gespeichert...
                  </>
                ) : (
                  "🎯 Umfrage beenden"
                )}
              </button>
              
              <div className="text-sm text-gray-500 text-center mt-3">
                Ihre Daten werden automatisch und sicher gespeichert
              </div>
            </div>
          </div>

          {/* Rechte Spalte: Chat-Hilfe */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              💬 <span className="ml-2">Chat-Hilfe</span>
            </h2>
            
            <div className="h-64 border border-gray-200 rounded-lg p-4 overflow-y-auto mb-4 bg-gray-50">
              {chatHistory.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  <div className="text-sm">
                    <strong>💡 Beispiel-Fragen:</strong><br/>
                    • "Was bedeuten die Energieklassen A bis H?"<br/>
                    • "Welche Sanierungsmaßnahmen sind am effektivsten?"<br/>
                    • "Wie finde ich heraus welche Energieklasse mein Haus hat?"<br/>
                    • "Was kostet eine Fassadendämmung ungefähr?"
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                        msg.type === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        {msg.message}
                        <div className={`text-xs mt-1 opacity-70 ${
                          msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-lg text-sm">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                          Tippt...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Fragen Sie nach Hilfe zum Formular..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {chatLoading ? "..." : "📤"}
              </button>
            </form>
            
            <div className="text-xs text-gray-500 mt-2">
              Der Chat hilft Ihnen beim Ausfüllen des Gebäudeformulars
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}