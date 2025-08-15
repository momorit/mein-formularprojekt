// src/components/VariantB.tsx - KOMPLETT REPARIERT
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Save, Send, Play, CheckCircle } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // State Management
  const [dialogStarted, setDialogStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions] = useState(4)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [sessionId, setSessionId] = useState('')

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  // Start Dialog
  const startDialog = async () => {
    setIsLoading(true)
    setDialogStarted(true)
    
    try {
      const response = await fetch('/api/dialog/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: 'Mehrfamilienhaus Baujahr 1965, Eingangsfassade Südseite, WDVS-Sanierung 140mm Mineralwolle, Ölheizung, Mieterin EG rechts 57.5m²',
        })
      })
      
      if (!response.ok) throw new Error('Failed to start dialog')
      
      const data = await response.json()
      
      setSessionId(data.session_id || `session_${Date.now()}`)
      setCurrentQuestionIndex(0)
      
      setChatHistory([{
        role: 'assistant',
        message: data.welcome_message,
        timestamp: new Date()
      }])
      
      console.log('✅ Dialog started successfully')
      
    } catch (error) {
      console.error('❌ Failed to start dialog:', error)
      
      // Robust Fallback
      const fallbackSessionId = `fallback_${Date.now()}`
      setSessionId(fallbackSessionId)
      setChatHistory([{
        role: 'assistant',
        message: `Hallo! Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung.

**Ihr Szenario:** Mehrfamilienhaus (Baujahr 1965), WDVS-Sanierung der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung.

**Erste Frage (1/4):** Welche Gebäudeseite soll hauptsächlich saniert werden?`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Send Message with better error handling
  const handleSendMessage = async () => {
    if (!userMessage.trim()) return
    
    const currentMessage = userMessage.trim()
    setUserMessage('')
    setIsLoading(true)
    
    console.log('💬 Sending message:', { 
      message: currentMessage, 
      sessionId, 
      questionIndex: currentQuestionIndex 
    })
    
    // Add user message immediately
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
      if (!data.response || data.response.trim().length < 10) {
        throw new Error('Invalid or empty LLM response')
      }
      
      // Add API response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        message: data.response,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, assistantMessage])
      
      // Update state based on API response
      if (data.answers_collected) {
        setAnswers(data.answers_collected)
        console.log('📋 Updated answers:', data.answers_collected)
      }
      
      if (data.question_index !== undefined) {
        setCurrentQuestionIndex(data.question_index)
        console.log('📊 Updated question index:', data.question_index)
      }
      
      if (data.dialog_complete) {
        setIsCompleted(true)
        console.log('🎉 Dialog completed!')
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      
      // Detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler'
      const fallbackMessage: ChatMessage = {
        role: 'assistant',
        message: `Entschuldigung, es gab einen technischen Fehler: ${errorMessage}

**Bitte versuchen Sie es erneut.** Falls das Problem weiterhin besteht, ist das LLM-System möglicherweise nicht verfügbar.`,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Save Data
  const handleSave = async () => {
    console.log('💾 Saving dialog data...', {
      step, isStudy, participantId, variant,
      answers, isCompleted, chatHistory: chatHistory.length
    })
    
    try {
      setIsLoading(true)
      
      const dialogData = {
        variant: 'B',
        participantId: participantId,
        session_id: sessionId,
        questions: [], // Dynamic questions - no static array needed
        answers: answers,
        chatHistory: chatHistory,
        timestamp: new Date().toISOString(),
        metadata: {
          completion_rate: calculateCompletionRate(),
          total_questions: totalQuestions,
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

  const calculateCompletionRate = () => {
    const answeredQuestions = Object.keys(answers).length
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="bg-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6" />
                <CardTitle>KI-Assistent Dialog</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-purple-500 text-white">
                Frage {Math.min(currentQuestionIndex + 1, totalQuestions)} von {totalQuestions}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Chat Interface - Takes 3/4 of space */}
          <div className="lg:col-span-3">
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b bg-white">
                <CardTitle className="text-lg flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                  Energieberatungs-Gespräch
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {!dialogStarted ? (
                  <div className="flex-1 flex items-center justify-center bg-gray-50">
                    <div className="text-center p-8">
                      <MessageCircle className="w-20 h-20 text-purple-600 mx-auto mb-6" />
                      <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                        Bereit für das Interview?
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md">
                        Ich führe Sie durch 4 strukturierte Fragen zur Gebäude-Energieberatung. 
                        Das Gespräch dauert etwa 5-10 Minuten.
                      </p>
                      <Button 
                        onClick={startDialog} 
                        size="lg"
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Dialog beginnen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                      <div className="p-6 space-y-6">
                        {chatHistory.map((msg, index) => (
                          <div 
                            key={index} 
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[85%] ${
                              msg.role === 'user' 
                                ? 'bg-purple-600 text-white' 
                                : 'bg-white text-gray-800 shadow-sm border'
                            } rounded-lg p-4`}>
                              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {msg.message}
                              </div>
                              <div className={`text-xs mt-2 ${
                                msg.role === 'user' ? 'text-purple-200' : 'text-gray-500'
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
                            <div className="bg-white p-4 rounded-lg border shadow-sm">
                              <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                <span className="text-sm text-gray-600">KI-Assistent antwortet...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="border-t bg-white p-4">
                      <div className="space-y-3">
                        <Textarea
                          value={userMessage}
                          onChange={(e) => setUserMessage(e.target.value)}
                          placeholder={isCompleted ? "Dialog abgeschlossen. Klicken Sie auf 'Speichern & weiter'." : "Ihre Antwort eingeben... (oder '?' für Hilfe)"}
                          rows={3}
                          className="resize-none border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                          disabled={isCompleted || isLoading}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        <div className="flex space-x-2">
                          <Button 
                            onClick={handleSendMessage}
                            disabled={!userMessage.trim() || isLoading || isCompleted}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isCompleted ? 'Dialog beendet' : 'Antwort senden'}
                          </Button>
                          <Button 
                            onClick={() => setUserMessage('?')}
                            variant="outline"
                            disabled={isCompleted || isLoading}
                            className="px-4 border-purple-300 text-purple-600 hover:bg-purple-50"
                          >
                            ?
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Takes 1/4 of space */}
          <div className="space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  📊 Fortschritt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Beantwortet</span>
                    <span>{Object.keys(answers).length}/{totalQuestions}</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-purple-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${calculateCompletionRate()}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {calculateCompletionRate()}% abgeschlossen
                  </div>
                </div>
                
                {isCompleted && (
                  <div className="flex items-center text-green-600 text-sm bg-green-50 p-2 rounded">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Dialog abgeschlossen!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Save Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  💾 Speichern
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Sie können jederzeit speichern und zur nächsten Phase weitergehen.
                </p>
                
                <Button 
                  onClick={handleSave}
                  disabled={isLoading || Object.keys(answers).length === 0}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Speichern & weiter
                </Button>

                {Object.keys(answers).length === 0 && (
                  <p className="text-xs text-gray-500">
                    Beantworten Sie mindestens eine Frage zum Speichern.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  💡 Hilfe
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p><strong>"?"</strong> - Hilfe zur aktuellen Frage</p>
                  <p><strong>Enter</strong> - Nachricht senden</p>
                  <p><strong>Shift + Enter</strong> - Neue Zeile</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}