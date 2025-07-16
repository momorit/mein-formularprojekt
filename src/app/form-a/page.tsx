"use client"

import { useState } from "react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { getInstructions, saveFormData, sendChatMessage } from "@/lib/api"

export default function FormA() {
  const [context, setContext] = useState("")
  const [instructions, setInstructions] = useState<any>(null)
  const [values, setValues] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [chat, setChat] = useState<{ sender: string; text: string }[]>([])
  const [chatInput, setChatInput] = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await getInstructions(context)
      setInstructions(result)
    } catch (e) {
      alert("Fehler bei der Verarbeitung")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveFormData(instructions, values)
      alert("Daten wurden erfolgreich gespeichert.")
    } catch {
      alert("Speichern fehlgeschlagen")
    } finally {
      setSaving(false)
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    const newChat = [...chat, { sender: "user", text: chatInput }]
    setChat(newChat)
    setChatInput("")
    try {
      const res = await sendChatMessage(chatInput)
      setChat([...newChat, { sender: "bot", text: res.response }])
    } catch (error) {
      setChat([...newChat, { sender: "bot", text: "Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut." }])
    }
  }

  const filledFields = Object.keys(values).filter(key => values[key]?.trim()).length
  const totalFields = instructions ? Object.keys(instructions).length : 0
  const progress = totalFields > 0 ? (filledFields / totalFields) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="backdrop-blur-md bg-white/70 border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FormularIQ</h1>
                <p className="text-xs text-gray-500">Variante A - Sichtbares Formular</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">A</span>
                  </div>
                  <span className="text-gray-600">Traditioneller Ansatz</span>
                </div>
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

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Sichtbare Formularfelder mit KI-Unterstützung
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Gebäudeformular erfassen
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Geben Sie Kontextinformationen ein und lassen Sie die KI passende Formularfelder generieren.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Hauptformular */}
          <div className="xl:col-span-3 space-y-8">
            {/* Eingabebereich */}
            <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <svg className="w-6 h-6 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z"/>
                  </svg>
                  Kontext & Formularerstellung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gebäudeinformationen (optional)
                  </label>
                  <Textarea
                    placeholder="Geben Sie hier zusätzliche Informationen zu Ihrem Gebäude ein (z.B. Baujahr, Gebäudetyp, geplante Modernisierungen)..."
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    className="min-h-[120px] border-gray-200 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                          <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                        </svg>
                        Generiere Felder...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                        </svg>
                        Formularfelder generieren
                      </>
                    )}
                  </Button>
                  
                  {instructions && (
                    <Button 
                      onClick={handleSave} 
                      disabled={saving}
                      variant="secondary"
                      className="shadow-lg"
                    >
                      {saving ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" className="opacity-75"></path>
                          </svg>
                          Speichere...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z"/>
                          </svg>
                          Als JSON speichern
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {/* Fortschrittsanzeige */}
                {instructions && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Formular-Fortschritt</span>
                      <span className="text-sm text-gray-600">{filledFields} von {totalFields} Feldern ausgefüllt</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generierte Formularfelder */}
            {instructions && (
              <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <svg className="w-6 h-6 mr-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
                    </svg>
                    Generierte Formularfelder
                    <span className="ml-3 text-sm font-normal text-gray-500">({totalFields} Felder)</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {Object.entries(instructions).map(([key, obj]: [string, any]) => (
                      <div
                        key={key}
                        className="group p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300"
                      >
                        <label className="font-semibold text-gray-800 text-sm mb-2 block flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          {key.toUpperCase()}
                        </label>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {obj.instruction}
                        </p>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            value={values[key] || ""}
                            onChange={(e) =>
                              setValues({ ...values, [key]: e.target.value })
                            }
                            placeholder="Ihre Eingabe..."
                          />
                          {values[key]?.trim() && (
                            <div className="absolute right-3 top-3">
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Chat-Assistent */}
          <div className="xl:col-span-1">
            <Card className="sticky top-24 border-0 bg-white/70 backdrop-blur-sm shadow-lg h-[600px] flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg">
                  <svg className="w-5 h-5 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                  </svg>
                  KI-Assistent
                </CardTitle>
                <p className="text-sm text-gray-500">Fragen Sie bei Unklarheiten nach</p>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Chat-Verlauf */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-3 bg-gray-50/50 rounded-lg">
                  {chat.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                      <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                      </svg>
                      <p>Stellen Sie Fragen zum Formular.</p>
                      <p className="text-xs mt-1">Der Assistent hilft Ihnen gerne!</p>
                    </div>
                  ) : (
                    chat.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] p-3 rounded-lg text-sm ${
                            msg.sender === "user"
                              ? "bg-blue-500 text-white rounded-br-none"
                              : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Chat-Eingabe */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleChatSend()}
                    placeholder="Frage stellen..."
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <Button 
                    onClick={handleChatSend} 
                    disabled={!chatInput.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2"
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