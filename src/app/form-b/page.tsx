'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { sendDialogMessage, saveDialogData } from '@/lib/api'
import type { DialogQuestion, ChatMessage } from '@/lib/types'

// Variante B: 4 Dialog-Fragen (2 leichte + 2 schwere, andere Themen als Variante A)
const FIXED_QUESTIONS: DialogQuestion[] = [
  {
    question: "Wie groß ist die Wohnfläche Ihres Gebäudes insgesamt? (Bitte in Quadratmetern angeben, z.B. 120)",
    field: "WOHNFLÄCHE",
    difficulty: "leicht"
  },
  {
    question: "Welche Art der Heizung ist in Ihrem Gebäude installiert? (z.B. Gas-Zentralheizung, Wärmepumpe, Fernwärme, Ölheizung)",
    field: "HEIZUNGSART", 
    difficulty: "leicht"
  },
  {
    question: "Beschreiben Sie detailliert den Dachtyp und Dachzustand Ihres Gebäudes. Berücksichtigen Sie dabei: Art des Daches (Satteldach, Flachdach, Walmdach, etc.), Eindeckungsmaterial (Ziegel, Schiefer, Blech, etc.), Zustand der Dachrinnen, eventuelle Dachfenster oder Gauben, und ob das Dach bereits gedämmt ist.",
    field: "DACHTYP_DETAIL",
    difficulty: "schwer"
  },
  {
    question: "Geben Sie eine umfassende Beschreibung der vorhandenen Isolierung und Dämmung Ihres Gebäudes. Berücksichtigen Sie dabei: Fassadendämmung (WDVS, Kerndämmung, oder keine), Dachdämmung (Zwischensparren, Aufsparren, oder Geschossdecke), Kellerdämmung, U-Werte falls bekannt, Zeitpunkt der Dämmarbeiten, und geplante Verbesserungen der Dämmung.",
    field: "ISOLIERUNG_DETAIL",
    difficulty: "schwer"
  }
]

