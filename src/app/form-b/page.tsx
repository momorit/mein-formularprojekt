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

interface DialogState {
  active: boolean
  questionIndex: number
  questions: Array<{ feld: string; frage: string }>
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

  const handleStartDialog = async () => {
    setLoading(true)
    try {
      // Verwende den gleichen Ansatz wie Variante A
      const formData = new FormData()
      formData.append("extraInfo", context || "")

      const result = await startDialog(formData)
      
      setDialogState({
        active: true,
        questionIndex: 0,
        questions: result.questions,
        answers: {}
      })

      setChatHistory([
        {
          role: "assistant",
          content: "Willkommen! Ich führe Sie durch das Formular. Lassen Sie uns beginnen."
        },
        {
          role: "assistant", 
          content: result.questions[0]?.frage || "Keine Fragen generiert."
        }
      ])
    } catch (error) {
      console.error("Fehler beim Dialog-Start:", error)
      alert("Fehler beim Starten des Dialogs")
    } finally {
      setLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || !dialogState.active) return

    const newChatHistory = [
      ...chatHistory,
      { role: "user" as const, content: userInput }
    ]
    setChatHistory(newChatHistory)

    try {
      const currentQuestion = dialogState.questions[dialogState.questionIndex]
      
      const response = await sendDialogMessage({
        message: userInput,
        currentQuestion: currentQuestion,
        questionIndex: dialogState.questionIndex,
        totalQuestions: dialogState.questions.length
      })

      // LLM-Antwort zur Chat-Historie hinzufügen
      setChatHistory(prev => [...prev, {
        role: "assistant",
        content: response.response
      }])

      // Nur wenn es KEINE Nachfrage war, Antwort speichern und weiter
      if (response.nextQuestion && !userInput.endsWith("?")) {
        // Antwort speichern
        const newAnswers = {
          ...dialogState.answers,
          [currentQuestion.feld]: userInput
        }

        // Zur nächsten Frage
        const newQuestionIndex = dialogState.questionIndex + 1
        
        setDialogState(prev => ({
          ...prev,
          questionIndex: newQuestionIndex,
          answers: newAnswers
        }))

        // Nächste Frage nach kurzer Verzögerung anzeigen
        if (newQuestionIndex < dialogState.questions.length) {
          setTimeout(() => {
            setChatHistory(prev => [...prev, {
              role: "assistant",
              content: dialogState.questions[newQuestionIndex]?.frage || "Dialog beendet."
            }])
          }, 1000)
        }
      }
      // Bei Nachfragen (userInput endet mit "?") wird nicht weitergeschaltet

    } catch (error) {
      console.error("Fehler beim Senden:", error)
      setChatHistory(prev => [...prev, {
        role: "assistant",
        content: "Entschuldigung, ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."
      }])
    }

    setUserInput("")
  }

  const handleSave = async () => {
    try {
      const dialogData = {
        questions: dialogState.questions,
        answers: dialogState.answers,
        chatHistory: chatHistory
      }
      const result = await saveDialogData(dialogData)
      alert(`Dialog-Daten gespeichert: ${result.filename}`)
    } catch (error) {
      console.error("Speicher-Fehler:", error)
      alert("Fehler beim Speichern")
    }
  }

  const progress = dialogState.questions.length > 0 
    ? (dialogState.questionIndex / dialogState.questions.length) * 100 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">FormularIQ</h1>
                <p className="text-sm text-gray-500">Variante B - Dialog-basiert</p>
              </div>
            </Link>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <span className="text-emerald-600 font-semibold text-sm">B</span>
                </div>
                <span>Innovativer Ansatz</span>
              </div>
              <Link href="/form-a">
                <Button variant="outline" className="text-sm">
                  Zu Variante A
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-medium mb-4">
            Konversationelle Formularerfassung
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dialog-basierte Erfassung
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Optional können Sie Kontextinformationen eingeben und die KI durch einen natürlichen Dialog führen lassen.
          </p>
        </div>

        {!dialogState.active ? (
          /* Setup-Bereich - Gleich wie Variante A */
          <Card className="bg-white border border-gray-200 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900 text-center">Dialog vorbereiten</CardTitle>
              <p className="text-gray-600 text-center">
                Optional können Sie Kontextinformationen eingeben, bevor der Dialog startet.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Kontext-Eingabe */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Kontext eingeben (optional)
                </label>
                <p className="text-sm text-gray-500">
                  Beschreiben Sie spezifische Anforderungen oder lassen Sie das Feld leer für Standard-Fragen.
                </p>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="z.B. Beschreiben Sie das zu erfassende Gebäude oder geben Sie zusätzliche Informationen ein..."
                  className="min-h-[120px]"
                />
              </div>

              {/* Start Button */}
              <Button 
                onClick={handleStartDialog}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg"
              >
                {loading ? "Dialog wird gestartet..." : "Dialog starten"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          /* Dialog-Bereich */
          <div className="space-y-6">
            {/* Fortschritt */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="py-4">
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>Fortschritt</span>
                  <span>{dialogState.questionIndex} von {dialogState.questions.length} Fragen</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chat-Bereich */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">Dialog</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Chat-Verlauf */}
                <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                  {chatHistory.map((message, index) => (
                    <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.role === 'user' 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Eingabe-Bereich */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ihre Antwort eingeben..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!userInput.trim()}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      Senden
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    💡 <strong>Tipp:</strong> Beenden Sie Ihre Nachricht mit "?" um eine Rückfrage zu stellen, ohne zur nächsten Frage zu wechseln
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Speichern */}
            {dialogState.questionIndex >= dialogState.questions.length && (
              <Card className="bg-white border border-gray-200">
                <CardContent className="py-6 text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Dialog abgeschlossen!</h3>
                  <p className="text-gray-600 mb-4">Alle Fragen wurden beantwortet. Sie können die Daten jetzt speichern.</p>
                  <Button 
                    onClick={handleSave}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
                  >
                    Ergebnisse speichern
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  )
}