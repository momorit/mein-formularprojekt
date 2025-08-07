'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { startDialog, sendDialogMessage, saveDialogData, checkSystemStatus } from '@/lib/api'
import type { DialogQuestion, ChatMessage, SaveResponse } from '@/lib/types'

export default function FormBPage() {
  // === STATE MANAGEMENT ===
  const [context, setContext] = useState("")
  const [questions, setQuestions] = useState<DialogQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  
  // UI States
  const [loading, setLoading] = useState(false)
  const [dialogActive, setDialogActive] = useState(false)
  const [dialogComplete, setDialogComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [saveResult, setSaveResult] = useState<SaveResponse | null>(null)
  
  // System Status
  const [systemOnline, setSystemOnline] = useState(true)
  const [startTime] = useState(new Date())

  // === SYSTEM CHECK ===
  useEffect(() => {
    checkSystemStatus().then(setSystemOnline)
  }, [])

  // === DIALOG START ===
  const handleStartDialog = async () => {
    if (!systemOnline) {
      alert('System ist nicht verfügbar. Bitte versuchen Sie es später erneut.')
      return
    }

    setLoading(true)
    
    try {
      const result = await startDialog(context)
      setQuestions(result.questions)
      setCurrentQuestionIndex(0)
      setDialogActive(true)
      
      // Welcome message and first question
      const welcomeMessage: ChatMessage = {
        type: 'bot',
        message: `Willkommen zum Gebäude-Dialog! Ich führe Sie durch ${result.totalQuestions} Fragen zu Ihrem Gebäude. Sie können jederzeit '?' eingeben, um Hilfe zu einer Frage zu erhalten.`,
        timestamp: new Date()
      }
      
      const firstQuestion: ChatMessage = {
        type: 'bot',
        message: `Frage 1 von ${result.totalQuestions}: ${result.questions[0].question}`,
        timestamp: new Date()
      }
      
      setChatHistory([welcomeMessage, firstQuestion])
      
    } catch (error) {
      console.error("Dialog start failed:", error)
      alert("Fehler beim Starten des Dialogs. Bitte versuchen Sie es erneut.")
    } finally {
      setLoading(false)
    }
  }

  // === MESSAGE HANDLING ===
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userInput.trim() || !dialogActive) return

    const currentQuestion = questions[currentQuestionIndex]
    if (!currentQuestion) return

    // Add user message
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

      // Add bot response
      const botMessage: ChatMessage = {
        type: 'bot',
        message: response.response,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, botMessage])

      // Save answer (except for help requests)
      if (userInput !== "?" && !response.helpProvided) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.field]: userInput
        }))
      }

      // Handle next question
      if (response.nextQuestion && response.questionIndex !== undefined) {
        setCurrentQuestionIndex(response.questionIndex)
        
        if (response.questionIndex < questions.length) {
          const nextQuestion = questions[response.questionIndex]
          const nextQuestionMessage: ChatMessage = {
            type: 'bot',
            message: `Frage ${response.questionIndex + 1} von ${questions.length}: ${nextQuestion.question}`,
            timestamp: new Date()
          }
          setChatHistory(prev => [...prev, nextQuestionMessage])
        }
      }

      // Handle dialog completion
      if (response.dialogComplete) {
        setDialogComplete(true)
        setDialogActive(false)
        
        const completionMessage: ChatMessage = {
          type: 'bot',
          message: "🎉 Alle Fragen beantwortet! Sie können nun Ihre Antworten speichern.",
          timestamp: new Date()
        }
        setChatHistory(prev => [...prev, completionMessage])
      }

    } catch (error) {
      console.error("Dialog message error:", error)
      const errorMessage: ChatMessage = {
        type: 'bot',
        message: "Es gab einen Fehler bei der Verarbeitung. Bitte versuchen Sie es erneut.",
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, errorMessage])
    }

    setUserInput("")
  }

  // === SAVE HANDLING ===
  const handleSaveDialog = async () => {
    setSaving(true)

    try {
      const result = await saveDialogData(questions, answers, chatHistory)
      setSaveResult(result)
      setCompleted(true)
    } catch (error) {
      console.error("Save failed:", error)
      alert("Fehler beim Speichern. Bitte versuchen Sie es erneut.")
    } finally {
      setSaving(false)
    }
  }

  // === COMPLETION SCREEN ===
  if (completed && saveResult) {
    const duration = Math.round((new Date().getTime() - startTime.getTime()) / 1000 / 60)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Variante B erfolgreich abgeschlossen
            </h1>
            
            <p className="text-lg text-gray-600 mb-8">
              Vielen Dank für Ihre Teilnahme am Dialog-System. Ihre Antworten wurden sicher gespeichert.
            </p>

            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Speicherdetails</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Speicherort:</span>
                  <span className="font-medium">{saveResult.storage === 'google_drive' ? 'Google Drive (Cloud)' : 'Lokal'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dateiname:</span>
                  <span className="font-medium font-mono text-xs">{saveResult.filename}</span>
                </div>
                {saveResult.folder && (
                  <div className="flex justify-between">
                    <span>Ordner:</span>
                    <span className="font-medium">{saveResult.folder}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Bearbeitungszeit:</span>
                  <span className="font-medium">{duration} Minuten</span>
                </div>
                <div className="flex justify-between">
                  <span>Dialog-Interaktionen:</span>
                  <span className="font-medium">{chatHistory.length} Nachrichten</span>
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link 
                href="/form-a" 
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Zu Variante A
              </Link>
              <Link 
                href="/" 
                className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Zur Hauptseite
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // === MAIN INTERFACE ===
  const progress = questions.length > 0 ? Math.round((Object.keys(answers).length / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-green-600 hover:text-green-800 mb-6 text-sm font-medium">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Zurück zur Hauptseite
          </Link>
          
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              Variante B: Dialog-System
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Interaktive Gebäudeerfassung durch natürlichen Dialog
            </p>
          </div>

          {/* System Status */}
          <div className="flex justify-center items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${systemOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-600">
                System {systemOnline ? 'online' : 'offline'}
              </span>
            </div>
            <div className="text-gray-400">•</div>
            <div className="text-gray-600">HAW Hamburg</div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Context & Start Section */}
          {!dialogActive && !dialogComplete && (
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Dialog-basierte Gebäudeerfassung
              </h2>
              
              <p className="text-gray-600 mb-6">
                Das System führt Sie interaktiv durch die Gebäudeerfassung. 
                Sie können optional einen Kontext eingeben, um spezifische Fragen zu erhalten.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Kontext (optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Beispiel: Wir wollen unser Einfamilienhaus von 1975 energetisch sanieren..."
                  className="w-full h-24 p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleStartDialog}
                disabled={loading || !systemOnline}
                className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Dialog wird vorbereitet...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.017 8.017 0 01-6.1-2.9L3 21l3.9-3.9A8.017 8.017 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                    </svg>
                    Dialog starten
                  </>
                )}
              </button>
            </div>
          )}

          {/* Dialog Interface */}
          {(dialogActive || dialogComplete) && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Gebäude-Dialog {dialogComplete ? "(Abgeschlossen)" : "(Aktiv)"}
                </h2>
                <div className="text-sm text-gray-500">
                  {Object.keys(answers).length} von {questions.length} Fragen beantwortet
                </div>
              </div>

              {/* Progress Bar */}
              {questions.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Fortschritt</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-green-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Chat History */}
              <div className="border border-gray-200 rounded-xl p-6 mb-6 bg-gray-50 h-96 overflow-y-auto">
                <div className="space-y-4">
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md px-4 py-3 rounded-xl text-sm ${
                        msg.type === 'user' 
                          ? 'bg-green-600 text-white shadow-lg' 
                          : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.message}</div>
                        <div className={`text-xs mt-2 opacity-70 ${
                          msg.type === 'user' ? 'text-green-100' : 'text-gray-500'
                        }`}>
                          {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              {dialogActive && (
                <form onSubmit={handleSendMessage} className="flex gap-3 mb-6">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Ihre Antwort... (Tipp: '?' für Hilfe)"
                    className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                    disabled={!systemOnline}
                  />
                  <button
                    type="submit"
                    disabled={!userInput.trim() || !systemOnline}
                    className="bg-green-600 text-white px-6 py-4 rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    <span className="ml-2 hidden sm:inline">Senden</span>
                  </button>
                </form>
              )}

              {/* Save Button */}
              {dialogComplete && (
                <div className="border-t pt-6">
                  <button
                    onClick={handleSaveDialog}
                    disabled={saving}
                    className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-lg font-medium flex items-center justify-center"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Dialog wird gespeichert...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Dialog speichern und abschließen
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Help Information */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 Hilfreiche Tipps:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Antworten Sie natürlich und ausführlich auf die Fragen</li>
                  <li>• Schreiben Sie "?" um spezifische Hilfe zur aktuellen Frage zu erhalten</li>
                  <li>• Bei Unsicherheiten können Sie schätzen oder "unbekannt" angeben</li>
                  <li>• Ihre Antworten werden automatisch gespeichert</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}