// src/components/VariantB.tsx - KOMPLETT NEU GESCHRIEBEN
'use client'

import React, { useState, useEffect } from 'react'
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

  // State Management
  const [dialogStarted, setDialogStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [totalQuestions] = useState(4) // Fixed: 4 questions total
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [sessionId, setSessionId] = useState('')

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
      
      console.log('✅ Dialog started successfully:', data.session_id)
      
    } catch (error) {
      console.error('❌ Failed to start dialog:', error)
      
      // Robust Fallback
      const fallbackSessionId = `fallback_${Date.now()}`
      setSessionId(fallbackSessionId)
      setChatHistory([{
        role: 'assistant',
        message: `Hallo! Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung.

**Ihr Szenario:** Sie besitzen ein Mehrfamilienhaus (Baujahr 1965) in der Siedlungsstraße 23. Es hat eine Rotklinkerfassade und 10 Wohneinheiten. Sie planen eine WDVS-Sanierung der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung.

**Erste Frage (1/4):** Welche Gebäudeseite soll hauptsächlich saniert werden?`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Send Message
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
    setChatHistory(prev => [...prev, {
      role: 'user',
      message: currentMessage,
      timestamp: new Date()
    }])
    
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
      
      console.log('✅ Dialog response:', data)
      
      // Add API response
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        message: data.response,
        timestamp: new Date()
      }])
      
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
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        message: 'Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.',
        timestamp: new Date()
      }])
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
        questions: [], // Empty - we work with dynamic questions
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

  // Calculate completion rate based on answered questions
  const calculateCompletionRate = () => {
    const answeredQuestions = Object.keys(answers).length
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="bg-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6" />
                <CardTitle>KI-Assistent Dialog</CardTitle>
              </div>
              <Badge variant="secondary" className="bg-purple-500">
                Frage {Math.min(currentQuestionIndex + 1, totalQuestions)} von {totalQuestions}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                  Gespräch
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {!dialogStarted ? (
                  <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 text-purple-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Bereit für das Interview?
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Ich führe Sie durch 4 Fragen zur Gebäude-Energieberatung.
                      </p>
                      <Button onClick={startDialog} className="bg-purple-600 hover:bg-purple-700">
                        <Play className="w-4 h-4 mr-2" />
                        Dialog beginnen
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatHistory.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            msg.role === 'user' 
                              ? 'bg-purple-100 text-purple-900' 
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}>
                            <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                            <div className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-600' : 'text-gray-500'}`}>
                              {msg.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white p-3 rounded-lg border border-gray-200">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                              <span className="text-sm text-gray-500">KI-Assistent antwortet...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Message Input */}
                    <div className="border-t p-4 space-y-3">
                      <Textarea
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        placeholder={isCompleted ? "Dialog abgeschlossen." : "Ihre Antwort eingeben... (oder '?' für Hilfe)"}
                        rows={3}
                        className="resize-none"
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
                          className="px-3"
                        >
                          ?
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Progress & Save */}
          <div className="space-y-6">
            {/* Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  📊 Fortschritt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Beantwortet</span>
                      <span>{Object.keys(answers).length}/{totalQuestions}</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateCompletionRate()}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Dialog abgeschlossen!
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Save Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  💾 Speichern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Sie können jederzeit zwischenspeichern oder den Dialog fortsetzen.
                  </p>
                  
                  <Button 
                    onClick={handleSave}
                    disabled={isLoading || Object.keys(answers).length === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Speichern & weiter
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}