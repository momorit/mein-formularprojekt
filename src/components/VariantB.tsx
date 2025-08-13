// src/components/VariantB.tsx - REPARIERTE VERSION
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageCircle, Save, Play } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface VariantBProps {
  onDataCollected: (data: any) => void
}

export default function VariantB({ onDataCollected }: VariantBProps) {
  const [context, setContext] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [questions, setQuestions] = useState<Array<{question: string, field: string}>>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<Array<{role: string, message: string}>>([])
  const [userMessage, setUserMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [dialogStarted, setDialogStarted] = useState(false)

  const initializeDialog = useCallback(async () => {
    if (!dialogStarted) return
    
    try {
      setIsLoading(true)
      const response = await apiClient.startDialog(context)
      
      if (response.questions && Array.isArray(response.questions)) {
        setQuestions(response.questions)
        setSessionId(response.session_id || `session_${Date.now()}`)
        setCurrentQuestionIndex(0)
        
        // Add first question to chat
        if (response.questions.length > 0) {
          setChatHistory([{
            role: 'assistant',
            message: response.questions[0].question
          }])
        }
      } else {
        throw new Error('Invalid dialog response')
      }
    } catch (error) {
      console.error('Failed to start dialog:', error)
      // Fallback questions
      const fallbackQuestions = [
        {question: "Welche Art von Gebäude möchten Sie beraten lassen?", field: "GEBÄUDEART"},
        {question: "In welchem Jahr wurde das Gebäude errichtet?", field: "BAUJAHR"},
        {question: "Wie groß ist die Wohnfläche in Quadratmetern?", field: "WOHNFLÄCHE"},
        {question: "Welche Art der Heizung ist installiert?", field: "HEIZUNGSART"},
        {question: "Beschreiben Sie den aktuellen Dämmzustand.", field: "DÄMMZUSTAND"},
        {question: "Welcher Fenstertyp ist vorhanden?", field: "FENSTERTYP"},
        {question: "Welche Renovierungsmaßnahmen planen Sie?", field: "RENOVIERUNG"},
        {question: "Wie hoch ist Ihr Budget für die Sanierung?", field: "BUDGET"}
      ]
      
      setQuestions(fallbackQuestions)
      setSessionId(`fallback_${Date.now()}`)
      setCurrentQuestionIndex(0)
      
      setChatHistory([{
        role: 'assistant',
        message: fallbackQuestions[0].question
      }])
    } finally {
      setIsLoading(false)
    }
  }, [context, dialogStarted])

  useEffect(() => {
    initializeDialog()
  }, [initializeDialog])

  const startDialog = () => {
    setDialogStarted(true)
  }

  const handleSendMessage = async () => {
    if (!userMessage.trim() || currentQuestionIndex >= questions.length) return

    try {
      setIsLoading(true)
      
      // Add user message to chat
      const newChatHistory = [...chatHistory, { role: 'user', message: userMessage }]
      setChatHistory(newChatHistory)

      // Save answer
      const currentQuestion = questions[currentQuestionIndex]
      const newAnswers = {
        ...answers,
        [currentQuestion.field]: userMessage
      }
      setAnswers(newAnswers)

      let assistantResponse = ''

      // Handle help request
      if (userMessage.trim() === '?') {
        assistantResponse = getHelpForCurrentQuestion()
      } else {
        // Send to backend for processing
        try {
          const response = await apiClient.sendDialogMessage(
            sessionId,
            userMessage,
            currentQuestion
          )
          assistantResponse = response.response || `Danke für die Antwort "${userMessage}".`
        } catch (error) {
          console.error('Dialog message error:', error)
          assistantResponse = `Danke für die Antwort "${userMessage}".`
        }

        // Move to next question if not help request
        const nextIndex = currentQuestionIndex + 1
        if (nextIndex < questions.length) {
          setCurrentQuestionIndex(nextIndex)
          assistantResponse += `\n\nNächste Frage: ${questions[nextIndex].question}`
        } else {
          assistantResponse += '\n\nHerzlichen Glückwunsch! Sie haben alle Fragen beantwortet. Sie können nun Ihre Daten speichern.'
        }
      }

      // Add assistant response to chat
      setChatHistory([...newChatHistory, { role: 'assistant', message: assistantResponse }])
      setUserMessage('')
    } catch (error) {
      console.error('Message handling error:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        message: 'Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.' 
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const getHelpForCurrentQuestion = () => {
    const currentField = questions[currentQuestionIndex]?.field
    
    const helpTexts: Record<string, string> = {
      'GEBÄUDEART': 'Beispiele: Einfamilienhaus, Doppelhaushälfte, Reihenhaus, Mehrfamilienhaus',
      'BAUJAHR': 'Geben Sie das Jahr der Errichtung an, z.B. 1975, 1990, 2005',
      'WOHNFLÄCHE': 'Geben Sie die Gesamtwohnfläche in m² an, z.B. 120, 85, 200',
      'HEIZUNGSART': 'Beispiele: Gasheizung, Ölheizung, Wärmepumpe, Fernwärme, Holzpellets',
      'DÄMMZUSTAND': 'Beschreiben Sie den Zustand: gut gedämmt, teilweise gedämmt, ungedämmt',
      'FENSTERTYP': 'Beispiele: Einfachverglasung, Doppelverglasung, Dreifachverglasung',
      'RENOVIERUNG': 'Beschreiben Sie geplante Maßnahmen: Dach, Fassade, Heizung, Fenster',
      'BUDGET': 'Geben Sie einen groben Rahmen an, z.B. 10.000€, 50.000€, 100.000€+'
    }
    
    return `💡 Hilfe: ${helpTexts[currentField] || 'Geben Sie Informationen zu Ihrem Gebäude ein.'}`
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      const data = {
        variant: 'B',
        questions,
        answers,
        chatHistory,
        timestamp: new Date().toISOString(),
        completionRate: calculateCompletionRate()
      }

      await apiClient.saveDialogData(questions, answers, chatHistory)
      onDataCollected(data)
      
      alert('Dialog-Daten erfolgreich gespeichert!')
    } catch (error) {
      console.error('Save error:', error)
      alert('Fehler beim Speichern. Versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCompletionRate = () => {
    const totalQuestions = questions.length
    const answeredQuestions = Object.values(answers).filter(answer => answer.trim()).length
    return totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0
  }

  const isComplete = currentQuestionIndex >= questions.length && Object.keys(answers).length > 0

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Variante B: Dialog-basiertes System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="context">Kontext (optional)</Label>
            <Textarea
              id="context"
              placeholder="Beschreiben Sie Ihr Gebäude oder geben Sie zusätzliche Informationen an..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              disabled={dialogStarted}
              className="mt-1"
            />
          </div>
          
          {!dialogStarted ? (
            <Button onClick={startDialog} className="w-full">
              <Play className="w-4 h-4 mr-2" />
              Dialog starten
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                Fortschritt: {calculateCompletionRate()}% ({Object.keys(answers).length}/{questions.length} Fragen beantwortet)
              </div>
              
              <div className="h-80 overflow-y-auto border rounded p-4 bg-gray-50">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded max-w-[80%] ${
                      msg.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-white text-gray-800 border'
                    }`}>
                      <div className="whitespace-pre-wrap">{msg.message}</div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="text-left mb-3">
                    <div className="inline-block p-3 rounded bg-gray-200 text-gray-600">
                      Tippt...
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Input
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder={isComplete ? "Dialog abgeschlossen" : "Ihre Antwort... (oder '?' für Hilfe)"}
                  onKeyPress={(e) => e.key === 'Enter' && !isComplete && handleSendMessage()}
                  disabled={isLoading || isComplete}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={isLoading || isComplete || !userMessage.trim()}
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
              
              {isComplete && (
                <Button onClick={handleSave} disabled={isLoading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Dialog-Daten speichern
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}