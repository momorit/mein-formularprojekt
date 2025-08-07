'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { startDialog, sendDialogMessage, saveDialogData } from '@/lib/api'
import type { DialogQuestion, DialogStartResponse, ChatMessage } from '@/lib/types'

export default function FormBPage() {
  const [context, setContext] = useState("")
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [questions, setQuestions] = useState<DialogQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userInput, setUserInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [dialogActive, setDialogActive] = useState(false)
  const [dialogComplete, setDialogComplete] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState("")

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setContext(prev => prev + (prev ? ' ' : '') + `[PDF hochgeladen: ${file.name}]`)
    } else {
      alert("Bitte laden Sie nur PDF-Dateien hoch")
    }
  }

  const handleStartDialog = async () => {
    if (!context.trim()) {
      alert("Bitte geben Sie einen Kontext ein oder laden Sie eine PDF hoch")
      return
    }

    setLoading(true)
    
    try {
      const result: DialogStartResponse = await startDialog(context)
      setQuestions(result.questions)
      setCurrentQuestionIndex(0)
      setDialogActive(true)
      
      // Erste Frage als Chat-Nachricht hinzufügen
      const firstQuestion: ChatMessage = {
        type: 'bot',
        message: result.questions[0]?.question || "Beginnen wir mit den Fragen...",
        timestamp: new Date()
      }
      setChatHistory([firstQuestion])
      
    } catch (error) {
      console.error("Dialog-Start failed:", error)
      alert("❌ Fehler beim Starten des Dialogs")
    } finally {
      setLoading(false)
    }
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
            message: nextQuestion.question,
            timestamp: new Date()
          }
          setChatHistory(prev => [...prev, nextQuestionMessage])
        }
      }

      if (response.dialogComplete) {
        setDialogComplete(true)
        setDialogActive(false)
        
        // Automatisches Speichern nach Abschluss
        await handleAutoSave()
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

  const handleAutoSave = async () => {
    setAutoSaving(true)
    setSaveSuccess("")

    try {
      const result = await saveDialogData(questions, answers, chatHistory)
      setSaveSuccess(`✅ Dialog automatisch in Google Drive gespeichert!
📁 Datei: ${result.filename}
📂 Ordner: ${result.folder}
🔗 Link: ${result.web_link ? 'Verfügbar' : 'Wird generiert...'}`)
      
      // Optional: Nach Erfolg zur Startseite weiterleiten
      setTimeout(() => {
        if (confirm("Dialog erfolgreich abgeschlossen und gespeichert! Möchten Sie zur Startseite zurückkehren?")) {
          window.location.href = '/'
        }
      }, 4000)
    } catch (error) {
      console.error("Auto-Save error:", error)
      setSaveSuccess("❌ Automatisches Speichern fehlgeschlagen. Versuchen Sie es manuell.")
    } finally {
      setAutoSaving(false)
    }
  }

  const handleManualSave = async () => {
    await handleAutoSave()
  }

  const handleReset = () => {
    if (confirm("Möchten Sie den Dialog wirklich zurücksetzen? Alle Antworten gehen verloren.")) {
      setContext("")
      setPdfFile(null)
      setQuestions([])
      setCurrentQuestionIndex(0)
      setAnswers({})
      setChatHistory([])
      setUserInput("")
      setLoading(false)
      setDialogActive(false)
      setDialogComplete(false)
      setAutoSaving(false)
      setSaveSuccess("")
    }
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
            Interaktiver Dialog mit Schritt-für-Schritt Fragen
          </p>
        </div>

        <div className="grid gap-8">
          {/* Kontext & Setup */}
          {!dialogActive && !dialogComplete && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                1️⃣ Kontext & Material
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontext-Beschreibung
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Beschreiben Sie, worüber Sie befragt werden möchten..."
                    className="w-full h-32 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PDF-Dokument hochladen (optional)
                  </label>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={loading}
                  />
                  {pdfFile && (
                    <div className="mt-2 text-sm text-green-600">
                      ✅ {pdfFile.name} hochgeladen
                    </div>
                  )}
                </div>

                <button
                  onClick={handleStartDialog}
                  disabled={loading || !context.trim()}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Dialog wird vorbereitet...
                    </>
                  ) : (
                    "🚀 Dialog starten"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Dialog-Bereich */}
          {(dialogActive || dialogComplete) && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">
                  2️⃣ Dialog {dialogComplete ? "(Abgeschlossen)" : "(Aktiv)"}
                </h2>
                <div className="text-sm text-gray-600">
                  Frage {Math.min(currentQuestionIndex + 1, questions.length)} von {questions.length}
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

              {/* Auto-Save Status */}
              {(dialogComplete || autoSaving) && (
                <div className="space-y-4">
                  {saveSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="text-green-800 whitespace-pre-line">
                        {saveSuccess}
                      </div>
                    </div>
                  )}
                  
                  {autoSaving && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-blue-800">
                        Speichere automatisch in Google Drive...
                      </span>
                    </div>
                  )}
                  
                  {dialogComplete && !autoSaving && !saveSuccess && (
                    <button
                      onClick={handleManualSave}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      💾 Manuell in Google Drive speichern
                    </button>
                  )}
                </div>
              )}

              {/* Hilfsinformationen */}
              <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                <strong>💡 Tipps:</strong>
                <ul className="mt-2 space-y-1">
                  <li>• Antworten Sie natürlich auf die Fragen</li>
                  <li>• Schreiben Sie "?" für Hilfe zur aktuellen Frage</li>
                  <li>• Ihre Daten werden automatisch in Google Drive gespeichert</li>
                </ul>
              </div>
            </div>
          )}

          {/* Reset-Button */}
          {(dialogActive || dialogComplete) && (
            <div className="text-center">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                🔄 Dialog zurücksetzen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}