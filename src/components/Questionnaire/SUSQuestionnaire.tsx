// src/components/Questionnaire/SUSQuestionnaire.tsx
import React from 'react'
import { LikertScale } from './LikertScale'

interface SUSQuestionnaireProps {
  responses: Record<string, number>
  onChange: (responses: Record<string, number>) => void
  variantName: string
}

const SUS_QUESTIONS = [
  "Ich kann mir vorstellen, dieses System regelmäßig zu nutzen",
  "Ich fand das System unnötig komplex", 
  "Ich fand das System einfach zu bedienen",
  "Ich glaube, ich würde technische Unterstützung brauchen, um das System zu nutzen",
  "Die verschiedenen Funktionen in diesem System waren gut integriert",
  "Ich fand, es gab zu viele Unstimmigkeiten in diesem System",
  "Ich kann mir vorstellen, dass die meisten Menschen dieses System schnell lernen",
  "Ich fand das System sehr umständlich zu bedienen",
  "Ich fühlte mich bei der Nutzung des Systems sehr sicher",
  "Ich musste viele Dinge lernen, bevor ich mit diesem System arbeiten konnte"
]

export const SUSQuestionnaire: React.FC<SUSQuestionnaireProps> = ({
  responses,
  onChange,
  variantName
}) => {
  const handleChange = (questionIndex: number, value: number) => {
    onChange({
      ...responses,
      [`sus_${questionIndex + 1}`]: value
    })
  }

  const completedQuestions = Object.keys(responses).filter(key => key.startsWith('sus_')).length
  const progress = (completedQuestions / 10) * 100

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-2">
          📊 System Usability Scale (SUS)
        </h3>
        <p className="text-sm text-blue-700 mb-3">
          Bewerten Sie bitte Ihre Erfahrung mit <strong>{variantName}</strong>. 
          Der SUS ist ein standardisierter Fragebogen zur Bewertung der Benutzerfreundlichkeit.
        </p>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-blue-600 mt-1">
          {completedQuestions} von 10 Fragen beantwortet
        </p>
      </div>

      {SUS_QUESTIONS.map((question, index) => (
        <LikertScale
          key={index}
          questionNumber={index + 1}
          question={question}
          value={responses[`sus_${index + 1}`] || 0}
          onChange={(value) => handleChange(index, value)}
          labels={["Stimme gar nicht zu", "Stimme voll zu"]}
          required
        />
      ))}
    </div>
  )
}