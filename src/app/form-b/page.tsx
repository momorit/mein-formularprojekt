'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function FormBPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isStudy = searchParams.get('study') === 'true'
  const participantId = searchParams.get('participant')

  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogStarted, setDialogStarted] = useState(false)

  // Start dialog on mount
  useEffect(() => {
    startDialog()
  }, [])

  const startDialog = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/dialog/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: 'Gebäude-Energieberatung Dialog' 
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.questions && Array.isArray(data.questions)) {
          setQuestions(data.questions)
          setDialogStarted(true)
          setChatHistory([{
            role: 'assistant',
            content: `Hallo! Ich helfe Ihnen bei der Gebäude-Energieberatung. ${data.questions[0]?.text || 'Lassen Sie uns beginnen!'}`
          }])
        }
      } else {
        // Fallback questions
        const fallbackQuestions = [
          { id: 'q1', text: 'Welche Art von Gebäude möchten Sie bewerten lassen?' },
          { id: 'q2', text: 'In welchem Jahr wurde Ihr Gebäude erbaut?' },
          { id: 'q3', text: 'Wie groß ist die Wohnfläche Ihres Gebäudes?' },
          { id: 'q4', text: 'Welche Heizungsart verwenden Sie derzeit?' }
        ]
        setQuestions(fallbackQuestions)
        setDialogStarted(true)
        setChatHistory([{
          role: 'assistant',
          content: `Hallo! Ich helfe Ihnen bei der Gebäude-Energieberatung. ${fallbackQuestions[0].text}`
        }])
      }
    } catch (error) {
      console.error('Error starting dialog:', error)
      // Fallback
      const fallbackQuestions = [
        { id: 'q1', text: 'Welche Art von Gebäude möchten Sie bewerten lassen?' },
        { id: 'q2', text: 'In welchem Jahr wurde Ihr Gebäude erbaut?' }
      ]
      setQuestions(fallbackQuestions)
      setDialogStarted(true)
      setChatHistory([{
        role: 'assistant',
        content: `Hallo! Ich helfe Ihnen bei der Gebäude-Energieberatung. ${fallbackQuestions[0].text}`
      }])
    }
    setLoading(false)
  }

  const sendMessage = async () => {
    if (!userInput.trim()) return

    const message = userInput.trim()
    setUserInput('')
    
    setChatHistory(prev => [...prev, { role: 'user', content: message }])

    try {
      const currentQuestion = questions[currentQuestionIndex]
      
      // Save answer
      if (currentQuestion && message !== '?') {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: message }))
      }

      const response = await fetch('/api/dialog/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          currentQuestion
        })
      })

      let assistantMessage = 'Vielen Dank für Ihre Antwort!'

      if (response.ok) {
        const data = await response.json()
        assistantMessage = data.response || assistantMessage
      }

      setChatHistory(prev => [...prev, { role: 'assistant', content: assistantMessage }])

      // Move to next question if not help request
      if (message !== '?' && currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          const nextIndex = currentQuestionIndex + 1
          setCurrentQuestionIndex(nextIndex)
          const nextQuestion = questions[nextIndex]
          if (nextQuestion) {
            setChatHistory(prev => [...prev, { 
              role: 'assistant', 
              content: String(nextQuestion.text)
            }])
          }
        }, 1000)
      }

    } catch (error) {
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Es gab ein Problem. Können Sie Ihre Antwort wiederholen?'
      }])
    }
  }

  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/dialog/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions,
          answers,
          chatHistory,
          timestamp: new Date().toISOString(),
          variant: 'B',
          participantId: participantId || 'unknown'
        })
      })

      if (response.ok) {
        if (isStudy) {
          router.push('/study?step=survey1')
        } else {
          alert('Dialog erfolgreich gespeichert!')
        }
      } else {
        alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.')
      }
    } catch (error) {
      alert('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    }
  }

  const isComplete = currentQuestionIndex >= questions.length - 1 && 
    questions.length > 0 && 
    answers[questions[questions.length - 1]?.id]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Dialog wird gestartet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {isStudy && (
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-green-600 mb-2">Variante B: Dialog-System</h1>
            <p className="text-gray-600">Schritt-für-Schritt Dialog mit KI-Assistent</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            💬 Gebäude-Energieberatung Dialog
          </h2>

          {/* Progress */}
          {questions.length > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Fortschritt</span>
                <span>{Math.min(currentQuestionIndex + 1, questions.length)} von {questions.length}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="h-96 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4 space-y-4">
            {chatHistory.map((message, index) => (
              <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="text-sm">{String(message.content)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="space-y-4">
            <div className="flex space-x-2">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ihre Antwort..."
                className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={sendMessage}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Senden
              </button>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  setUserInput('?')
                  sendMessage()
                }}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                ❓ Hilfe zu dieser Frage
              </button>

              {isComplete && (
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {isStudy ? 'Weiter zur Bewertung' : 'Dialog speichern'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}