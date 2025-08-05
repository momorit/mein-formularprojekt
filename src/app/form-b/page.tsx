// src/app/form-b/page.tsx - VOLLSTÄNDIG GEFIXT

"use client"

import { useState } from "react"
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

        {/* Main Content */}
        {!dialogCompleted && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Setup / Control Panel */}
            <div className="space-y-6">
              
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
                <>
                  {/* Generated Questions Preview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">
                        ✅ {dialogState.questions.length} Fragen generiert
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto mb-4">
                        <div className="space-y-1 text-sm">
                          {dialogState.questions.map((q, i) => (
                            <div key={i} className="text-gray-700">
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

                  {/* Reset Button */}
                  <Button 
                    onClick={handleReset}
                    variant="outline"
                    className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    🔄 Neu starten
                  </Button>
                </>
              )}
            </div>

            {/* Chat Interface */}
            <div className="space-y-6">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900">Dialog-Chat</CardTitle>
                  <p className="text-sm text-gray-600">
                    {dialogState.active 
                      ? `Frage ${dialogState.questionIndex + 1} von ${dialogState.questions.length}`
                      : "Starten Sie den Dialog um zu beginnen"
                    }
                  </p>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col">
                  {/* Chat Messages */}
                  <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4 space-y-4">
                    {chatHistory.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                        </svg>
                        <p>Dialog-Chat bereit</p>
                        <p className="text-sm">Generieren Sie zuerst Fragen und starten Sie den Dialog.</p>
                      </div>
                    ) : (
                      chatHistory.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-gray-100 text-gray-900'
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={dialogState.active ? "Ihre Antwort eingeben... (oder '?' für Hilfe)" : "Dialog starten um zu antworten"}
                      disabled={!dialogState.active}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 disabled:bg-gray-100"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!dialogState.active || !userInput.trim()}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-4"
                    >
                      📤
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}