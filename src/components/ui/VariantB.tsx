'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, CheckCircle, MessageSquare, ArrowDown } from 'lucide-react'

interface VariantBProps {
  onComplete: (data: any) => void
  startTime: Date
}

const SAMPLE_CONTEXT = `
Gebäude-Energieberatung Förderantrag

Beispiel-Gebäudedaten:
- Mehrfamilienhaus, Baujahr 1985
- Wohnfläche: 420 m², 3 Stockwerke + Dachgeschoss
- Gas-Brennwert Heizung, teilweise gedämmt
- Doppelverglasung Fenster
- Eigentümer möchte energetische Sanierung
`

interface DialogQuestion {
  field: string
  question: string
  completed: boolean
}

export default function VariantB({ onComplete, startTime }: VariantBProps) {
  const [questions, setQuestions] = useState<DialogQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<Array<{type: 'bot' | 'user', message: string, timestamp: Date}>>([])
  const [userInput, setUserInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [helpRequests, setHelpRequests] = useState(0)
  const [errors, setErrors] = useState(0)
  const [sessionId] = useState(() => 'session_' + Date.now())
  
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeDialog()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [chatHistory])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const initializeDialog = async () => {
    setIsInitializing(true)
    
    try {
      const response = await fetch('/api/dialog/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: SAMPLE_CONTEXT })
      })

      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions || getDefaultQuestions())
        
        // Initial greeting
        setChatHistory([{
          type: 'bot',
          message: "Hallo! Ich helfe Ihnen beim Ausfüllen Ihres Förderantrags für die energetische Sanierung. Ich stelle Ihnen nacheinander die notwendigen Fragen. Lassen Sie uns beginnen!",
          timestamp: new Date()
        }])
        
        // Ask first question
        setTimeout(() => askCurrentQuestion(), 1000)
      } else {
        throw new Error('Dialog service not available')
      }
    } catch (error) {
      console.warn('Using default dialog:', error)
      setQuestions(getDefaultQuestions())
      setChatHistory([{
        type: 'bot',
        message: "Hallo! Ich helfe Ihnen beim Ausfüllen Ihres Förderantrags. Das Backend ist nicht verfügbar, aber wir können trotzdem mit einer vereinfachten Version fortfahren.",
        timestamp: new Date()
      }])
      setTimeout(() => askCurrentQuestion(), 1000)
    } finally {
      setIsInitializing(false)
    }
  }

  const getDefaultQuestions = (): DialogQuestion[] => [
    { field: "GEBAEUDETYP", question: "Welche Art von Gebäude besitzen Sie? (z.B. Einfamilienhaus, Mehrfamilienhaus, Gewerbeimmobilie)", completed: false },
    { field: "BAUJAHR", question: "In welchem Jahr wurde Ihr Gebäude errichtet?", completed: false },
    { field: "WOHNFLAECHE", question: "Wie groß ist die beheizte Wohnfläche Ihres Gebäudes in Quadratmetern?", completed: false },
    { field: "STOCKWERKE", question: "Über wie viele Stockwerke erstreckt sich Ihr Gebäude?", completed: false },
    { field: "HEIZUNGSART", question: "Welche Art der Heizung ist in Ihrem Gebäude installiert? (z.B. Gas, Öl, Wärmepumpe, Fernwärme)", completed: false },
    { field: "DAEMMUNG", question: "Ist Ihr Gebäude bereits gedämmt? Wenn ja, welche Bereiche und mit welchem Material?", completed: false },
    { field: "FENSTER", question: "Welche Art von Fenstern sind in Ihrem Gebäude eingebaut? (Einfach-, Doppel- oder Dreifachverglasung)", completed: false },
    { field: "ENERGIEVERBRAUCH", question: "Wie hoch ist ungefähr Ihr jährlicher Energieverbrauch für die Heizung? (in kWh, oder Liter Öl, oder m³ Gas)", completed: false },
    { field: "SANIERUNGSWUNSCH", question: "Welche energetischen Verbesserungen planen Sie? (z.B. neue Heizung, Dämmung, neue Fenster)", completed: false }
  ]

  const askCurrentQuestion = () => {
    if (currentQuestionIndex < questions.length) {
      const currentQuestion = questions[currentQuestionIndex]
      setChatHistory(prev => [...prev, {
        type: 'bot',
        message: `Frage ${currentQuestionIndex + 1} von ${questions.length}: ${currentQuestion.question}`,
        timestamp: new Date()
      }])
    } else {
      // All questions completed
      setChatHistory(prev => [...prev, {
        type: 'bot',
        message: "Vielen Dank! Wir haben alle notwendigen Informationen gesammelt. Sie können nun den Dialog abschließen.",
        timestamp: new Date()
      }])
    }
  }

  const handleSendMessage = async () => {
    if (!userInput.trim()) return
    
    const message = userInput.trim()
    setUserInput('')
    setIsLoading(true)

    // Add user message
    setChatHistory(prev => [...prev, {
      type: 'user',
      message,
      timestamp: new Date()
    }])

    try {
      if (currentQuestionIndex < questions.length) {
        // Process answer for current question
        const currentQuestion = questions[currentQuestionIndex]
        
        // Save answer
        setAnswers(prev => ({ ...prev, [currentQuestion.field]: message }))
        
        // Mark question as completed
        setQuestions(prev => prev.map((q, idx) => 
          idx === currentQuestionIndex ? { ...q, completed: true } : q
        ))

        // Try to get AI response
        try {
          const response = await fetch('/api/dialog/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              message,
              currentQuestion,
              questionIndex: currentQuestionIndex,
              totalQuestions: questions.length
            })
          })

          if (response.ok) {
            const data = await response.json()
            
            // Add AI confirmation
            setChatHistory(prev => [...prev, {
              type: 'bot',
              message: data.response || "Danke für Ihre Antwort!",
              timestamp: new Date()
            }])

            // Move to next question
            setTimeout(() => {
              setCurrentQuestionIndex(prev => prev + 1)
              setTimeout(() => askCurrentQuestion(), 500)
            }, 1000)
          } else {
            throw new Error('AI service not available')
          }
        } catch (error) {
          console.error('AI response error:', error)
          setErrors(prev => prev + 1)
          
          // Fallback response
          setChatHistory(prev => [...prev, {
            type: 'bot',
            message: "Vielen Dank für Ihre Antwort! Lassen Sie uns mit der nächsten Frage fortfahren.",
            timestamp: new Date()
          }])

          // Move to next question
          setTimeout(() => {
            setCurrentQuestionIndex(prev => prev + 1)
            setTimeout(() => askCurrentQuestion(), 500)
          }, 1000)
        }
      } else {
        // Free conversation after all questions
        setHelpRequests(prev => prev + 1)
        
        try {
          const response = await fetch('/api/dialog/message', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              message,
              currentQuestion: null,
              questionIndex: questions.length,
              totalQuestions: questions.length
            })
          })

          if (response.ok) {
            const data = await response.json()
            setChatHistory(prev => [...prev, {
              type: 'bot',
              message: data.response || "Gerne helfe ich Ihnen weiter!",
              timestamp: new Date()
            }])
          } else {
            throw new Error('AI service not available')
          }
        } catch (error) {
          setChatHistory(prev => [...prev, {
            type: 'bot',
            message: "Entschuldigung, der AI-Service ist momentan nicht verfügbar. Haben Sie weitere Fragen zu Ihren Angaben?",
            timestamp: new Date()
          }])
          setErrors(prev => prev + 1)
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleComplete = () => {
    const completedQuestions = questions.filter(q => q.completed).length
    const completionRate = questions.length > 0 ? Math.round((completedQuestions / questions.length) * 100) : 0

    const variantData = {
      type: 'dialog',
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      questions,
      answers,
      chatHistory: chatHistory.map(msg => ({
        type: msg.type,
        message: msg.message,
        timestamp: msg.timestamp
      })),
      helpRequests,
      errors,
      interactions: chatHistory.filter(msg => msg.type === 'user').length,
      completedQuestions,
      totalQuestions: questions.length,
      completionRate,
      completed: true
    }

    onComplete(variantData)
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Dialog wird initialisiert...</span>
      </div>
    )
  }

  const completedQuestions = questions.filter(q => q.completed).length
  const progress = questions.length > 0 ? Math.round((completedQuestions / questions.length) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center">
            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
            Dialog-Fortschritt
          </h3>
          <span className="text-sm text-gray-600">
            {completedQuestions} von {questions.length} Fragen beantwortet
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">{progress}%</div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Chat Header */}
        <div className="p-4 border-b bg-blue-50">
          <h2 className="font-semibold text-blue-900">🤖 KI-Assistent für Förderanträge</h2>
          <p className="text-sm text-blue-700">Ich führe Sie durch alle notwendigen Angaben</p>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.type === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-white text-gray-800 shadow-sm rounded-bl-none border'
                }`}
              >
                <div className="text-sm">
                  {msg.message}
                </div>
                <div className={`text-xs mt-1 ${
                  msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'
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
              <div className="bg-white text-gray-800 shadow-sm rounded-lg rounded-bl-none border px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                currentQuestionIndex < questions.length 
                  ? "Ihre Antwort eingeben..." 
                  : "Weitere Fragen stellen..."
              }
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div>
              💬 Nachrichten: {chatHistory.filter(m => m.type === 'user').length} | 
              🤝 Hilfe: {helpRequests} | 
              ⚠️ Fehler: {errors}
            </div>
            <div>
              Eingabe + Enter zum Senden
            </div>
          </div>
        </div>

        {/* Complete Button */}
        {completedQuestions >= questions.length && (
          <div className="p-4 border-t bg-green-50">
            <button
              onClick={handleComplete}
              className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <CheckCircle className="w-5 h-5 inline-block mr-2" />
              Variante B abschließen ({progress}% vollständig)
            </button>
          </div>
        )}
      </div>

      {/* Question Overview */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border p-4">
        <h3 className="font-semibold mb-3">Fragenübersicht</h3>
        <div className="space-y-2">
          {questions.map((question, idx) => (
            <div
              key={question.field}
              className={`flex items-center p-2 rounded ${
                idx === currentQuestionIndex
                  ? 'bg-blue-50 border border-blue-200'
                  : question.completed
                  ? 'bg-green-50'
                  : 'bg-gray-50'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                question.completed
                  ? 'bg-green-500 text-white'
                  : idx === currentQuestionIndex
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {question.completed ? '✓' : idx + 1}
              </div>
              <div className="flex-1">
                <div className="text-sm">{question.field.replace(/_/g, ' ')}</div>
                {answers[question.field] && (
                  <div className="text-xs text-gray-600 mt-1">
                    Antwort: {answers[question.field]}
                  </div>
                )}
              </div>
              {idx === currentQuestionIndex && (
                <ArrowDown className="w-4 h-4 text-blue-500 animate-bounce" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}