// src/components/VariantB.tsx
// Zweck: Flexibler Dialog (Variante B) mit Nachfragen, Fortschritt und Abschluss.
//  - /api/dialog/start liefert Begrüßung + erste Frage
//  - /api/dialog/message steuert Follow‑up/Weiter/Antwort‑Zweige (LLM + RAG)
//  - RAG‑Quellen werden im UI separat angezeigt
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
  const [ragSources, setRagSources] = useState<{ id: string; source: string; page?: number; score?: number }[]>([])
  const [uiSnippets, setUiSnippets] = useState<{ start_intro?: string; sidepanel?: string; scenario_short?: string; tip_text?: string }>({})

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
    ;(async () => {
      try {
        const res = await fetch('/api/ui/snippets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variant: 'B', context: 'Mehrfamilienhaus Baujahr 1965, Eingangsfassade Südseite, WDVS 140mm Mineralwolle, Ölheizung, Mieterin EG rechts 57.5m²' })
        })
        if (res.ok) {
          const data = await res.json()
          setUiSnippets({
            start_intro: data.start_intro,
            sidepanel: data.sidepanel,
            scenario_short: data.scenario_short,
            tip_text: data.tip_text,
          })
        }
      } catch {}
    })()
  }, [])

  // Start Dialog
  const startDialog = async () => {
    setIsLoading(true)
    setDialogStarted(true)
    try {
      const context = 'Mehrfamilienhaus Baujahr 1965, Eingangsfassade Südseite, WDVS-Sanierung 140mm Mineralwolle, Ölheizung, Mieterin EG rechts 57.5m²'
      const res = await fetch('/api/dialog/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context })
      })
      if (!res.ok) throw new Error('Start API failed')
      const data = await res.json()
      if (data?.session_id) setSessionId(data.session_id)
      const welcomeText = data?.welcome_message || 'Hallo! Erste Frage (1/4): Welche Gebäudeseite soll hauptsächlich saniert werden?'
      setChatHistory([{ role: 'assistant', message: welcomeText, timestamp: new Date() }])
      setCurrentQuestion(1)
    } catch (error) {
      console.error('❌ Error starting dialog:', error)
      setChatHistory([{ role: 'assistant', message: 'Hallo! Erste Frage (1/4): Welche Gebäudeseite soll hauptsächlich saniert werden?', timestamp: new Date() }])
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
      const showRag = !!data?.rag_used && Array.isArray(data?.rag_hits) && data.rag_hits.length > 0
      setRagSources(showRag ? data.rag_hits : [])
      
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
        message: `❌ Entschuldigung, technischer Fehler.

Bitte versuchen Sie es erneut. Falls das Problem besteht:
• Seite neu laden (Strg+F5)  
• Bei Nachfragen: "?" eingeben
• Oder direkt Ihre Antwort geben

Tipp: Auch ohne perfekte Technik können Sie fortfahren - geben Sie einfach Ihre Antwort ein!`,
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
                    <p className="text-gray-700 max-w-md mx-auto">
                      {uiSnippets.start_intro || 'Geführter Dialog mit kurzen Rückfragen und klaren Schritten.'}
                    </p>
                    
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm text-green-800">
                      {uiSnippets.sidepanel || 'Stellen Sie bei Unklarheiten eine kurze Frage und gehen Sie weiter, wenn Ihre Antwort feststeht.'}
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
                    {ragSources.length > 0 && (
                      <div className="bg-white text-gray-800 mr-4 border rounded-lg p-3">
                        <div className="text-xs font-medium mb-1">Quellen (RAG)</div>
                        <div className="space-y-1">
                          {ragSources.map((s) => (
                            <div key={s.id} className="text-xs text-gray-700">
                              <span className="font-mono">{s.source}</span>
                              {typeof s.page === 'number' && <span> · S.{s.page}</span>}
                              {typeof s.score === 'number' && <span> · Score {s.score.toFixed(2)}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                <div className="bg-blue-50 p-3 rounded border border-blue-200 text-xs text-blue-800">
                  {uiSnippets.sidepanel || 'Stellen Sie bei Unklarheiten eine kurze Frage und gehen Sie weiter, wenn Ihre Antwort feststeht.'}
                </div>

                <div className="bg-gray-50 p-3 rounded border text-xs text-gray-700">
                  {uiSnippets.scenario_short || 'Kurzfassung des Szenarios verfügbar.'}
                </div>

                <div className="bg-yellow-50 p-3 rounded border text-xs text-yellow-800">
                  <strong>Tipp:</strong> {uiSnippets.tip_text || 'Fragen Sie nach einer kurzen Erklärung oder einem Beispiel.'}
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
