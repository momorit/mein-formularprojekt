"use client"

import { useState } from "react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getInstructions, sendChatMessage, saveFormData } from "@/lib/api"

// Interface basierend auf der tatsächlichen API-Response

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export default function FormA() {
  const [context, setContext] = useState("")
  const [instructions, setInstructions] = useState<any>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleGenerateFields = async () => {
    setLoading(true)
    try {
      const fields = await getInstructions(context || "")
      setInstructions(fields)
      
      // Werte initialisieren
      const initialValues: Record<string, string> = {}
      Object.keys(fields).forEach(key => {
        initialValues[key] = ""
      })
      setValues(initialValues)
    } catch (error) {
      console.error("Fehler beim Generieren:", error)
      alert("Fehler beim Generieren der Felder")
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const userMessage = { role: "user" as const, content: chatInput }
    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")

    try {
      const response = await sendChatMessage(chatInput)
      const assistantMessage = { role: "assistant" as const, content: response.response }
      setChatMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat-Fehler:", error)
      setChatMessages(prev => [...prev, { role: "assistant", content: "Entschuldigung, ein Fehler ist aufgetreten." }])
    }
  }

  const handleSave = async () => {
    try {
      const result = await saveFormData(instructions, values)
      alert(`Daten gespeichert: ${result.filename}`)
    } catch (error) {
      console.error("Speicher-Fehler:", error)
      alert("Fehler beim Speichern")
    }
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
                <p className="text-sm text-gray-500">Variante A - Sichtbares Formular</p>
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
            Optional können Sie Kontextinformationen eingeben, um spezifische Formularfelder zu erhalten.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Linke Spalte - Kontext & Formular */}
          <div className="space-y-6">
            {/* Kontext-Eingabe */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">1. Kontext eingeben (optional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Kontext eingeben (optional)
                  </label>
                  <p className="text-sm text-gray-500">
                    Beschreiben Sie spezifische Anforderungen oder lassen Sie das Feld leer für ein Standard-Formular.
                  </p>
                </div>
                <Textarea
                  placeholder="z.B. Beschreiben Sie das zu erfassende Gebäude oder geben Sie zusätzliche Informationen ein..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="min-h-[120px]"
                />
                <Button 
                  onClick={handleGenerateFields}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Generiere Felder..." : "Formularfelder generieren"}
                </Button>
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
                  {Object.entries(instructions).map(([fieldName, fieldData]: [string, any]) => (
                    <div key={fieldName} className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {fieldName}
                      </label>
                      <p className="text-xs text-gray-500 mb-2">{fieldData.instruction}</p>
                      
                      {fieldData.type === "dropdown" ? (
                        <select
                          value={values[fieldName] || ""}
                          onChange={(e) => setValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required={fieldData.required}
                        >
                          <option value="">Bitte wählen...</option>
                          {fieldData.options?.map((option: string) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : fieldData.type === "number" ? (
                        <input
                          type="number"
                          value={values[fieldName] || ""}
                          onChange={(e) => setValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required={fieldData.required}
                        />
                      ) : (
                        <input
                          type="text"
                          value={values[fieldName] || ""}
                          onChange={(e) => setValues(prev => ({ ...prev, [fieldName]: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          required={fieldData.required}
                        />
                      )}
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <Button 
                      onClick={handleSave}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Als JSON speichern
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Rechte Spalte - Chat-Hilfe */}
          <div className="space-y-6">
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">KI-Assistent</CardTitle>
                <p className="text-sm text-gray-600">
                  Stellen Sie Fragen zum Formular oder bitten Sie um Hilfe beim Ausfüllen.
                </p>
              </CardHeader>
              <CardContent>
                {/* Chat-Verlauf */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {chatMessages.length === 0 && (
                    <div className="text-center text-gray-500 py-8">
                      <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                      </svg>
                      <p>Noch keine Nachrichten. Stellen Sie eine Frage!</p>
                    </div>
                  )}
                  
                  {chatMessages.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat-Eingabe */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                    placeholder="Frage stellen..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button 
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim()}
                    className="px-4 py-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                    </svg>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}