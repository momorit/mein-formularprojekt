// src/components/VariantB.tsx - FIXED FOR VERCEL
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Save, Send, Play, CheckCircle } from 'lucide-react'

interface DialogQuestion {
  id: string
  question: string
  field: string
  type: 'text' | 'number' | 'select' | 'textarea'
  options?: string[]
  difficulty: 'easy' | 'hard'
  required: boolean
}

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

  // Dialog state
  const [dialogStarted, setDialogStarted] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [questions, setQuestions] = useState<DialogQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [sessionId, setSessionId] = useState('')

  const startDialog = async () => {
    setIsLoading(true)
    setDialogStarted(true)
    
    try {
      const response = await fetch('/api/dialog/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: 'Mehrfamilienhaus Baujahr 1965, 10 Wohneinheiten, 634m² Wohnfläche, WDVS-Sanierung' 
        })
      })
      
      if (!response.ok) throw new Error('Failed to start dialog')
      
      const data = await response.json()
      
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions)
        setSessionId(data.session_id || `session_${Date.now()}`)
        setCurrentQuestionIndex(0)
        
        const welcomeMessage = `Hallo! Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung. 

Ich führe Sie Schritt für Schritt durch die Erfassung Ihrer Gebäudedaten für die geplante Fassadensanierung.

**Ihr Szenario:** Sie besitzen ein Mehrfamilienhaus (Baujahr 1965) in der Siedlungsstraße 23, Großstadt, und planen eine energetische Modernisierung mit WDVS.

Lassen Sie uns beginnen! Ich stelle Ihnen nacheinander ${data.questions.length} Fragen. Bei Unklarheiten können Sie gerne nachfragen.

${data.questions[0]?.question || 'Erste Frage wird geladen...'}`

        setChatHistory([{
          role: 'assistant',
          message: welcomeMessage,
          timestamp: new Date()
        }])
      } else {
        throw new Error('Invalid dialog response')
      }
    } catch (error) {
      console.error('Failed to start dialog:', error)
      // Fallback questions
      const fallbackQuestions: DialogQuestion[] = [
        {
          id: 'total_living_space',
          question: 'Wie groß ist die gesamte Wohnfläche Ihres Gebäudes in Quadratmetern?',
          field: 'WOHNFLÄCHE_GESAMT',
          type: 'number',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'num_units',
          question: 'Wie viele Wohneinheiten befinden sich in dem Gebäude?',
          field: 'ANZAHL_WOHNEINHEITEN',
          type: 'number',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'insulation_measures',
          question: 'Beschreiben Sie detailliert die geplanten Dämmmaßnahmen. Welche Fassaden sollen gedämmt werden und mit welchem System?',
          field: 'DÄMMUNGSMASSNAHMEN_DETAIL',
          type: 'textarea',
          difficulty: 'hard',
          required: true
        },
        {
          id: 'cost_calculation',
          question: 'Wie hoch schätzen Sie die Gesamtkosten der Sanierung ein und wie soll die Finanzierung erfolgen? Bitte geben Sie auch an, welcher Anteil auf die Mieter umgelegt werden soll.',
          field: 'KOSTEN_FINANZIERUNG',
          type: 'textarea',
          difficulty: 'hard',
          required: true
        }
      ]
      
      setQuestions(fallbackQuestions)
      setSessionId(`fallback_${Date.now()}`)
      
      setChatHistory([{
        role: 'assistant',
        message: `Willkommen! Aufgrund eines technischen Problems verwende ich vordefinierte Fragen.

${fallbackQuestions[0].question}`,
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!userMessage.trim()) return
    
    const currentMessage = userMessage.trim()
    setUserMessage('')
    setIsLoading(true)
    
    // Add user message
    setChatHistory(prev => [...prev, {
      role: 'user',
      message: currentMessage,
      timestamp: new Date()
    }])
    
    try {
      const currentQuestion = questions[currentQuestionIndex]
      
      // Check if it's a help request
      if (currentMessage === '?' || currentMessage.toLowerCase().includes('hilfe') || currentMessage.toLowerCase().includes('help')) {
        const response = await fetch('/api/dialog/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: currentMessage,
            session_id: sessionId,
            currentQuestion: currentQuestion,
            questionIndex: currentQuestionIndex
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            message: data.response,
            timestamp: new Date()
          }])
        }
        
        setIsLoading(false)
        return
      }
      
      // Process answer
      if (currentQuestion) {
        // Save answer
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: currentMessage
        }))
        
        // Move to next question or complete
        if (currentQuestionIndex < questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1
          const nextQuestion = questions[nextIndex]
          
          const response = `Vielen Dank! Ihre Antwort wurde gespeichert.

**Nächste Frage (${nextIndex + 1}/${questions.length}):**

${nextQuestion.question}`

          setChatHistory(prev => [...prev, {
            role: 'assistant',
            message: response,
            timestamp: new Date()
          }])
          
          setCurrentQuestionIndex(nextIndex)
        } else {
          // Dialog completed
          const completionMessage = `🎉 Ausgezeichnet! Sie haben alle Fragen beantwortet.

**Zusammenfassung Ihrer Angaben:**
${questions.map((q, i) => {
            const answer = answers[q.id] || (i === currentQuestionIndex ? currentMessage : 'Nicht beantwortet')
            return `• ${q.field}: ${answer}`
          }).join('\n')}

Ihre Daten wurden erfasst und können nun gespeichert werden.`

          setChatHistory(prev => [...prev, {
            role: 'assistant',
            message: completionMessage,
            timestamp: new Date()
          }])
          
          setIsCompleted(true)
        }
      }
      
    } catch (error) {
      console.error('Error processing message:', error)
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        message: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung. Können Sie Ihre Antwort wiederholen?',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      // Include current message if dialog isn't completed yet
      const finalAnswers = { ...answers }
      if (!isCompleted && userMessage.trim()) {
        const currentQuestion = questions[currentQuestionIndex]
        if (currentQuestion) {
          finalAnswers[currentQuestion.id] = userMessage.trim()
        }
      }
      
      const dialogData = {
        variant: 'B',
        participantId: participantId,
        session_id: sessionId,
        questions: questions,
        answers: finalAnswers,
        chatHistory: chatHistory,
        timestamp: new Date().toISOString(),
        metadata: {
          completion_rate: calculateCompletionRate(finalAnswers),
          total_questions: questions.length,
          answered_questions: Object.keys(finalAnswers).length,
          is_completed: isCompleted
        }
      }
      
      const response = await fetch('/api/dialog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dialogData)
      })
      
      if (!response.ok) throw new Error('Save failed')
      
      if (isStudy) {
        // Return to study flow
        const step = searchParams.get('step') === '4' ? 'variant2_survey' : 'variant1_survey'
        router.push(`/study?step=${step}&participant=${participantId}`)
      } else {
        alert('Daten erfolgreich gespeichert!')
        if (onComplete) onComplete(dialogData)
      }
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Fehler beim Speichern. Versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCompletionRate = (currentAnswers: Record<string, string>) => {
    const totalQuestions = questions.length
    const answeredQuestions = Object.keys(currentAnswers).length
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  if (!dialogStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {isStudy && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-purple-600 mb-2">Variante B: Dialog-System</h1>
              <p className="text-gray-600">KI-geführte Unterhaltung zur Datenerfassung</p>
              {participantId && (
                <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
              )}
            </div>
          )}

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">💬 KI-Dialog für Energieberatung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">🏢 Ihr Szenario</h3>
                <p className="text-blue-900 mb-3">
                  Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23, Großstadt. 
                  Das Gebäude hat 10 Wohneinheiten mit 634m² Wohnfläche. Sie planen eine energetische Sanierung 
                  der Fassade mit einem Wärmedämmverbundsystem (WDVS) aus Mineralwolle.
                </p>
                <p className="text-blue-800 text-sm">
                  <strong>Ziel:</strong> Erfassung der Gebäudedaten für eine Energieberatung zur Berechnung 
                  möglicher Mieterhöhungen nach der geplanten Sanierung.
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">🤖 So funktioniert Variante B</h3>
                <ul className="space-y-2 text-purple-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Ein KI-Assistent führt Sie durch einen strukturierten Dialog</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Sie beantworten 4 gezielte Fragen nacheinander</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Bei Unklarheiten einfach <strong>"?"</strong> eingeben für Hilfe</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>Antworten Sie natürlich und ausführlich</span>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2">💡 Hilfe-Tipps</h4>
                <ul className="text-yellow-700 text-sm space-y-1">
                  <li>• Geben Sie <strong>"?"</strong> ein, wenn Sie Hilfe zu einer Frage brauchen</li>
                  <li>• Der Assistent kennt alle Details zu Ihrem Gebäude</li>
                  <li>• Sie können jederzeit nachfragen oder um Erklärungen bitten</li>
                  <li>• Antworten müssen nicht perfekt formuliert sein</li>
                </ul>
              </div>

              <Button 
                onClick={startDialog}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 text-lg"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    KI-Assistent wird gestartet...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Dialog mit KI-Assistent starten
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {isStudy && (
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Variante B: Dialog-System</h1>
            <p className="text-gray-600">KI-geführte Unterhaltung zur Datenerfassung</p>
            {participantId && (
              <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                    KI-Assistent Dialog
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      Frage {Math.min(currentQuestionIndex + 1, questions.length)} von {questions.length}
                    </Badge>
                    {isCompleted && (
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Abgeschlossen
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Chat History */}
                <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4">
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
                <div className="space-y-3">
                  <Textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    placeholder={isCompleted ? "Dialog abgeschlossen. Sie können die Daten jetzt speichern." : "Ihre Antwort eingeben... (oder '?' für Hilfe)"}
                    rows={3}
                    className="resize-none"
                    disabled={isCompleted}
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
                      disabled={isCompleted}
                      className="px-3"
                    >
                      ?
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Save */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Progress Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">📊 Fortschritt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Beantwortet</span>
                        <span>{Object.keys(answers).length}/{questions.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${calculateCompletionRate(answers)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {questions.map((q, index) => {
                        const isAnswered = answers[q.id]
                        const isCurrent = index === currentQuestionIndex
                        return (
                          <div key={q.id} className={`text-xs p-2 rounded flex items-center space-x-2 ${
                            isAnswered ? 'bg-green-50 text-green-800' :
                            isCurrent ? 'bg-purple-50 text-purple-800' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              isAnswered ? 'bg-green-500 border-green-500' :
                              isCurrent ? 'border-purple-500' :
                              'border-gray-300'
                            }`}>
                              {isAnswered && <CheckCircle className="w-3 h-3 text-white" />}
                              {isCurrent && !isAnswered && <div className="w-2 h-2 bg-purple-500 rounded-full"></div>}
                            </div>
                            <span className="flex-1 truncate">{q.field}</span>
                            {q.difficulty === 'hard' && (
                              <Badge variant="outline" className="text-xs">⚠️</Badge>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Save Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💾 Speichern</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      {isCompleted ? (
                        <p className="text-green-700">✅ Alle Fragen beantwortet! Sie können jetzt speichern.</p>
                      ) : (
                        <p>Sie können jederzeit zwischenspeichern oder den Dialog fortsetzen.</p>
                      )}
                    </div>

                    <Button 
                      onClick={handleSave}
                      disabled={isLoading}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isStudy ? 'Speichern & weiter' : 'Dialog speichern'}
                    </Button>

                    {isStudy && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const step = searchParams.get('step') === '4' ? 'variant2_survey' : 'variant1_survey'
                          router.push(`/study?step=${step}&participant=${participantId}`)
                        }}
                        className="w-full"
                      >
                        Überspringen
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">💡 Hilfe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2 text-gray-600">
                    <p><strong>"?"</strong> - Hilfe zur aktuellen Frage</p>
                    <p><strong>Enter</strong> - Nachricht senden</p>
                    <p><strong>Shift+Enter</strong> - Neue Zeile</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}