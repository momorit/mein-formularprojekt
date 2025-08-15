// src/components/VariantB.tsx - UPDATED: Ohne Überspringen, mit Szenario, angepasste Fragen
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Save, Send, Play, CheckCircle, Home } from 'lucide-react'

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
  const step = searchParams.get('step') // '2' for first variant, '4' for second variant

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
      // Predefined optimized questions - most are easy, one is hard
      const predefinedQuestions: DialogQuestion[] = [
        {
          id: 'building_year',
          question: 'In welchem Jahr wurde Ihr Gebäude erbaut?',
          field: 'BAUJAHR',
          type: 'number',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'total_units',
          question: 'Wie viele Wohneinheiten befinden sich in Ihrem Gebäude?',
          field: 'ANZAHL_WOHNEINHEITEN',
          type: 'number',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'total_living_space',
          question: 'Wie groß ist die gesamte Wohnfläche Ihres Gebäudes in Quadratmetern?',
          field: 'WOHNFLÄCHE_GESAMT',
          type: 'number',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'building_address',
          question: 'Wie lautet die vollständige Adresse Ihres Gebäudes?',
          field: 'GEBÄUDEADRESSE',
          type: 'text',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'insulation_system',
          question: 'Welches Dämmsystem planen Sie für die Fassadensanierung?',
          field: 'DÄMMSYSTEM',
          type: 'text',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'complex_energy_analysis',
          question: 'Führen Sie eine detaillierte energetische Bewertung durch: Berechnen Sie die U-Werte vor und nach der Sanierung, den erwarteten Primärenergiebedarf, die CO2-Einsparungen und erstellen Sie eine Wirtschaftlichkeitsberechnung mit Amortisationszeit für die geplante WDVS-Maßnahme.',
          field: 'ENERGETISCHE_ANALYSE_DETAIL',
          type: 'textarea',
          difficulty: 'hard',
          required: true
        }
      ]
      
      setQuestions(predefinedQuestions)
      setSessionId(`session_${Date.now()}`)
      setCurrentQuestionIndex(0)
      
      const welcomeMessage = `Hallo! Ich bin Ihr KI-Assistent für die Gebäude-Energieberatung. 

Ich führe Sie Schritt für Schritt durch die Erfassung Ihrer Gebäudedaten für die geplante Fassadensanierung.

**Ihr Szenario:** Sie besitzen ein Mehrfamilienhaus (Baujahr 1965) in der Siedlungsstraße 23, Großstadt, und planen eine energetische Modernisierung mit WDVS.

Lassen Sie uns beginnen! Ich stelle Ihnen nacheinander ${predefinedQuestions.length} Fragen. Bei Unklarheiten können Sie gerne nachfragen.

**Frage 1 von ${predefinedQuestions.length}:**
${predefinedQuestions[0]?.question || 'Erste Frage wird geladen...'}`

      setChatHistory([{
        role: 'assistant',
        message: welcomeMessage,
        timestamp: new Date()
      }])
      
    } catch (error) {
      console.error('Failed to start dialog:', error)
      // Fallback questions
      const fallbackQuestions: DialogQuestion[] = [
        {
          id: 'building_year',
          question: 'In welchem Jahr wurde Ihr Gebäude erbaut?',
          field: 'BAUJAHR',
          type: 'number',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'total_units',
          question: 'Wie viele Wohneinheiten befinden sich in Ihrem Gebäude?',
          field: 'ANZAHL_WOHNEINHEITEN',
          type: 'number',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'complex_energy_analysis',
          question: 'Führen Sie eine detaillierte energetische Bewertung durch: Berechnen Sie die U-Werte vor und nach der Sanierung, den erwarteten Primärenergiebedarf, die CO2-Einsparungen und erstellen Sie eine Wirtschaftlichkeitsberechnung.',
          field: 'ENERGETISCHE_ANALYSE_DETAIL',
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
      if (currentMessage === '?' || currentMessage.toLowerCase().includes('hilfe')) {
        let helpMessage = ''
        if (currentQuestion?.difficulty === 'hard') {
          helpMessage = `Das ist eine komplexe Frage. Hier einige Hinweise:

**Für die energetische Bewertung benötigen Sie:**
• U-Werte vorher: ca. 1,4 W/(m²K) für ungedämmte Wand von 1965
• U-Werte nachher: ca. 0,24 W/(m²K) mit 140mm WDVS
• Primärenergiebedarf: Berechnung basierend auf Heizenergieverbrauch
• CO2-Einsparung: ca. 40-60% durch die Dämmmaßnahme
• Kosten: ca. 150-200€/m² Fassadenfläche für WDVS

Versuchen Sie eine realistische Schätzung basierend auf diesen Richtwerten.`
        } else {
          helpMessage = `Hinweis zu Ihrer Frage: ${currentQuestion?.question}

**Basierend auf Ihrem Szenario:**
• Gebäude: Mehrfamilienhaus, Baujahr 1965
• Lage: Siedlungsstraße 23, Großstadt  
• Details: 10 Wohneinheiten, 634m² Wohnfläche
• Geplant: WDVS mit 140mm Mineralwolle

Diese Informationen helfen Ihnen bei der Antwort!`
        }
        
        setChatHistory(prev => [...prev, {
          role: 'assistant',
          message: helpMessage,
          timestamp: new Date()
        }])
        
        setIsLoading(false)
        return
      }
      
      // Save answer and move to next question
      if (currentQuestion) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestion.id]: currentMessage
        }))
        
        // Check if there are more questions
        if (currentQuestionIndex < questions.length - 1) {
          const nextIndex = currentQuestionIndex + 1
          const nextQuestion = questions[nextIndex]
          
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            message: `Vielen Dank für Ihre Antwort!

**Frage ${nextIndex + 1} von ${questions.length}:**
${nextQuestion.question}

${nextQuestion.difficulty === 'hard' ? '⚠️ Diese Frage ist komplex - zögern Sie nicht nachzufragen, wenn Sie Hilfe benötigen!' : ''}`,
            timestamp: new Date()
          }])
          
          setCurrentQuestionIndex(nextIndex)
        } else {
          // All questions completed
          setChatHistory(prev => [...prev, {
            role: 'assistant',
            message: `Ausgezeichnet! Sie haben alle ${questions.length} Fragen beantwortet.

Ihre Angaben sind vollständig und können nun gespeichert werden. Klicken Sie auf "Dialog speichern & weiter" um fortzufahren.

**Zusammenfassung Ihrer Angaben:**
${Object.entries({...answers, [currentQuestion.id]: currentMessage}).map(([key, value], idx) => 
  `${idx + 1}. ${questions.find(q => q.id === key)?.question}: ${value}`
).join('\n')}`,
            timestamp: new Date()
          }])
          
          setIsCompleted(true)
        }
      }
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        message: 'Entschuldigung, es gab einen Fehler. Können Sie Ihre Antwort wiederholen?',
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
        // Navigation logic
        const nextStep = step === '2' ? 'variant1_survey' : 'variant2_survey'
        router.push(`/study?step=${nextStep}&participant=${participantId}`)
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
    return totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0
  }

  if (!dialogStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {isStudy && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-purple-600 mb-2">Variante B: Dialog-System</h1>
              <p className="text-gray-600">KI-gesteuerter Dialog zur Datenerfassung</p>
              {participantId && (
                <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
              )}
              <div className="mt-2">
                <Badge variant="outline" className="text-purple-600">
                  {step === '2' ? 'Erste Variante' : 'Zweite Variante'}
                </Badge>
              </div>
            </div>
          )}

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">💬 Dialog-System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-3">💬 So funktioniert der Dialog</h3>
                <ul className="text-purple-900 space-y-2 text-sm">
                  <li>• Die KI stellt Ihnen nacheinander Fragen</li>
                  <li>• Antworten Sie in natürlicher Sprache</li>
                  <li>• Bei Unklarheiten einfach "?" eingeben</li>
                  <li>• Der Dialog führt Sie durch alle benötigten Informationen</li>
                </ul>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">🏢 Ihr Szenario</h3>
                <p className="text-green-900">
                  Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23, Großstadt. 
                  Das Gebäude hat 10 Wohneinheiten mit 634m² Wohnfläche. Sie planen eine 
                  <strong>energetische Modernisierung der Fassade mit WDVS</strong> (140mm Mineralwolle).
                </p>
              </div>

              <div className="text-center">
                <Button 
                  onClick={startDialog}
                  disabled={isLoading}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Dialog wird vorbereitet...
                    </div>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Dialog starten
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {isStudy && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-purple-600 mb-2">Variante B: Dialog-System</h1>
            <p className="text-gray-600">KI-gesteuerter Dialog zur Datenerfassung</p>
            {participantId && (
              <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
            )}
            <div className="mt-2">
              <Badge variant="outline" className="text-purple-600">
                {step === '2' ? 'Erste Variante' : 'Zweite Variante'}
              </Badge>
            </div>
          </div>
        )}

        {/* Scenario Display - Always visible */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Home className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">🏢 Ihr Szenario</h3>
                </div>
                <p className="text-green-900 text-sm">
                  <strong>Mehrfamilienhaus, Baujahr 1965</strong> • Siedlungsstraße 23, Großstadt • 
                  <strong>10 Wohneinheiten, 634m² Wohnfläche</strong> • 
                  Geplante Sanierung: <strong>WDVS mit 140mm Mineralwolle</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Dialog */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <MessageCircle className="w-6 h-6 mr-2 text-purple-600" />
                    KI-Dialog
                  </span>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-purple-600">
                      Frage {Math.min(currentQuestionIndex + 1, questions.length)} von {questions.length}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Vollständig
                      </Badge>
                    )}
                  </div>
                </CardTitle>
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
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white text-gray-800 border border-gray-200 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                          <span className="text-sm">KI denkt nach...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Input */}
                <div className="space-y-4">
                  <div className="flex space-x-3">
                    <Textarea
                      value={userMessage}
                      onChange={(e) => setUserMessage(e.target.value)}
                      placeholder={isCompleted ? "Dialog abgeschlossen - Sie können speichern" : "Ihre Antwort hier eingeben... (oder '?' für Hilfe)"}
                      className="flex-1 min-h-[80px] max-h-[150px]"
                      disabled={isLoading}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          if (!isCompleted) handleSendMessage()
                        }
                      }}
                    />
                    <div className="flex flex-col space-y-2">
                      <Button 
                        onClick={handleSendMessage}
                        disabled={isLoading || !userMessage.trim() || isCompleted}
                        className="bg-purple-600 hover:bg-purple-700 px-4 py-2"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      {!isCompleted && (
                        <Button 
                          variant="outline"
                          onClick={() => setUserMessage('?')}
                          disabled={isLoading}
                          className="px-4 py-2 text-xs"
                        >
                          ?
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button 
                      onClick={handleSave}
                      disabled={isLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3"
                    >
                      {isLoading ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Speichert...
                        </div>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          {isStudy ? 'Dialog speichern & weiter' : 'Dialog speichern'}
                        </>
                      )}
                    </Button>
                    {/* REMOVED: Überspringen Button */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress & Help */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Fortschritt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Beantwortete Fragen</span>
                      <span>{Object.keys(answers).length} / {questions.length}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${calculateCompletionRate(answers)}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm space-y-2">
                    {questions.map((q, index) => (
                      <div key={q.id} className={`flex items-center space-x-2 ${
                        index === currentQuestionIndex ? 'font-semibold text-purple-600' : 
                        answers[q.id] ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full ${
                          answers[q.id] ? 'bg-green-500' : 
                          index === currentQuestionIndex ? 'bg-purple-500' : 'bg-gray-300'
                        }`} />
                        <span className="truncate">
                          {q.difficulty === 'hard' ? '⚠️ ' : ''}
                          Frage {index + 1}
                        </span>
                      </div>
                    ))}
                  </div>
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
                  <p className="text-orange-600 mt-3">
                    <strong>⚠️ Komplexe Fragen:</strong> Zögern Sie nicht nachzufragen!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}