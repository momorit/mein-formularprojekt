// src/components/VariantB.tsx - FLEXIBLER DIALOG MIT NACHFRAGEN
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Save, Send, Play, CheckCircle, Clock, HelpCircle, ArrowRight } from 'lucide-react'

interface ChatMessage {
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
  isFollowUp?: boolean
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
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [totalQuestions] = useState(4)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [sessionId, setSessionId] = useState('')
  const [canAskFollowUp, setCanAskFollowUp] = useState(true)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  // Initialize
  useEffect(() => {
    const id = `dialog_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    setSessionId(id)
    console.log('🎬 Flexible VariantB initialized:', { sessionId: id })
  }, [])

  // Start Dialog
  const startDialog = async () => {
    setIsLoading(true)
    setDialogStarted(true)
    
    try {
      // Direkte Willkommensnachricht ohne API-Call
      const welcomeMessage: ChatMessage = {
        role: 'assistant',
        message: `👋 **Willkommen zum flexiblen Dialog-System!**

Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung und führe Sie durch **4 wichtige Hauptfragen**.

**🏠 Ihr Szenario:** 
Mehrfamilienhaus (Baujahr 1965), WDVS-Sanierung der Eingangsfassade zur Straße (Südseite) mit 140mm Mineralwolle-Dämmung.

**💡 So funktioniert's:**
• Ich stelle Ihnen eine Hauptfrage
• Sie können **beliebig viele Nachfragen** stellen
• Wenn Sie bereit sind: Antworten und "weiter" sagen
• Oder einfach nur Ihre Antwort geben

**📋 Erste Hauptfrage (1/4):** 
Welche Gebäudeseite soll hauptsächlich saniert werden?

*Bei Unklarheiten fragen Sie gerne nach! Zum Beispiel: "Was bedeutet WDVS?" oder "Welche Optionen gibt es?"*`,
        timestamp: new Date()
      }
      
      setChatHistory([welcomeMessage])
      setCurrentQuestion(1)
      
    } catch (error) {
      console.error('❌ Error starting dialog:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Send Message - Flexibler Handler
  const handleSendMessage = async () => {
    if (!userMessage.trim() || isLoading) return
    
    const currentMessage = userMessage.trim()
    setUserMessage('')
    setIsLoading(true)
    
    console.log('💬 Sending flexible message:', { 
      message: currentMessage, 
      sessionId,
      currentQuestion,
      isCompleted
    })
    
    // Nachfrage erkennen
    const isLikelyFollowUp = detectFollowUpQuestion(currentMessage)
    
    // User message hinzufügen
    const newUserMessage: ChatMessage = {
      role: 'user',
      message: currentMessage,
      timestamp: new Date(),
      isFollowUp: isLikelyFollowUp
    }
    setChatHistory(prev => [...prev, newUserMessage])
    
    try {
      const response = await fetch('/api/dialog/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: currentMessage,
          session_id: sessionId
        })
      })
      
      if (!response.ok) {
        throw new Error(`Dialog API failed: ${response.status}`)
      }
      
      const data = await response.json()
      console.log('✅ Flexible dialog response received:', data)
      
      // Validate response
      if (!data.response || data.response.trim().length < 5) {
        throw new Error('Invalid LLM response')
      }
      
      // Assistant response hinzufügen
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        message: data.response,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, assistantMessage])
      
      // State updates
      if (data.answers_collected) {
        setAnswers(data.answers_collected)
      }
      
      if (data.current_question) {
        setCurrentQuestion(data.current_question)
      }
      
      if (data.dialog_complete) {
        setIsCompleted(true)
        setCanAskFollowUp(false)
      }
      
      if (data.can_ask_followup !== undefined) {
        setCanAskFollowUp(data.can_ask_followup)
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error)
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        role: 'assistant',
        message: `❌ **Entschuldigung, technischer Fehler.**

Bitte versuchen Sie es erneut. Falls das Problem besteht:
• Seite neu laden (Strg+F5)  
• Bei Nachfragen: "?" eingeben
• Oder direkt Ihre Antwort geben

**Tipp:** Auch ohne perfekte Technik können Sie fortfahren - geben Sie einfach Ihre Antwort ein!`,
        timestamp: new Date()
      }
      setChatHistory(prev => [...prev, fallbackMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Nachfrage erkennen (Frontend-Hilfe)
  const detectFollowUpQuestion = (message: string): boolean => {
    const followUpIndicators = [
      '?', 'warum', 'wie', 'was', 'welche', 'beispiel', 'erkläre', 'bedeutet'
    ]
    const lowerMessage = message.toLowerCase()
    return followUpIndicators.some(indicator => lowerMessage.includes(indicator))
  }

  // Keyboard shortcuts
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Quick action buttons
  const quickActions = [
    { text: "?", label: "Hilfe zu dieser Frage" },
    { text: "Beispiel?", label: "Beispiel zeigen" },
    { text: "weiter", label: "Zur nächsten Frage" }
  ]

  // Save Data
  const handleSave = async () => {
    console.log('💾 Saving flexible dialog data...', {
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
          completion_rate: Math.round((Object.keys(answers).length / totalQuestions) * 100),
          total_questions: totalQuestions,
          answered_questions: Object.keys(answers).length,
          is_completed: isCompleted,
          chat_interactions: chatHistory.length,
          follow_up_questions: chatHistory.filter(m => m.isFollowUp).length
        }
      }
      
      const response = await fetch('/api/dialog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dialogData)
      })
      
      if (!response.ok) throw new Error('Save failed')
      
      console.log('✅ Flexible dialog data saved successfully')
      
      if (isStudy) {
        const nextStep = step === '2' ? 'variant1_survey' : 'variant2_survey'
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
                  💬 Flexibler Dialog (Variante B)
                </h1>
                <p className="text-gray-600 mt-1">
                  Nachfragen erwünscht! Stellen Sie so viele Rückfragen wie nötig.
                </p>
              </div>
              <div className="text-right">
                <Badge variant="secondary" className="mb-2">
                  {isStudy ? `Teilnehmer ${participantId}` : 'Demo-Modus'}
                </Badge>
                <div className="text-sm text-gray-500">
                  Frage {currentQuestion}/{totalQuestions} • {Object.keys(answers).length} beantwortet
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Dialog Area (2/3) */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Start Screen */}
            {!dialogStarted && (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                      <MessageCircle className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold">Flexiblen Dialog starten</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      Ein intelligenter Dialog mit **unbegrenzten Nachfragen**. 
                      Fragen Sie nach, bis alles klar ist!
                    </p>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">✨ Neu: Nachfragen möglich!</h4>
                      <ul className="text-sm text-green-700 space-y-1">
                        <li>• **Beliebig viele Rückfragen** zu jeder Hauptfrage</li>
                        <li>• **Beispiele** und **Details** auf Nachfrage</li>
                        <li>• **Flexibler Fortschritt** - Sie bestimmen das Tempo</li>
                        <li>• Weiter zur nächsten Frage nur wenn **Sie** bereit sind</li>
                      </ul>
                    </div>
                    
                    <Button 
                      onClick={startDialog}
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
            {dialogStarted && (
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5" />
                      KI-Energieberater
                      {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                    </div>
                    <div className="text-sm text-gray-500">
                      {canAskFollowUp ? "Nachfragen erlaubt" : "Dialog abgeschlossen"}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                {/* Messages */}
                <CardContent className="flex-1 p-4 overflow-y-auto">
                  <div className="space-y-4">
                    {chatHistory.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            msg.role === 'user'
                              ? msg.isFollowUp 
                                ? 'bg-blue-500 text-white border border-blue-300'  // Nachfragen in Blau
                                : 'bg-purple-600 text-white'  // Normale Antworten in Purple
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {/* Follow-up Indicator */}
                          {msg.role === 'user' && msg.isFollowUp && (
                            <div className="flex items-center gap-1 mb-1 text-blue-100 text-xs">
                              <HelpCircle className="w-3 h-3" />
                              <span>Nachfrage</span>
                            </div>
                          )}
                          
                          <div className="whitespace-pre-wrap text-sm">
                            {msg.message}
                          </div>
                          
                          <div className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-white/70' : 'text-gray-500'
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
                            <span className="text-sm text-gray-600">KI denkt nach...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </CardContent>
                
                {/* Input Area */}
                <div className="border-t p-4">
                  {/* Quick Actions */}
                  {canAskFollowUp && !isCompleted && (
                    <div className="mb-3">
                      <div className="text-xs text-gray-500 mb-2">🚀 Schnellaktionen:</div>
                      <div className="flex gap-2 flex-wrap">
                        {quickActions.map((action, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => setUserMessage(action.text)}
                            className="text-xs h-7"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Message Input */}
                  <div className="flex gap-2">
                    <Textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={
                        isCompleted 
                          ? "Dialog abgeschlossen - bereit zum Speichern"
                          : canAskFollowUp
                          ? "Ihre Antwort oder Nachfrage... (z.B. 'Was bedeutet das?' oder 'weiter')"
                          : "Ihre Antwort eingeben..."
                      }
                      className="flex-1 min-h-[60px] resize-none"
                      disabled={isLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!userMessage.trim() || isLoading}
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
            
            {/* Progress */}
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
                      <span>Hauptfragen</span>
                      <span>{Object.keys(answers).length}/{totalQuestions}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(Object.keys(answers).length / totalQuestions) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="w-4 h-4" />
                      <span>Nachfragen: {chatHistory.filter(m => m.isFollowUp).length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4" />
                      <span>Nachrichten: {chatHistory.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" />
                  Anleitung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="bg-blue-50 p-3 rounded border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-1">💡 Nachfragen stellen</h4>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>• "Was bedeutet WDVS?"</li>
                    <li>• "Können Sie ein Beispiel geben?"</li>
                    <li>• "Warum ist das wichtig?"</li>
                    <li>• "Welche Optionen habe ich?"</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 p-3 rounded border border-green-200">
                  <h4 className="font-semibold text-green-800 mb-1">➡️ Weitergehen</h4>
                  <ul className="text-green-700 space-y-1 text-xs">
                    <li>• Ihre Antwort geben</li>
                    <li>• "weiter" oder "nächste Frage"</li>
                    <li>• "verstanden" oder "ok"</li>
                  </ul>
                </div>
                
                <div className="bg-gray-50 p-3 rounded border">
                  <h4 className="font-semibold text-gray-800 mb-1">🏠 Ihr Szenario</h4>
                  <p className="text-xs text-gray-600">
                    Mehrfamilienhaus (1965), WDVS-Sanierung Eingangsfassade Südseite, 140mm Mineralwolle
                  </p>
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
                    {isLoading ? 'Wird gespeichert...' : 'Dialog speichern'}
                  </Button>
                  
                  {isStudy && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Nach dem Speichern weiter zum Fragebogen.
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