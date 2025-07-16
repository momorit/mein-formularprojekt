"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { getInstructions, saveFormData, sendChatMessage } from "@/lib/api"

export default function Home() {
  const [context, setContext] = useState("")
  const [instructions, setInstructions] = useState<any>(null)
  const [values, setValues] = useState<any>({})
  const [loading, setLoading] = useState(false)
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
    try {
      await saveFormData(instructions, values)
      alert("Daten wurden gespeichert.")
    } catch {
      alert("Speichern fehlgeschlagen")
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    const newChat = [...chat, { sender: "user", text: chatInput }]
    setChat(newChat)
    setChatInput("")
    const res = await sendChatMessage(chatInput)
    setChat([...newChat, { sender: "bot", text: res.response }])
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 text-white font-sans">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Professional Header */}
        <div className="text-center mb-12 border-b border-gray-700/50 pb-8">
          <div className="relative inline-block">
            <h1 className="text-5xl font-bold tracking-tight mb-3 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Formular-Assistent
            </h1>
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 blur-lg opacity-75 -z-10"></div>
          </div>
          <p className="text-lg text-gray-300 font-light mt-4">
            Intelligente Formulargenerierung für professionelle Anwendungen
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formularseite */}
          <div className="lg:col-span-2 space-y-8">
            {/* Context Input Section */}
            <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6">
              <h2 className="text-xl font-medium mb-4 text-gray-200">
                Kontext-Eingabe
              </h2>
              <Textarea
                placeholder="Zusatzinformationen (optional)..."
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[100px] bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500/20 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={handleGenerate} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Wird verarbeitet...
                  </span>
                ) : (
                  "Anweisungen generieren"
                )}
              </Button>
              {instructions && (
                <Button 
                  onClick={handleSave} 
                  variant="secondary"
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600 font-medium px-6 py-2.5 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Als JSON speichern
                </Button>
              )}
            </div>

            {/* Generated Form Fields */}
            {instructions && (
              <div className="space-y-6">
                <h3 className="text-xl font-medium text-gray-200 mb-6">
                  Generierte Formularfelder
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(instructions).map(([key, obj]) => (
                    <div
                      key={key}
                      className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-lg p-6 hover:border-blue-500/50 transition-all duration-300"
                    >
                      <label className="font-medium text-blue-300 text-sm mb-2 block uppercase tracking-wide">
                        {key}
                      </label>
                      <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                        {obj.instruction}
                      </p>
                      <input
                        type="text"
                        className="border border-gray-600 rounded-md px-3 py-2.5 w-full bg-gray-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
                        value={values[key] || ""}
                        onChange={(e) =>
                          setValues({ ...values, [key]: e.target.value })
                        }
                        placeholder={`${key.charAt(0).toUpperCase() + key.slice(1)} eingeben...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-gray-700/50 rounded-lg h-fit sticky top-10 flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-gray-700/50">
              <h2 className="font-medium text-lg text-gray-200 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                KI-Assistent
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Unterstützung bei der Formularerstellung
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-96">
              {chat.length === 0 ? (
                <div className="text-center text-gray-500 py-12">
                  <div className="w-12 h-12 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400">💬</span>
                  </div>
                  <p className="text-sm">Starten Sie eine Unterhaltung</p>
                </div>
              ) : (
                chat.map((msg, i) => (
                  <div
                    key={i}
                    className={`text-sm whitespace-pre-wrap ${
                      msg.sender === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    <span
                      className={`inline-block px-4 py-2.5 rounded-lg max-w-xs ${
                        msg.sender === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-200"
                      }`}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 border-t border-gray-700/50">
              <div className="flex gap-3">
                <input
                  className="flex-1 border border-gray-600 rounded-md px-3 py-2.5 bg-gray-800/50 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all duration-200"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Nachricht eingeben..."
                  onKeyPress={(e) => e.key === 'Enter' && handleChatSend()}
                />
                <Button 
                  onClick={handleChatSend}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 font-medium shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Senden
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}