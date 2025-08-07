'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { generateInstructions, saveFormData, getChatHelp, checkSystemStatus } from '@/lib/api'
import type { FormInstructions, FormValues, ChatMessage, SaveResponse } from '@/lib/types'

export default function FormAPage() {
  // === STATE MANAGEMENT ===
  const [context, setContext] = useState("")
  const [instructions, setInstructions] = useState<FormInstructions | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [saveResult, setSaveResult] = useState<SaveResponse | null>(null)
  
  // Chat-Funktionalität
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  
  // System Status
  const [systemOnline, setSystemOnline] = useState(true)
  const [startTime] = useState(new Date())

  // === SYSTEM CHECK ===
  useEffect(() => {
    checkSystemStatus().then(setSystemOnline)
  }, [])

  // === FORM GENERATION ===
  const handleGenerateForm = async () => {
    if (!systemOnline) {
      alert('System ist nicht verfügbar. Bitte versuchen Sie es später erneut.')
      return
    }

    setLoading(true)
    
    try {
      const formInstructions = await generateInstructions(context)
      setInstructions(formInstructions)
      
      // Initialize empty form values
      const emptyValues: FormValues = {}
      Object.keys(formInstructions).forEach(key => {
        emptyValues[key] = ""
      })
      setValues(emptyValues)
    } catch (error) {
      console.error("Form generation failed:", error)
      alert("Fehler beim Generieren des Formulars. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  // === FORM HANDLING ===
  const handleInputChange = (key: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSaveForm = async () => {
    if (!instructions) return

    // Validation
    const requiredFields = Object.keys(instructions).slice(0, 5) // First 5 fields required
    const missingFields = requiredFields.filter(field => !values[field]?.trim())
    
    if (missingFields.length > 0) {
      alert(`Bitte füllen Sie folgende Pflichtfelder aus: ${missingFields.join(', ')}`)
      return
    }

    setSaving(true)

    try {
      const result = await saveFormData(instructions, values)
      setSaveResult(result)
      setCompleted(true)
    } catch (error) {
      console.error("Save failed:", error)
      alert("Fehler beim Speichern. Bitte versuchen Sie es erneut.")
    } finally {
      setSaving(false)
    }
  }

  // === CHAT HANDLING ===
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage: ChatMessage = {
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    }

    setChatHistory(prev => [...prev, userMessage])
    setChatLoading(true)

    try {
      const response = await getChatHelp(chatInput, `Variante A - Sichtbares Formular: ${context}`)
      
      const botMessage: ChatMessage = {
        type: 'bot',
        message: response,
        timestamp: new Date()
      }
      
      setChatHistory(prev => [...prev, botMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: ChatMessage = {
        type: 'bot',
        message: "Der Chat-Service ist momentan nicht verfügbar. Bitte versuchen Sie es erneut.",
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
    } finally {
      setChatLoading(false)
      setChatInput("")
    }
  }

  // === COMPLETION SCREEN ===
  if (completed && saveResult) {
    const duration = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Variante A erfolgreich abgeschlossen
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Vielen Dank für Ihre Teilnahme. Ihre Daten wurden sicher gespeichert.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Speicherdetails</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Speicherort:</span>
                  <span className="font-medium">{saveResult.storage === 'google_drive' ? 'Google Drive (Cloud)' : 'Lokal'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dateiname:</span>
                  <span className="font-medium font-mono text-xs">{saveResult.filename}</span>
                </div>
                {saveResult.folder && (
                  <div className="flex justify-between">
                    <span>Ordner:</span>
                    <span className="font-medium">{saveResult.folder}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Bearbeitungszeit:</span>
                  <span className="font-medium">{duration} Minuten</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link 
                href="/form-b" 
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Zu Variante B
              </Link>
              <Link 
                href="/" 
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Zur Hauptseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // === MAIN INTERFACE ===
  const filledFields = Object.values(values).filter(value => value.trim()).length
  const totalFields = instructions ? Object.keys(instructions).length : 0
  const progress = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zur Hauptseite
          </Link>
          
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Variante A: Sichtbares Formular
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Wissenschaftliche Studie zur LLM-gestützten Formularbearbeitung
            </p>
          </div>

          {/* System Status */}
          <div className="flex justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${systemOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                System {systemOnline ? 'online' : 'offline'}
              </span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="text-gray-600">HAW Hamburg</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Context & Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Context Input */}
            {!instructions && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  1. Kontext eingeben
                </h2>
                <p className="text-gray-600 mb-6">
                  Beschreiben Sie optional den Kontext Ihres Gebäudes, um passende Formularfelder zu generieren.
                </p>
                
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Beispiel: Ich möchte ein Mehrfamilienhaus von 1980 erfassen, das energetisch saniert werden soll..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={loading}
                />
                
                <div className="mt-6">
                  <button
                    onClick={handleGenerateForm}
                    disabled={loading || !systemOnline}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Formular wird generiert...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Formular generieren
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Generated Form */}
            {instructions && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">
                    2. Gebäudeformular ausfüllen
                  </h2>
                  <div className="text-sm text-gray-500">
                    {filledFields} von {totalFields} Feldern ausgefüllt
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Fortschritt</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-6 mb-8">
                  {Object.entries(instructions).map(([key, instruction], index) => (
                    <div key={key} className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                      <label className="block text-sm font-semibold text-gray-900 mb-3">
                        <div className="flex items-center gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="flex-1">{key.replace(/_/g, ' ')}</span>
                          {index < 5 && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                              Pflichtfeld
                            </span>
                          )}
                        </div>
                      </label>
                      
                      <p className="text-sm text-gray-600 mb-4">{instruction}</p>
                      
                      <input
                        type={key.includes('JAHR') ? 'number' : key.includes('FLÄCHE') ? 'number' : 'text'}
                        value={values[key] || ''}
                        onChange={(e) => handleInputChange(key, e.target.value)}
                        placeholder="Ihre Eingabe..."
                        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        min={key.includes('JAHR') ? 1800 : key.includes('FLÄCHE') ? 1 : undefined}
                        max={key.includes('JAHR') ? 2025 : undefined}
                      />
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <div className="border-t pt-8">
                  <button
                    onClick={handleSaveForm}
                    disabled={saving || filledFields < 5}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Daten werden gespeichert...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Formular speichern und abschließen
                      </>
                    )}
                  </button>
                  
                  {filledFields < 5 && (
                    <p className="text-sm text-gray-500 text-center mt-3">
                      Mindestens die ersten 5 Felder müssen ausgefüllt werden
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Chat Help */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.017 8.017 0 01-6.1-2.9L3 21l3.9-3.9A8.017 8.017 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                </svg>
                KI-Assistent
              </h3>
              
              {/* Chat Messages */}
              <div className="h-64 border border-gray-200 rounded-xl p-4 overflow-y-auto mb-4 bg-gray-50">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <svg className="w-8 h-8 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm">
                      Stellen Sie Fragen zum Formular...
                    </p>
                    <div className="mt-4 text-xs text-gray-400 space-y-1">
                      <p>• "Was bedeutet Energieklasse A?"</p>
                      <p>• "Wie messe ich die Wohnfläche?"</p>
                      <p>• "Welche Heizungsarten gibt es?"</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {chatHistory.map((msg, index) => (
                      <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs px-4 py-2 rounded-xl text-sm ${
                          msg.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                        }`}>
                          {msg.message}
                          <div className={`text-xs mt-1 opacity-70 ${
                            msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-xl text-sm shadow-sm">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            KI denkt nach...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ihre Frage..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  disabled={chatLoading || !systemOnline}
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim() || !systemOnline}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
              
              <div className="text-xs text-gray-500 mt-3">
                Der KI-Assistent hilft beim Ausfüllen des Formulars
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}