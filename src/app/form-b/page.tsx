// src/app/form-b/page.tsx - KOMPLETTE DATEI - ALLES ERSETZEN

"use client"

import { useState } from "react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { startDialog, sendDialogMessage, saveDialogData, saveQuestionsOnly, extractAnswers, saveCompleteDialogData } from "@/lib/api"

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
  
  // States für Fragen-Download
  const [questionsGenerated, setQuestionsGenerated] = useState(false)
  const [questionsDownloaded, setQuestionsDownloaded] = useState(false)
  
  // States für Dialog-Completion und Extraktion
  const [dialogCompleted, setDialogCompleted] = useState(false)
  const [extractionPreview, setExtractionPreview] = useState<Record<string, string>>({})
  const [showExtraction, setShowExtraction] = useState(false)
  const [extractionLoading, setExtractionLoading] = useState(false)

  const handleStartDialog = async () => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("extraInfo", context || "")

      const result = await startDialog(formData)
      
      setDialogState({
        active: false, // Dialog noch nicht aktiv!
        questionIndex: 0,
        questions: result.questions,
        answers: {}
      })

      setQuestionsGenerated(true)

    } catch (error) {
      console.error("Fehler beim Dialog-Start:", error)
      alert("Fehler beim Starten des Dialogs")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadQuestions = async () => {
    try {
      const result = await saveQuestionsOnly({
        questions: dialogState.questions,
        context: context
      })
      alert(`Fragen gespeichert: ${result.filename}`)
      setQuestionsDownloaded(true)
    } catch (error) {
      console.error("Fehler beim Speichern der Fragen:", error)
      alert("Fehler beim Speichern der Fragen")
    }
  }

  const handleBeginDialog = () => {
    setDialogState(prev => ({
      ...prev,
      active: true // Dialog aktivieren
    }))

    setChatHistory([
      {
        role: "assistant",
        content: "Willkommen! Ich führe Sie durch das Formular. Lassen Sie uns beginnen."
      },
      {
        role: "assistant", 
        content: dialogState.questions[0]?.frage || "Keine Fragen generiert."
      }
    ])

    setUserInput("")
  }

  const handleSendMessage = async () => {
    if (!userInput.trim() || !dialogState.active) return

    const userMessage = { role: "user" as const, content: userInput }
    setChatHistory(prev => [...prev, userMessage])

    // Antwort speichern
    const currentQuestion = dialogState.questions[dialogState.questionIndex]
    if (currentQuestion && !userInput.endsWith('?')) {
      setDialogState(prev => ({
        ...prev,
        answers: { ...prev.answers, [currentQuestion.feld]: userInput }
      }))
    }

    try {
      const response = await sendDialogMessage({
        message: userInput,
        currentQuestion: dialogState.questions[dialogState.questionIndex],
        questionIndex: dialogState.questionIndex,
        totalQuestions: dialogState.questions.length
      })

      const assistantMessage = { role: "assistant" as const, content: response.response }
      setChatHistory(prev => [...prev, assistantMessage])

      if (response.nextQuestion && dialogState.questionIndex + 1 < dialogState.questions.length) {
        // Nächste Frage
        setDialogState(prev => ({ ...prev, questionIndex: prev.questionIndex + 1 }))
        
        const nextQuestion = dialogState.questions[dialogState.questionIndex + 1]
        setTimeout(() => {
          setChatHistory(prev => [...prev, { 
            role: "assistant", 
            content: nextQuestion.frage 
          }])
        }, 1000)
      } else if (!response.nextQuestion && dialogState.questionIndex + 1 >= dialogState.questions.length) {
        // DIALOG BEENDET
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

  // NEUE Funktion: Antwort-Extraktion vorher anzeigen
  const handlePreviewExtraction = async () => {
    setExtractionLoading(true)
    try {
      const result = await extractAnswers({
        questions: dialogState.questions,
        raw_answers: dialogState.answers
      })
      
      setExtractionPreview(result.extracted_answers)
      setShowExtraction(true)
    } catch (error) {
      console.error("Extraktion-Fehler:", error)
      alert("❌ Fehler bei der Antwort-Extraktion")
    } finally {
      setExtractionLoading(false)
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
                <span>Dialogbasiert</span>
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
            Interaktive Formularerfassung mit KI-Extraktion
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Dialog-basierte Erfassung
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Optional können Sie Kontextinformationen eingeben und die KI durch einen natürlichen Dialog führen lassen.
          </p>
        </div>

        {/* DIALOG COMPLETION SCREEN - Zeigt sich nach erfolgreichem Dialog */}
        {dialogCompleted && (
          <div className="space-y-6 mt-8">
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
              <CardHeader>
                <div className="text-center">
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
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  
                  {/* SCHRITT 1: Rohe Antworten anzeigen */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Ihre Dialog-Antworten (Original):</h3>
                    <div className="bg-white rounded-lg border border-gray-200 p-4 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {dialogState.questions.map((question, index) => (
                          <div key={index} className="text-sm">
                            <span className="font-medium text-gray-700">{question.feld}:</span>
                            <span className="ml-2 text-gray-600 italic">
                              "{dialogState.answers[question.feld] || "Nicht beantwortet"}"
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* SCHRITT 2: Extraktion-Preview oder Extraktion-Prozess */}
                  {!showExtraction ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/>
                        </svg>
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900">Formular-Daten optimieren</h4>
                          <p className="text-sm text-blue-700 mt-1 mb-3">
                            Die KI extrahiert aus Ihren Dialog-Antworten saubere, strukturierte Formularwerte. 
                            Aus <em>"Es handelt sich um ein Mehrfamilienhaus"</em> wird <em>"Mehrfamilienhaus"</em>.
                          </p>
                          <Button 
                            onClick={handlePreviewExtraction}
                            disabled={extractionLoading}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            {extractionLoading ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Extrahiere Formularwerte...
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"/>
                                </svg>
                                Formularwerte extrahieren
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* SCHRITT 3: Extraktion-Ergebnis anzeigen */
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="font-medium text-green-900 mb-3">
                          ✅ Optimierte Formularwerte (für Download):
                        </h4>
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dialogState.questions.map((question, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="font-medium text-sm text-gray-700">
                                  {question.feld}:
                                </span>
                                <span className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                                  {extractionPreview[question.feld] || "—"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Vergleich anzeigen */}
                        <div className="mt-3 text-sm text-green-700">
                          <strong>Beispiel-Verbesserung:</strong>
                          <div className="mt-1 space-y-1">
                            {Object.entries(dialogState.answers).slice(0, 2).map(([field, rawAnswer]) => {
                              const extracted = extractionPreview[field]
                              if (rawAnswer && extracted && rawAnswer !== extracted) {
                                return (
                                  <div key={field} className="text-xs">
                                    <span className="text-red-600">Vorher:</span> "{rawAnswer}" 
                                    → <span className="text-green-600">Nachher:</span> "{extracted}"
                                  </div>
                                )
                              }
                              return null
                            })}
                          </div>
                        </div>
                      </div>

                      {/* FINALER SPEICHER-BUTTON */}
                      <Button 
                        onClick={async () => {
                          try {
                            const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
                            const filename = `dialog_complete_${timestamp}.json`
                            
                            const result = await saveCompleteDialogData({
                              questions: dialogState.questions,
                              answers: dialogState.answers,
                              chatHistory: chatHistory,
                              filename: filename
                            })
                            
                            alert(`✅ Dialog mit sauberen Formularwerten gespeichert!\n\nDatei: ${result.filename}\nExtrahierte Felder: ${result.extracted_fields}\nOrt: LLM Output Ordner\n\nDie JSON-Datei enthält sowohl die ursprünglichen Dialog-Antworten als auch die optimierten Formularwerte.`)
                            
                          } catch (error) {
                            console.error("Speicher-Fehler:", error)
                            alert("❌ Fehler beim Speichern der Dialog-Daten")
                          }
                        }}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-4 text-lg font-medium"
                      >
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
                        </svg>
                        Dialog mit optimierten Formularwerten speichern
                      </Button>
                    </div>
                  )}

                  {/* Statistiken */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {Object.keys(dialogState.answers).length}
                        </div>
                        <div className="text-sm text-gray-600">Beantwortete Fragen</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.round((Object.keys(dialogState.answers).length / dialogState.questions.length) * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Vollständigkeit</div>
                      </div>
                    </div>
                  </div>

                  {/* Zusätzliche Optionen */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button 
                      onClick={() => {
                        setDialogCompleted(false)
                        setShowExtraction(false)
                        setExtractionPreview({})
                        setDialogState(prev => ({
                          ...prev,
                          active: true,
                          questionIndex: 0,
                          answers: {}
                        }))
                        setChatHistory([
                          { role: "assistant", content: "Neuer Dialog gestartet. Lassen Sie uns von vorne beginnen." },
                          { role: "assistant", content: dialogState.questions[0]?.frage || "" }
                        ])
                      }}
                      variant="outline"
                      className="text-emerald-600 border-emerald-300 hover:bg-emerald-50"
                    >
                      📝 Neuer Dialog starten
                    </Button>
                    
                    <Button 
                      onClick={() => {
                        setDialogCompleted(false)
                        setQuestionsGenerated(false)
                        setQuestionsDownloaded(false)
                        setShowExtraction(false)
                        setExtractionPreview({})
                        setDialogState({ active: false, questionIndex: 0, questions: [], answers: {} })
                        setChatHistory([])
                        setContext("")
                        setUserInput("")
                      }}
                      variant="outline"
                      className="text-gray-600 border-gray-300 hover:bg-gray-50"
                    >
                      🔄 Komplett neu starten
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SETUP & AKTIVER DIALOG BEREICH - Versteckt sich wenn Dialog abgeschlossen */}
        {!dialogCompleted && (
          <>
            {!dialogState.active ? (
              questionsGenerated ? (
                /* BEREICH: Fragen generiert - Download möglich */
                <div className="space-y-6">
                  <Card className="bg-white border border-gray-200 max-w-2xl mx-auto">
                    <CardHeader>
                      <CardTitle className="text-xl text-green-700 text-center">
                        ✅ Fragen erfolgreich generiert!
                      </CardTitle>
                      <p className="text-gray-600 text-center">
                        {dialogState.questions.length} Fragen wurden basierend auf Ihrem Kontext erstellt.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Fragen-Vorschau */}
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Generierte Fragen (Vorschau):
                        </label>
                        <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            {dialogState.questions.map((q, index) => (
                              <li key={index}>
                                <strong>{q.feld}:</strong> {q.frage}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {/* Download-Aktionen */}
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"/>
                            </svg>
                            <div>
                              <h4 className="font-medium text-blue-900">Fragen speichern (empfohlen)</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                Speichern Sie die generierten Fragen als JSON-Datei für späteren Vergleich.
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Download Button */}
                        <Button 
                          onClick={handleDownloadQuestions}
                          disabled={questionsDownloaded}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                        >
                          {questionsDownloaded ? (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                              </svg>
                              Fragen gespeichert
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"/>
                              </svg>
                              Fragen als JSON speichern
                            </>
                          )}
                        </Button>

                        {/* Dialog starten Button */}
                        <Button 
                          onClick={handleBeginDialog}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
                        >
                          Dialog jetzt starten
                          <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                          </svg>
                        </Button>

                        {/* Zurück-Option */}
                        <Button 
                          onClick={() => {
                            setQuestionsGenerated(false)
                            setQuestionsDownloaded(false)
                            setDialogState({ active: false, questionIndex: 0, questions: [], answers: {} })
                          }}
                          variant="outline"
                          className="w-full"
                        >
                          Zurück zur Kontexteingabe
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                /* URSPRÜNGLICHER Setup-Bereich */
                <Card className="bg-white border border-gray-200 max-w-2xl mx-auto">
                  <CardHeader>
                    <CardTitle className="text-xl text-gray-900 text-center">Dialog vorbereiten</CardTitle>
                    <p className="text-gray-600 text-center">
                      Optional können Sie Kontextinformationen eingeben, bevor der Dialog startet.
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
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Fragen werden generiert...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1-2H8l-1 2H5V5z"/>
                          </svg>
                          Fragen generieren & Dialog vorbereiten
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            ) : (
              /* AKTIVER DIALOG-BEREICH */
              <div className="space-y-6">
                {/* Fortschrittsanzeige */}
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Dialog-Fortschritt</span>
                    <span className="text-sm text-gray-600">
                      Frage {dialogState.questionIndex + 1} von {dialogState.questions.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Chat-Bereich */}
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Dialog-Verlauf</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto mb-4">
                      {chatHistory.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              message.role === 'user'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            {message.content}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Ihre Antwort eingeben... (? für Nachfragen)"
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!userInput.trim()}
                        className="bg-emerald-600 hover:bg-emerald-700 px-6"
                      >
                        Senden
                      </Button>
                    </div>

                    <p className="text-xs text-gray-500 mt-2 text-center">
                      💡 Tipp: Stellen Sie Nachfragen mit einem "?" am Ende
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}