// src/app/form-a/page.tsx - COMPLETELY FIXED

"use client"

import { useState } from "react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { generateInstructions, getChatHelp, saveFormData } from "@/lib/api"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export default function FormA() {
  const [context, setContext] = useState("")
  const [instructions, setInstructions] = useState<Record<string, string> | null>(null)  // ✅ Simple strings
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  
  // Chat state
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)

  const handleGenerateFields = async () => {
    setLoading(true)
    try {
      const result = await generateInstructions(context)
      setInstructions(result)  // ✅ Simple string instructions
      
      // Initialize empty values
      const initialValues: Record<string, string> = {}
      Object.keys(result).forEach(key => {
        initialValues[key] = ""
      })
      setValues(initialValues)
      
      // Add welcome message
      setChatHistory([{
        role: "assistant",
        content: `✅ ${Object.keys(result).length} Formularfelder wurden generiert! Sie können nun das Formular ausfüllen. Fragen Sie mich gerne, wenn Sie Hilfe brauchen.`
      }])

    } catch (error) {
      console.error("Fehler beim Generieren:", error)
      alert("❌ Fehler beim Generieren der Felder. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendChat = async () => {
    if (!chatInput.trim()) return

    const userMessage = { role: "user" as const, content: chatInput }
    setChatHistory(prev => [...prev, userMessage])
    setChatLoading(true)

    try {
      const response = await getChatHelp(chatInput)
      const assistantMessage = { role: "assistant" as const, content: response }
      setChatHistory(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat-Fehler:", error)
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: "Entschuldigung, ich konnte Ihre Frage nicht verarbeiten. Bitte versuchen Sie es erneut." 
      }])
    } finally {
      setChatLoading(false)
      setChatInput("")
    }
  }

  const handleSave = async () => {
    if (!instructions) return

    try {
      const result = await saveFormData(instructions, values)
      alert(`✅ Daten gespeichert: ${result.filename}`)
    } catch (error) {
      console.error("Speicher-Fehler:", error)
      alert("❌ Fehler beim Speichern")
    }
  }

  const handleReset = () => {
    setContext("")
    setInstructions(null)
    setValues({})
    setChatHistory([])
    setChatInput("")
    setLoading(false)
    setChatLoading(false)
  }

  const filledFields = Object.keys(values).filter(key => values[key]?.trim()).length
  const totalFields = instructions ? Object.keys(instructions).length : 0
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">FormularIQ</h1>
                <p className="text-sm text-blue-600">Variante A - Sichtbares Formular</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-sm">A</span>
                </div>
                <span>Sichtbares Formular</span>
              </div>
              <Link href="/form-b">
                <Button variant="outline" className="text-sm">
                  Zu Variante B
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
            Sichtbare Formularfelder mit KI-Unterstützung
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Gebäudeformular erfassen
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Lassen Sie die KI ein personalisiertes Formular für Sie generieren und nutzen Sie den Chat-Assistant für Hilfe.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Linke Spalte - Kontext & Formular */}
          <div className="space-y-6">
            
            {/* Kontext-Eingabe */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  {instructions ? "✅ Kontext eingegeben" : "1. Kontext eingeben (optional)"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!instructions ? (
                  <>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Kontext für personalisierte Felder
                      </label>
                      <p className="text-sm text-gray-500">
                        Beschreiben Sie Ihr Gebäude oder Vorhaben, um spezifische Formularfelder zu erhalten. 
                        Leer lassen für Standard-Gebäudeformular.
                      </p>
                    </div>
                    <Textarea
                      placeholder="z.B. Energetische Sanierung eines Mehrfamilienhauses aus den 1970er Jahren mit Fokus auf Dämmung und neue Heizungsanlage..."
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      className="min-h-[120px] resize-none"
                    />
                    <Button 
                      onClick={handleGenerateFields}
                      disabled={loading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      {loading ? "🔄 Generiere Felder..." : "📋 Anweisungen generieren"}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Kontext:</strong> {context || "Standard-Gebäudeformular"}
                      </p>
                    </div>
                    <Button 
                      onClick={handleReset}
                      variant="outline"
                      className="w-full text-gray-600 border-gray-300"
                    >
                      🔄 Neu starten
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formular */}
            {instructions && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900">2. Formular ausfüllen</CardTitle>
                    <div className="text-sm text-gray-500">
                      {filledFields} von {totalFields} Feldern ausgefüllt
                    </div>
                  </div>
                  {/* Fortschrittsbalken */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Object.entries(instructions).map(([fieldName, instruction]) => (
                    <div key={fieldName} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-900">
                        {fieldName}
                      </label>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {instruction}
                      </p>
                      <input
                        type="text"
                        value={values[fieldName] || ""}
                        onChange={(e) => setValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder={`${fieldName} eingeben...`}
                      />
                    </div>
                  ))}
                  
                  <div className="pt-6 border-t border-gray-200">
                    <Button 
                      onClick={handleSave}
                      disabled={filledFields === 0}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      💾 Als JSON speichern ({filledFields} Felder ausgefüllt)
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rechte Spalte - Chat-Hilfe */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200 h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                  </svg>
                  KI-Hilfe Chat
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Fragen Sie den Assistenten bei Unklarheiten zum Formular.
                </p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 space-y-4 max-h-[400px]">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"/>
                      </svg>
                      <p className="font-medium">Chat-Assistent bereit</p>
                      <p className="text-sm">Generieren Sie zuerst Formularfelder, dann kann ich Ihnen beim Ausfüllen helfen.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                        <p className="text-sm">🤔 Denke nach...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendChat()}
                    placeholder="Frage zum Formular stellen..."
                    disabled={chatLoading}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                  <Button 
                    onClick={handleSendChat}
                    disabled={!chatInput.trim() || chatLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                  >
                    {chatLoading ? "⏳" : "📤"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Progress Card */}
            {instructions && (
              <Card className="bg-blue-50 border border-blue-200">
                <CardContent className="p-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {Math.round(progress)}%
                    </div>
                    <div className="text-sm text-blue-700 mb-2">Vervollständigung</div>
                    <div className="text-xs text-blue-600">
                      {filledFields} von {totalFields} Feldern ausgefüllt
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}