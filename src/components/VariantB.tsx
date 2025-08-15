// src/components/VariantB.tsx - VOLLSTÄNDIG ÜBERARBEITET
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Save, Play, Send, HelpCircle, CheckCircle, Clock } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
}

interface DialogQuestion {
  id: string
  question: string
  answered: boolean
  answer?: string
}

interface VariantBProps {
  onComplete?: (data: any) => void
  startTime?: Date
}

export default function VariantB({ onComplete, startTime }: VariantBProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isStudy = searchParams.get('study') === 'true'
  const participantId = searchParams.get('participant')
  const variant = searchParams.get('variant')
  const step = searchParams.get('step')

  // Dialog State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isDialogStarted, setIsDialogStarted] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isCompleted, setIsCompleted] = useState(false)
  const [progress, setProgress] = useState(0)

  // Dialog Questions
  const dialogQuestions: DialogQuestion[] = [
    { id: 'q1', question: 'Welche Gebäudeseite soll hauptsächlich saniert werden?', answered: false },
    { id: 'q2', question: 'Welches Dämmmaterial ist für Ihr Vorhaben vorgesehen?', answered: false },
    { id: 'q3', question: 'Wurden bereits andere energetische Maßnahmen am Gebäude durchgeführt?', answered: false },
    { id: 'q4', question: 'Handelt es sich um eine freiwillige Modernisierung oder besteht eine gesetzliche Verpflichtung?', answered: false }
  ]

  // Initialize
  useEffect(() => {
    const id = `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(id)
    
    console.log('🎬 VariantB initialized:', { isStudy, participantId, variant, step, sessionId: id })
  }, [])

  // Calculate progress
  useEffect(() => {
    const answeredCount = Object.keys(answers).length
    const totalQuestions = dialogQuestions.length
    const newProgress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0
    setProgress(newProgress)
    
    if (answeredCount === totalQuestions) {
      setIsCompleted(true)
    }
  }, [answers])

  // Start Dialog
  const handleStartDialog = async () => {
    if (isDialogStarted) return
    
    setIsLoading(true)
    console.log('🚀 Starting dialog...', { sessionId })
    
    try {
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        message: `👋 **Willkommen zum Dialog-System!**

Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung und führe Sie durch 4 wichtige Fragen.

**Ihr Szenario:** 
Mehrfamilienhaus (Baujahr 1965), WDVS-Sanierung der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung.

**📋 Erste Frage (1/4):** 
Welche Gebäudeseite soll hauptsächlich saniert werden?

*Geben Sie Ihre Antwort ein und ich führe Sie zur nächsten Frage.*`,
        timestamp: new Date()
      }
      
      setChatHistory([welcomeMessage])
      setIsDialogStarted(true)
      
    } catch (error) {
      console.error('❌ Error starting dialog:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Send Message
  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return
    
    const currentMessage = userMessage.trim()
    setUserMessage('')
    setIsLoading(true)
    
    console.log('💬 Sending message:', { 
      message: currentMessage, 
      sessionId, 
      questionIndex: currentQuestionIndex 
    })
    
    // Add user message
    const newUserMessage: ChatMessage = {
      role: 'user',
      message: currentMessage,
      timestamp: new Date()
    }
    setChatHistory(prev => [...prev, newUserMessage])
    
    try {
      const response = await fetch('/api/dialog/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentMessage,
          session_id: sessionId,
          questionIndex: currentQuestionIndex
        })
      })
      
      if (!response.ok) {
        throw new Error(`Dialog API failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Dialog response received:', data)
      
      // Validate response
      if (!data.response || data.response.trim().length < 5) {
        throw new Error('Invalid LLM response')
      }
      
      // Add API response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        message: data.response,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, assistantMessage])
      
      // Update state
      if (data.answers_collected) {
        setAnswers(data.answers_collected)
      }
      
      if (data.question_index !== undefined) {
        setCurrentQuestionIndex(data.question_index)
      }
      
      if (data.dialog_complete) {
        setIsCompleted(true)
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        role: 'assistant',
        message: `❌ **Entschuldigung, es gab einen technischen Fehler.**

Das LLM-System ist möglicherweise nicht verfügbar. Bitte versuchen Sie es erneut.

**Für Hilfe:** Geben Sie "?" ein oder kontaktieren Sie den Support.`,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Save Data
  const handleSave = async () => {
    console.log('💾 Saving dialog data...', {
      answers, isCompleted, chatHistory: chatHistory.length
    })
    
    try {
      setIsLoading(true)
      
      const dialogData = {
        variant: 'B',
        participantId: participantId,
        session_id: sessionId,
        answers: answers,
        chatHistory: chatHistory,
        timestamp: new Date().toISOString(),
        metadata: {
          completion_rate: progress,
          total_questions: dialogQuestions.length,
          answered_questions: Object.keys(answers).length,
          is_completed: isCompleted,
          chat_interactions: chatHistory.length
        }
      }
      
      const response = await fetch('/api/dialog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dialogData)
      })
      
      if (!response.ok) throw new Error('Save failed')
      
      console.log('✅ Dialog data saved successfully')
      
      if (isStudy) {
        const nextStep = step === '2' ? 'variant1_survey' : 'variant2_survey'
        console.log('🔄 Navigating to:', nextStep)
        router.push(`/study?step=${nextStep}&participant=${participantId}`)
      } else {
        alert('Daten erfolgreich gespeichert!')
        if (onComplete) onComplete(dialogData)
      }
      
    } catch (error) {
      console.error('❌ Save error:', error)
      alert('Fehler beim Speichern. Versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  💬 Dialog-System (Variante B)
                </h1>
                <p className="text-gray-600 mt-1">
                  Schritt-für-Schritt Datenerfassung durch KI-Dialog
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-2">
                  {isStudy ? `Teilnehmer ${participantId}` : 'Demo-Modus'}
                </Badge>
                <div className="text-sm text-gray-500">
                  Fortschritt: {progress}% ({Object.keys(answers).length}/{dialogQuestions.length})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout - 2/3 Dialog + 1/3 Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dialog Area (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Start Button */}
            {!isDialogStarted && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <MessageCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Dialog starten</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Klicken Sie auf "Dialog starten" und ich führe Sie durch 4 wichtige Fragen 
                      zu Ihrer Gebäude-Energieberatung.
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        <strong>💡 Tipp:</strong> Antworten Sie natürlich, als würden Sie mit einem Berater sprechen. 
                        Für Hilfe tippen Sie einfach "?" ein.
                      </p>
                    </div>
                    <Button 
                      onClick={handleStartDialog}
                      disabled={isLoading}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {isLoading ? 'Wird gestartet...' : 'Dialog starten'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chat Interface */}
            {isDialogStarted && (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    KI-Energieberater
                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                  </CardTitle>
                </CardHeader>
                
                {/* Chat Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="whitespace-pre-wrap text-sm">
                            {msg.message}
                          </div>
                          <div className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-purple-100' : 'text-gray-500'
                          }`}>
                            {msg.timestamp.toLocaleTimeString('de-DE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                            <span className="text-sm text-gray-600">KI-Assistent tippt...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                
                {/* Chat Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ihre Antwort eingeben... (oder '?' für Hilfe)"
                      className="flex-1 min-h-[60px] resize-none"
                      disabled={isLoading || isCompleted}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!userMessage.trim() || isLoading || isCompleted}
                      className="h-[60px] px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      Enter = Senden • Shift+Enter = Neue Zeile
                    </span>
                    <span>
                      {userMessage.length}/500
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Status Panel (1/3) */}
          <div className="space-y-4">
            
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Fortschritt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Fragen beantwortet</span>
                      <span>{Object.keys(answers).length}/{dialogQuestions.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Question Status */}
                  <div className="space-y-2">
                    {dialogQuestions.map((q, index) => (
                      <div
                        key={q.id}
                        className={`p-2 rounded text-xs ${
                          answers[`question_${index + 1}`]
                            ? 'bg-green-100 text-green-800'
                            : index === currentQuestionIndex
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {answers[`question_${index + 1}`] ? (
                            <CheckCircle className="w-3 h-3" />
                          ) : index === currentQuestionIndex ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <div className="w-3 h-3 rounded-full border border-gray-300" />
                          )}
                          <span className="font-medium">Frage {index + 1}</span>
                        </div>
                        <div className="mt-1 text-xs opacity-75">
                          {q.question.length > 60 ? q.question.substring(0, 60) + '...' : q.question}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Hilfe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-1">💡 Tipps</h4>
                    <ul className="text-blue-700 space-y-1 text-xs">
                      <li>• Antworten Sie natürlich und ausführlich</li>
                      <li>• Bei Unsicherheit: "?" eingeben</li>
                      <li>• Nutzen Sie das Szenario als Orientierung</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-3 rounded border">
                    <h4 className="font-semibold text-gray-800 mb-1">🏠 Ihr Szenario</h4>
                    <p className="text-xs text-gray-600">
                      Mehrfamilienhaus (Baujahr 1965), WDVS-Sanierung 
                      Eingangsfassade Südseite, 140mm Mineralwolle
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <h4 className="font-semibold text-yellow-800 mb-1">⚠️ Technische Hilfe</h4>
                    <p className="text-xs text-yellow-700">
                      Bei Problemen: Seite neu laden (Strg+F5)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            {isCompleted && (
              <Card>
                <CardContent className="p-4">
                  <Button
                    onClick={handleSave}
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Wird gespeichert...' : 'Ergebnisse speichern'}
                  </Button>
                  
                  {isStudy && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Nach dem Speichern gelangen Sie automatisch zum Fragebogen.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}