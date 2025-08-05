// src/app/form-b/page.tsx - VOLLSTÄNDIG GEFIXT

"use client"

import { useState, useRef, useEffect } from "react"  // ✅ useRef & useEffect hinzugefügt
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { startDialog, sendDialogMessage, saveDialogData } from "@/lib/api"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// ✅ FIX: Correct interface matching backend
interface DialogQuestion {
  question: string  // Backend sendet "question"
  field: string     // Backend sendet "field"
}

interface DialogState {
  active: boolean
  questionIndex: number
  questions: DialogQuestion[]  // ✅ Richtige Typen
  answers: Record<string, string>
}

export default function FormB() {
  // ✅ ALLE STATE VARIABLES:
  const [context, setContext] = useState("")
  const [dialogState, setDialogState] = useState<DialogState>({
    active: false,
    questionIndex: 0,
    questions: [],
    answers: {}
  })
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogCompleted, setDialogCompleted] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(false)  // ✅ NEU

  // ✅ REFS:
  const chatEndRef = useRef<HTMLDivElement>(null)  // ✅ NEU

  // ✅ EFFECTS:
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  const handleStartDialog = async () => {
    setLoading(true)
    try {
      // ✅ Bereits gefixt: Direkt string übergeben
      const result = await startDialog(context || "")
      
      setDialogState({
        active: false,
        questionIndex: 0,
        questions: result.questions,  // ✅ Backend format: {question, field}
        answers: {}
      })

      alert(`✅ ${result.questions.length} Fragen generiert! Klicken Sie "Dialog beginnen".`)

    } catch (error) {
      console.error("Fehler beim Dialog-Start:", error)
      alert("❌ Fehler beim Starten des Dialogs. Bitte erneut versuchen.")
    } finally {
      setLoading(false)
    }
  }

  const handleBeginDialog = () => {
    setDialogState(prev => ({
      ...prev,
      active: true
    }))

    setChatHistory([
      {
        role: "assistant",
        content: "Willkommen! Ich führe Sie durch das Formular. Lassen Sie uns beginnen."
      },
      {
        role: "assistant", 
        content: dialogState.questions[0]?.question || "Keine Fragen generiert."  // ✅ .question statt .frage
      }
    ])

    setUserInput("")
  }

  // ✅ NEUE handleSendMessage Funktion (IN form-b/page.tsx ERSETZEN)
  const handleSendMessage = async () => {
    if (!userInput.trim() || !dialogState.active) return

    const userMessage = { role: "user" as const, content: userInput }
    setChatHistory(prev => [...prev, userMessage])

    // Antwort speichern (NUR wenn es keine Rückfrage ist)
    const currentQuestion = dialogState.questions[dialogState.questionIndex]
    const isHelpRequest = userInput.endsWith('?') || 
                         userInput.toLowerCase().includes('was') ||
                         userInput.toLowerCase().includes('welche') ||
                         userInput.toLowerCase().includes('arten') ||
                         userInput === '?'

    if (currentQuestion && !isHelpRequest) {
      setDialogState(prev => ({
        ...prev,
        answers: { ...prev.answers, [currentQuestion.field]: userInput }
      }))
    }

    try {
      const response = await sendDialogMessage(
        userInput,
        currentQuestion,
        dialogState.questionIndex,
        dialogState.questions.length
      )

      const assistantMessage = { role: "assistant" as const, content: response.response }
      setChatHistory(prev => [...prev, assistantMessage])

      // ✅ NEUE LOGIC: Unterscheide zwischen Hilfe und normalen Antworten
      if (response.helpProvided) {
        // 🆘 HILFE GEGEBEN - BEI AKTUELLER FRAGE BLEIBEN
        console.log("🆘 Hilfe wurde gegeben, bleibe bei aktueller Frage")
        
        // Nach kurzer Pause die gleiche Frage nochmal stellen
        setTimeout(() => {
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: `${currentQuestion.question}` 
          }])
        }, 1500)
        
      } else if (response.dialogComplete) {
        // 🎉 DIALOG KOMPLETT BEENDET
        console.log("🎉 Dialog wurde beendet")
        setDialogCompleted(true)
        setDialogState(prev => ({ ...prev, active: false }))
        
      } else if (response.nextQuestion && dialogState.questionIndex + 1 < dialogState.questions.length) {
        // ➡️ NÄCHSTE FRAGE
        console.log(`➡️ Springe zu Frage ${dialogState.questionIndex + 2}`)
        setDialogState(prev => ({ ...prev, questionIndex: prev.questionIndex + 1 }))
        
        const nextQuestion = dialogState.questions[dialogState.questionIndex + 1]
        setTimeout(() => {
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: nextQuestion.question
          }])
        }, 1000)
        
      } else if (!response.nextQuestion && !response.helpProvided) {
        // 🏁 ALLE FRAGEN BEANTWORTET
        console.log("🏁 Alle Fragen beantwortet")
        setDialogCompleted(true)
        setDialogState(prev => ({ ...prev, active: false }))
      }

    } catch (error) {
      console.error("Dialog-Fehler:", error)
      setChatHistory(prev => [...prev, { 
        role: "assistant", 
        content: "Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." 
      }])
    }

    setUserInput("")
  }

  const handleSaveResults = async () => {
    try {
      const result = await saveDialogData(
        dialogState.questions,
        dialogState.answers,
        chatHistory
      )
      alert(`✅ Dialog gespeichert: ${result.filename}`)
    } catch (error) {
      console.error("Speicher-Fehler:", error)
      alert("❌ Fehler beim Speichern")
    }
  }

  const handleReset = () => {
    setDialogState({ active: false, questionIndex: 0, questions: [], answers: {} })
    setChatHistory([])
    setContext("")
    setUserInput("")
    setDialogCompleted(false)
    setLoading(false)
  }

  const progress = dialogState.questions.length > 0 
    ? Math.round((Object.keys(dialogState.answers).length / dialogState.questions.length) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 12a4 4 0 100-8 4 4 0 000 8zM2 21a6 6 0 1112 0H2z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">FormularIQ</h1>
                <p className="text-sm text-emerald-600">Variante B - Dialog-basiert</p>
              </div>
            </div>
            <Link 
              href="/"
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              ← Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        
        {/* Dialog Completed Screen */}
        {dialogCompleted && (
          <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 mb-8">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
              </div>
              <CardTitle className="text-2xl text-emerald-900">
                🎉 Dialog erfolgreich abgeschlossen!
              </CardTitle>
              <p className="text-emerald-700 mt-2">
                Sie haben alle {dialogState.questions.length} Fragen beantwortet.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-white rounded-lg border p-4 max-h-48 overflow-y-auto">
                  <h3 className="font-medium text-gray-900 mb-3">Ihre Antworten:</h3>
                  <div className="space-y-2">
                    {dialogState.questions.map((question, index) => (
                      <div key={index} className="text-sm">
                        <span className="font-medium text-gray-700">{question.field}:</span>
                        <span className="ml-2 text-gray-600 italic">
                          "{dialogState.answers[question.field] || "Nicht beantwortet"}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleSaveResults}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    💾 Ergebnisse speichern
                  </Button>
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    🔄 Neu starten
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NEUES LAYOUT: Chat unten statt rechts */}
        {!dialogCompleted && (
          <div className="space-y-8">
            
            {/* Setup / Control Panel - JETZT FULL WIDTH */}
            <div className="w-full max-w-4xl mx-auto">
              
              {!dialogState.questions.length ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900">Dialog starten</CardTitle>
                    <p className="text-gray-600 text-sm">
                      Generieren Sie personalisierte Fragen für Ihr Gebäudeformular.
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kontextinformationen (optional)
                      </label>
                      <Textarea
                        value={context}
                        onChange={(e) => setContext(e.target.value)}
                        placeholder="z.B. Energetische Sanierung eines Mehrfamilienhauses aus den 1970er Jahren..."
                        className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Beschreiben Sie Ihr Gebäude oder Ihr Vorhaben, um spezifische Fragen zu erhalten.
                      </p>
                    </div>

                    <Button 
                      onClick={handleStartDialog}
                      disabled={loading}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
                    >
                      {loading ? "Fragen werden generiert..." : "📋 Fragen generieren"}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Generated Questions Preview - Links */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">
                        ✅ {dialogState.questions.length} Fragen generiert
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto mb-4">
                        <div className="space-y-1 text-sm">
                          {dialogState.questions.map((q, i) => (
                            <div key={i} className={`text-gray-700 p-2 rounded ${
                              i === dialogState.questionIndex && dialogState.active 
                                ? 'bg-emerald-100 border-l-4 border-emerald-500 font-medium' 
                                : ''
                            }`}>
                              {i + 1}. {q.question}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {!dialogState.active ? (
                        <Button 
                          onClick={handleBeginDialog}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          🎯 Dialog beginnen
                        </Button>
                      ) : (
                        <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                          <div className="text-2xl font-bold text-emerald-600">{progress}%</div>
                          <div className="text-sm text-emerald-700">Fortschritt</div>
                          <div className="text-xs text-emerald-600 mt-1">
                            Frage {dialogState.questionIndex + 1} von {dialogState.questions.length}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Controls - Rechts */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">Dialog-Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-blue-600">
                            {Object.keys(dialogState.answers).length}
                          </div>
                          <div className="text-xs text-blue-700">Beantwortet</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-gray-600">
                            {dialogState.questions.length - Object.keys(dialogState.answers).length}
                          </div>
                          <div className="text-xs text-gray-700">Noch offen</div>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleReset}
                        variant="outline"
                        className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
                      >
                        🔄 Neu starten
                      </Button>
                      
                      {Object.keys(dialogState.answers).length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Aktuelle Antworten:</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {Object.entries(dialogState.answers).map(([field, answer]) => (
                              <div key={field} className="text-xs">
                                <span className="font-medium text-gray-700">{field}:</span>
                                <span className="ml-1 text-gray-600">"{answer}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* CHAT INTERFACE - JETZT UNTEN UND BREIT */}
            {dialogState.questions.length > 0 && (
              <div className="w-full max-w-6xl mx-auto">
                <Card className="border-t-4 border-emerald-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg text-gray-900 flex items-center">
                          <svg className="w-5 h-5 mr-2 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                          </svg>
                          Dialog-Chat
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {dialogState.active 
                            ? `Frage ${dialogState.questionIndex + 1} von ${dialogState.questions.length} • Stellen Sie Rückfragen oder antworten Sie direkt`
                            : "Dialog bereit - klicken Sie 'Dialog beginnen' um zu starten"
                          }
                        </p>
                      </div>
                      
                      {/* Chat Toggle */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChatExpanded(!chatExpanded)}
                        className="text-gray-600"
                      >
                        {chatExpanded ? "Minimieren" : "Erweitern"}
                        <svg className={`w-4 h-4 ml-1 transform transition-transform ${chatExpanded ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                        </svg>
                      </Button>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-4">
                    {/* Chat Messages - AUTO-EXPANDING */}
                    <div className={`overflow-y-auto space-y-3 mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 transition-all duration-300 ${
                      chatExpanded 
                        ? 'min-h-[400px] max-h-[600px]' 
                        : chatHistory.length === 0 
                          ? 'h-24' 
                          : `min-h-[${Math.min(chatHistory.length * 60 + 100, 300)}px] max-h-[300px]`
                    }`}>
                      {chatHistory.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7z"/>
                          </svg>
                          <p className="text-sm">Dialog-Chat bereit</p>
                        </div>
                      ) : (
                        chatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                            <div className={`max-w-[70%] px-4 py-3 rounded-lg shadow-sm ${
                              msg.role === 'user' 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-white text-gray-900 border border-gray-200'
                            }`}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                              <div className={`text-xs mt-1 opacity-70 ${
                                msg.role === 'user' ? 'text-emerald-100' : 'text-gray-500'
                              }`}>
                                {new Date().toLocaleTimeString('de-DE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                      
                      <div ref={chatEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={userInput}
                          onChange={(e) => setUserInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder={dialogState.active 
                            ? "Ihre Antwort eingeben oder Rückfrage stellen..." 
                            : "Dialog starten um zu antworten"
                          }
                          disabled={!dialogState.active}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 disabled:bg-gray-100"
                        />
                        
                        <Button 
                          onClick={handleSendMessage}
                          disabled={!dialogState.active || !userInput.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"/>
                          </svg>
                        </Button>
                      </div>
                      
                      {/* Quick Actions */}
                      {dialogState.active && (
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setUserInput("?")}
                            className="text-xs px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-full"
                          >
                            ? Hilfe
                          </button>
                          <button
                            onClick={() => setUserInput("Welche Optionen gibt es?")}
                            className="text-xs px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full"
                          >
                            💡 Optionen
                          </button>
                          <button
                            onClick={() => setUserInput("Beispiele?")}
                            className="text-xs px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full"
                          >
                            📝 Beispiele
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}