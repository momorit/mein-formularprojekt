'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { generateInstructions, saveFormData, getChatHelp } from '@/lib/api'
import type { FormInstructions, FormValues } from '@/lib/types'

interface ChatMessage {
  type: 'user' | 'bot'
  message: string
  timestamp: Date
}

export default function FormAPage() {
  const [context, setContext] = useState("")
  const [instructions, setInstructions] = useState<FormInstructions | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [loading, setLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")

  const handleGenerate = async () => {
    if (!context.trim()) {
      alert("Bitte geben Sie einen Kontext ein")
      return
    }

    setLoading(true)
    
    try {
      const result = await generateInstructions(context)
      setInstructions(result.instructions)
      
      // Leere Formularwerte initialisieren
      const emptyValues: FormValues = {}
      Object.keys(result.instructions).forEach(key => {
        emptyValues[key] = ""
      })
      setValues(emptyValues)
    } catch (error) {
      console.error("Generation failed:", error)
      alert("❌ Fehler beim Generieren der Anweisungen")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (key: string, value: string) => {
    setValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !context) return

    const userMessage: ChatMessage = {
      type: 'user',
      message: chatInput,
      timestamp: new Date()
    }

    setChatHistory(prev => [...prev, userMessage])
    setChatLoading(true)

    try {
      const response = await getChatHelp(chatInput, context)
      
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

  const handleSave = async () => {
    if (!instructions) return

    setSaving(true)
    setSaveSuccess("")

    try {
      const result = await saveFormData(instructions, values)
      setSaveSuccess(`✅ Erfolgreich gespeichert in Google Drive!
📁 Datei: ${result.filename}
📂 Ordner: ${result.folder}
🔗 Link: ${result.web_link ? 'Verfügbar' : 'Wird generiert...'}`)
      
      // Optional: Nach Erfolg zu Startseite weiterleiten
      setTimeout(() => {
        if (confirm("Daten erfolgreich gespeichert! Möchten Sie zur Startseite zurückkehren?")) {
          window.location.href = '/'
        }
      }, 3000)
    } catch (error) {
      console.error("Speicher-Fehler:", error)
      alert("❌ Fehler beim Speichern in Google Drive. Bitte versuchen Sie es erneut.")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm("Möchten Sie wirklich alle Eingaben zurücksetzen?")) {
      setContext("")
      setInstructions(null)
      setValues({})
      setChatHistory([])
      setChatInput("")
      setLoading(false)
      setChatLoading(false)
      setSaving(false)
      setSaveSuccess("")
    }
  }

  const filledFields = Object.keys(values).filter(key => values[key]?.trim()).length
  const totalFields = instructions ? Object.keys(instructions).length : 0
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
            Generieren Sie ein Formular basierend auf Ihrem Kontext und füllen Sie es aus
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Linke Spalte: Kontext & Formular */}
          <div className="space-y-6">
            {/* Kontext-Eingabe */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1️⃣ Kontext eingeben
              </h2>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Beschreiben Sie, welche Art von Formular Sie benötigen..."
                className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                onClick={handleGenerate}
                disabled={loading || !context.trim()}
                className="mt-4 w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Anweisungen werden generiert...
                  </>
                ) : (
                  "🚀 Anweisungen generieren"
                )}
              </button>
            </div>

            {/* Generiertes Formular */}
            {instructions && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">
                    2️⃣ Generiertes Formular
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
                <div className="space-y-4">
                  {Object.entries(instructions).map(([key, field]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                      
                      {field.type === 'select' && field.options ? (
                        <select
                          value={values[key] || ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={field.required}
                        >
                          <option value="">Bitte wählen...</option>
                          {field.options.map((option, index) => (
                            <option key={index} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          value={values[key] || ''}
                          onChange={(e) => handleInputChange(key, e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </div>

                {/* Speicher-Aktionen */}
                <div className="mt-8 space-y-4">
                  {saveSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-green-800 whitespace-pre-line">
                        {saveSuccess}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      disabled={saving || filledFields === 0}
                      className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Speichere in Google Drive...
                        </>
                      ) : (
                        "💾 In Google Drive speichern"
                      )}
                    </button>
                    
                    <button
                      onClick={handleReset}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      🔄 Zurücksetzen
                    </button>
                  </div>
                  
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                    <strong>ℹ️ Hinweis:</strong> Ihre Daten werden automatisch in Ihrem Google Drive im Ordner "FormularIQ_Daten" gespeichert. 
                    Sie erhalten keinen Download, da alles zentral für Sie verwaltet wird.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rechte Spalte: Chat-Hilfe */}
          <div className="bg-white rounded-xl shadow-lg p-6 h-fit">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              💬 <span className="ml-2">Chat-Hilfe</span>
            </h2>
            
            <div className="h-64 border border-gray-200 rounded-lg p-4 overflow-y-auto mb-4 bg-gray-50">
              {chatHistory.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  Stellen Sie Fragen zum Formular...
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
                placeholder="Fragen Sie nach Hilfe..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={chatLoading || !context}
              />
              <button
                type="submit"
                disabled={chatLoading || !chatInput.trim() || !context}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {chatLoading ? "..." : "📤"}
              </button>
            </form>
            
            <div className="text-xs text-gray-500 mt-2">
              Der Chat hilft Ihnen beim Ausfüllen des Formulars
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}