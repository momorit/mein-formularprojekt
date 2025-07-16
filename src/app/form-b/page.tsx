"use client"

import { useState } from "react"
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
  const [extraInfo, setExtraInfo] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [dialogState, setDialogState] = useState<DialogState>({
    active: false,
    questionIndex: 0,
    questions: [],
    answers: {}
  })
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setPdfFile(file)
    }
  }

  const handleStartDialog = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      if (pdfFile) formData.append("pdf", pdfFile)
      formData.append("extraInfo", extraInfo)

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
          content: "Willkommen! Ich freue mich, dass ich Ihnen helfen kann, das Formular gemeinsam auszufüllen."
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

      // Antwort speichern
      const newAnswers = {
        ...dialogState.answers,
        [currentQuestion.feld]: userInput
      }

      // Dialog-State aktualisieren
      let newQuestionIndex = dialogState.questionIndex
      if (response.nextQuestion && !userInput.endsWith("?")) {
        newQuestionIndex = dialogState.questionIndex + 1
      }

      setDialogState({
        ...dialogState,
        questionIndex: newQuestionIndex,
        answers: newAnswers
      })

      // Assistent-Antwort hinzufügen
      setChatHistory([
        ...newChatHistory,
        { role: "assistant", content: response.message }
      ])

    } catch (error) {
      console.error("Fehler beim Senden der Nachricht:", error)
      setChatHistory([
        ...newChatHistory,
        { role: "assistant", content: "Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut." }
      ])
    }

    setUserInput("")
  }

  const handleSaveData = async () => {
    try {
      await saveDialogData({
        questions: dialogState.questions,
        answers: dialogState.answers,
        chatHistory: chatHistory
      })
      alert("Dialog-Daten wurden erfolgreich gespeichert.")
    } catch (error) {
      console.error("Fehler beim Speichern:", error)
      alert("Fehler beim Speichern der Daten")
    }
  }

  const isDialogComplete = dialogState.questionIndex >= dialogState.questions.length

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-center mb-10">
          Dialogbasiertes Gebäudeformular (Variante B)
        </h1>

        {!dialogState.active ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Schritt 1: Upload und Kontext */}
            <Card>
              <CardHeader>
                <CardTitle>Schritt 1: PDF oder Kontextinformationen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    PDF-Formular hochladen (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {pdfFile && (
                    <p className="text-sm text-green-600 mt-2">
                      PDF ausgewählt: {pdfFile.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Zusätzliche Kontextinformationen (optional)
                  </label>
                  <Textarea
                    placeholder="Zusätzliche Informationen zum Gebäude..."
                    value={extraInfo}
                    onChange={(e) => setExtraInfo(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schritt 2: Dialog starten */}
            <Card>
              <CardHeader>
                <CardTitle>Schritt 2: Dialog starten</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleStartDialog}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Dialog wird gestartet..." : "Dialog starten"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Chat-Interface */}
            <div className="lg:col-span-2">
              <Card className="h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle>
                    Formular-Dialog
                    {dialogState.questions.length > 0 && (
                      <span className="text-sm font-normal text-gray-600 ml-2">
                        ({dialogState.questionIndex + 1} von {dialogState.questions.length})
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {/* Chat-Verlauf */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-gray-50 rounded-lg">
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === "user"
                              ? "bg-blue-600 text-white"
                              : "bg-white border border-gray-200"
                          }`}
                        >
                          <div className="text-sm font-medium mb-1">
                            {msg.role === "user" ? "Du" : "Assistent"}
                          </div>
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Eingabefeld */}
                  {!isDialogComplete && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                        placeholder="Ihre Antwort..."
                        className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <Button onClick={handleSendMessage} disabled={!userInput.trim()}>
                        Senden
                      </Button>
                    </div>
                  )}

                  {isDialogComplete && (
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium">
                        ✅ Formular vollständig ausgefüllt!
                      </p>
                      <Button onClick={handleSaveData} className="mt-2">
                        Daten speichern
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Fortschritt und gesammelte Antworten */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fortschritt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Abgeschlossen:</span>
                      <span>{Object.keys(dialogState.answers).length} von {dialogState.questions.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${(Object.keys(dialogState.answers).length / dialogState.questions.length) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bisherige Antworten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {Object.entries(dialogState.answers).map(([field, answer]) => (
                      <div key={field} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium text-gray-700">{field}:</div>
                        <div className="text-gray-600">{answer}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}