export default function FormBPage() {
  const [questions] = useState<DialogQuestion[]>(FIXED_QUESTIONS)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [dialogActive, setDialogActive] = useState(false)
  const [dialogComplete, setDialogComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")

  const handleStartDialog = () => {
    setDialogActive(true)
    setCurrentQuestionIndex(0)
    
    // Willkommensnachricht und erste Frage
    const welcomeMessage: ChatMessage = {
      type: 'bot',
      message: "Willkommen zur Gebäudeerfassung! Ich stelle Ihnen 4 Fragen zu Ihrem Gebäude. Sie können jederzeit '?' eingeben, um Hilfe zu einer Frage zu erhalten.",
      timestamp: new Date()
    }
    
    const firstQuestion: ChatMessage = {
      type: 'bot',
      message: `Frage 1 von ${questions.length} (${questions[0].difficulty}): ${questions[0].question}`,
      timestamp: new Date()
    }
    
    setChatHistory([welcomeMessage, firstQuestion])
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim() || !dialogActive) return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // User-Nachricht hinzufügen
    const userMessage: ChatMessage = {
      type: 'user',
      message: userInput,
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, userMessage])

    try {
      const response = await sendDialogMessage(
        userInput,
        currentQuestion,
        currentQuestionIndex,
        questions.length
      )

      // Bot-Antwort hinzufügen
      const botMessage: ChatMessage = {
        type: 'bot',
        message: response.response,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, botMessage])

      // Antwort speichern (außer bei Hilfe-Anfragen)
      if (userInput !== "?" && !response.helpProvided) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.field]: userInput
        }))
      }

      if (response.nextQuestion && response.questionIndex !== undefined) {
        // Zur nächsten Frage
        setCurrentQuestionIndex(response.questionIndex)
        
        if (response.questionIndex < questions.length) {
          const nextQuestion = questions[response.questionIndex]
          const nextQuestionMessage: ChatMessage = {
            type: 'bot',
            message: `Frage ${response.questionIndex + 1} von ${questions.length} (${nextQuestion.difficulty}): ${nextQuestion.question}`,
            timestamp: new Date()
          }
          setChatHistory(prev => [...prev, nextQuestionMessage])
        }
      }

      if (response.dialogComplete) {
        setDialogComplete(true)
        setDialogActive(false)
        
        // Zeige "Umfrage beenden" Button
        const finishMessage: ChatMessage = {
          type: 'bot',
          message: "🎉 Alle Fragen beantwortet! Sie können nun die Umfrage beenden um Ihre Antworten zu speichern.",
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, finishMessage])
      }

    } catch (error) {
      console.error("Dialog message error:", error)
      const errorMessage: ChatMessage = {
        type: 'bot',
        message: "Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.",
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
    }

    setUserInput("")
  }

  const handleFinishSurvey = async () => {
    setSaving(true)

    try {
      const result = await saveDialogData(questions, answers, chatHistory)
      
      setSaveSuccess(`✅ Umfrage erfolgreich abgeschlossen und gespeichert!
      
📁 Ihre Daten wurden automatisch gespeichert.
📂 Google Drive Ordner: ${result.folder}
📄 Dateiname: ${result.filename}

Sie können das Browserfenster jetzt schließen.`)
      
      setCompleted(true)
      
    } catch (error) {
      console.error("Auto-Save error:", error)
      setSaveSuccess("❌ Speichern fehlgeschlagen. Bitte versuchen Sie es erneut.")
    } finally {
      setSaving(false)
    }
  }

  if (completed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-green-800 mb-4">
              Umfrage erfolgreich abgeschlossen!
            </h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <div className="text-green-800 whitespace-pre-line text-left">
                {saveSuccess}
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Vielen Dank für Ihre Teilnahme an der Studie zur Gebäudeerfassung!
            </p>
            <div className="text-sm text-gray-500">
              Sie können dieses Browserfenster jetzt schließen.
            </div>
          </div>
        </div>
      </div>
    )
  }

  const progress = questions.length > 0 ? (Object.keys(answers).length / questions.length) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-green-600 hover:text-green-800 mb-4 text-sm">
            ← Zurück zur Hauptseite
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            💬 Variante B: Dialog-System
          </h1>
          <p className="text-gray-600">
            Interaktiver Dialog mit {questions.length} Fragen zur Gebäudeerfassung
          </p>
        </div>

        <div className="grid gap-8">
          {/* Start-Button */}
          {!dialogActive && !dialogComplete && (
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                🏢 Gebäudeerfassung - Dialog starten
              </h2>
              
              <div className="space-y-4">
                <p className="text-gray-600">
                  Ich führe Sie durch {questions.length} Fragen zur Erfassung Ihres Gebäudes 
                  für die energetische Sanierung.
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                  <strong>💡 Fragen-Überblick:</strong>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>• Wohnfläche (leicht)</div>
                    <div>• Heizungsart (leicht)</div>
                    <div>• Dachtyp & Details (schwer)</div>
                    <div>• Isolierung & Dämmung (schwer)</div>
                  </div>
                </div>

                <button
                  onClick={handleStartDialog}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors text-lg"
                >
                  🚀 Dialog starten
                </button>
              </div>
            </div>
          )}

          {/* Dialog-Bereich */}
          {(dialogActive || dialogComplete) && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  🏢 Gebäudeerfassung {dialogComplete ? "(Bereit zum Beenden)" : "(Aktiv)"}
                </h2>
                <div className="text-sm text-gray-600">
                  {Object.keys(answers).length}/{questions.length} Fragen beantwortet
                </div>
              </div>

              {/* Fortschrittsbalken */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {/* Chat-History */}
              <div className="h-96 border border-gray-200 rounded-lg p-4 overflow-y-auto mb-4 bg-gray-50">
                <div className="space-y-3">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md px-4 py-2 rounded-lg text-sm ${
                        msg.type === 'user' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-white border border-gray-200 text-gray-800'
                      }`}>
                        {msg.message}
                        <div className={`text-xs mt-1 opacity-70 ${
                          msg.type === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dialog-Input */}
              {dialogActive && (
                <form onSubmit={handleSendMessage} className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ihre Antwort... (Tipp: '?' für Hilfe)"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!userInput.trim()}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    📤 Senden
                  </button>
                </form>
              )}

              {/* Umfrage beenden Button */}
              {dialogComplete && (
                <div className="mt-6">
                  <button
                    onClick={handleFinishSurvey}
                    disabled={saving}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                        Umfrage wird gespeichert...
                      </>
                    ) : (
                      "🎯 Umfrage beenden"
                    )}
                  </button>
                  
                  <div className="text-sm text-gray-500 text-center mt-3">
                    Ihre Daten werden automatisch und sicher gespeichert
                  </div>
                </div>
              )}

              {/* Hilfsinformationen */}
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <strong>💡 Tipps:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Antworten Sie natürlich auf die Fragen</li>
                  <li>• Schreiben Sie "?" für Hilfe zur aktuellen Frage</li>
                  <li>• Bei den schweren Fragen können Sie schätzen falls Sie unsicher sind</li>
                  <li>• Seien Sie bei komplexen Fragen möglichst detailliert</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}