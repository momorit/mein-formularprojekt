'use client'

import { useState } from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'

interface SUSQuestionnaireProps {
  variant: 'A' | 'B'
  onComplete: (susData: SUSResults) => void
  className?: string
}

interface SUSResults {
  variant: 'A' | 'B'
  responses: Record<string, number>
  susScore: number
  completedAt: Date
  timeSpent: number
}

// Wissenschaftlich validierte SUS-Fragen (deutsche Übersetzung)
const SUS_QUESTIONS = [
  {
    id: 'sus_1',
    text: 'Ich kann mir vorstellen, dieses System regelmäßig zu nutzen.',
    reverse: false
  },
  {
    id: 'sus_2', 
    text: 'Ich finde das System unnötig komplex.',
    reverse: true
  },
  {
    id: 'sus_3',
    text: 'Ich finde das System einfach zu nutzen.',
    reverse: false
  },
  {
    id: 'sus_4',
    text: 'Ich denke, ich würde technischen Support benötigen, um das System nutzen zu können.',
    reverse: true
  },
  {
    id: 'sus_5',
    text: 'Ich finde, dass die verschiedenen Funktionen des Systems gut integriert sind.',
    reverse: false
  },
  {
    id: 'sus_6',
    text: 'Ich finde, dass das System zu viele Inkonsistenzen aufweist.',
    reverse: true
  },
  {
    id: 'sus_7',
    text: 'Ich kann mir vorstellen, dass die meisten Menschen das System schnell erlernen.',
    reverse: false
  },
  {
    id: 'sus_8',
    text: 'Ich finde das System sehr umständlich zu nutzen.',
    reverse: true
  },
  {
    id: 'sus_9',
    text: 'Ich habe mich bei der Nutzung des Systems sehr sicher gefühlt.',
    reverse: false
  },
  {
    id: 'sus_10',
    text: 'Ich musste eine Menge lernen, bevor ich mit dem System arbeiten konnte.',
    reverse: true
  }
]

export default function SUSQuestionnaire({ variant, onComplete, className = '' }: SUSQuestionnaireProps) {
  const [responses, setResponses] = useState<Record<string, number>>({})
  const [startTime] = useState(Date.now())
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleResponseChange = (questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }))
    // Clear error when answered
    if (errors[questionId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[questionId]
        return newErrors
      })
    }
  }

  const calculateSUSScore = (responses: Record<string, number>): number => {
    let totalScore = 0

    SUS_QUESTIONS.forEach(question => {
      const response = responses[question.id]
      if (response !== undefined) {
        if (question.reverse) {
          // Für umgekehrte Fragen: 5 - Antwort
          totalScore += (5 - response)
        } else {
          // Für normale Fragen: Antwort - 1
          totalScore += (response - 1)
        }
      }
    })

    // SUS Score = Gesamtpunktzahl * 2.5
    return totalScore * 2.5
  }

  const handleSubmit = () => {
    // Validation
    const newErrors: Record<string, string> = {}
    
    SUS_QUESTIONS.forEach(question => {
      if (!responses[question.id]) {
        newErrors[question.id] = 'Bitte bewerten Sie diese Aussage'
      }
    })

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to first error
      const firstErrorElement = document.querySelector(`[data-question="${Object.keys(newErrors)[0]}"]`)
      firstErrorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    const susScore = calculateSUSScore(responses)
    const timeSpent = Date.now() - startTime

    const susResults: SUSResults = {
      variant,
      responses,
      susScore,
      completedAt: new Date(),
      timeSpent
    }

    onComplete(susResults)
  }

  const getScoreInterpretation = (score: number): { level: string, color: string, description: string } => {
    if (score >= 85) return { 
      level: 'Exzellent', 
      color: 'text-green-700 bg-green-100', 
      description: 'Hervorragende Usability' 
    }
    if (score >= 70) return { 
      level: 'Gut', 
      color: 'text-blue-700 bg-blue-100', 
      description: 'Gute Usability' 
    }
    if (score >= 50) return { 
      level: 'Okay', 
      color: 'text-yellow-700 bg-yellow-100', 
      description: 'Akzeptable Usability' 
    }
    return { 
      level: 'Schlecht', 
      color: 'text-red-700 bg-red-100', 
      description: 'Verbesserung nötig' 
    }
  }

  const completedQuestions = Object.keys(responses).length
  const progress = Math.round((completedQuestions / SUS_QUESTIONS.length) * 100)
  const previewScore = completedQuestions === SUS_QUESTIONS.length ? calculateSUSScore(responses) : null

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">
          Bewertung - Variante {variant}
        </h2>
        <p className="text-gray-600 mb-4">
          Bitte bewerten Sie Ihre Erfahrung mit {variant === 'A' ? 'dem sichtbaren Formular' : 'dem Dialog-System'}. 
          Verwenden Sie die Skala von 1 (stimme gar nicht zu) bis 5 (stimme vollständig zu).
        </p>
        
        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Fortschritt</span>
            <span className="text-sm text-gray-600">{completedQuestions} von {SUS_QUESTIONS.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {SUS_QUESTIONS.map((question, index) => (
          <div 
            key={question.id}
            data-question={question.id}
            className={`p-4 border rounded-lg ${
              errors[question.id] ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}
          >
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">
                {index + 1}. {question.text}
              </h3>
              
              {errors[question.id] && (
                <div className="flex items-center text-red-600 text-sm mb-2">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {errors[question.id]}
                </div>
              )}
            </div>

            {/* Rating Scale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Stimme gar nicht zu</span>
                <span>Stimme vollständig zu</span>
              </div>
              
              <div className="flex justify-center space-x-4">
                {[1, 2, 3, 4, 5].map(value => (
                  <label 
                    key={value}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={value}
                      checked={responses[question.id] === value}
                      onChange={() => handleResponseChange(question.id, value)}
                      className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 mb-1"
                    />
                    <span className={`text-sm font-medium transition-colors ${
                      responses[question.id] === value 
                        ? 'text-blue-600' 
                        : 'text-gray-600 group-hover:text-blue-600'
                    }`}>
                      {value}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Score */}
      {previewScore !== null && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Vorschau - SUS Score</h3>
          <div className="flex items-center space-x-4">
            <div className="text-2xl font-bold text-gray-900">
              {previewScore.toFixed(1)}
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreInterpretation(previewScore).color}`}>
              {getScoreInterpretation(previewScore).level}
            </div>
            <div className="text-sm text-gray-600">
              {getScoreInterpretation(previewScore).description}
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="mt-6 pt-6 border-t">
        <button
          onClick={handleSubmit}
          disabled={completedQuestions < SUS_QUESTIONS.length}
          className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
            completedQuestions >= SUS_QUESTIONS.length
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {completedQuestions >= SUS_QUESTIONS.length ? (
            <>
              <CheckCircle className="w-5 h-5 inline-block mr-2" />
              Bewertung abschließen
            </>
          ) : (
            `Noch ${SUS_QUESTIONS.length - completedQuestions} Fragen zu beantworten`
          )}
        </button>
      </div>

      {/* Info */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        System Usability Scale (SUS) - Wissenschaftlich validiertes Bewertungsinstrument
      </div>
    </div>
  )
}