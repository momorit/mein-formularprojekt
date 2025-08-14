// src/components/Questionnaire/TrustQuestionnaire.tsx
import React from 'react'
import { LikertScale } from './LikertScale'

interface TrustQuestionnaireProps {
  responses: Record<string, number>
  onChange: (responses: Record<string, number>) => void
  variantName: string
}

const TRUST_QUESTIONS = [
  {
    key: 'trust_reliability',
    question: 'Ich vertraue darauf, dass das System meine Eingaben korrekt verarbeitet',
    labels: ['Gar kein Vertrauen', 'Vollständiges Vertrauen'] as [string, string]
  },
  {
    key: 'trust_accuracy',
    question: 'Ich bin zuversichtlich, dass das System genaue Ergebnisse liefert',
    labels: ['Gar nicht zuversichtlich', 'Sehr zuversichtlich'] as [string, string]
  },
  {
    key: 'trust_recommendations',
    question: 'Ich vertraue den Vorschlägen und Hilfestellungen des Systems',
    labels: ['Vertraue gar nicht', 'Vertraue vollständig'] as [string, string]
  },
  {
    key: 'trust_data_handling',
    question: 'Ich vertraue darauf, dass meine Daten sicher behandelt werden',
    labels: ['Gar kein Vertrauen', 'Vollständiges Vertrauen'] as [string, string]
  },
  {
    key: 'trust_decision_support',
    question: 'Ich würde wichtige Entscheidungen auf Basis der Systemausgaben treffen',
    labels: ['Niemals', 'Definitiv'] as [string, string]
  }
]

export const TrustQuestionnaire: React.FC<TrustQuestionnaireProps> = ({
  responses,
  onChange,
  variantName
}) => {
  const handleChange = (key: string, value: number) => {
    onChange({
      ...responses,
      [key]: value
    })
  }

  const completedQuestions = Object.keys(responses).filter(key => 
    TRUST_QUESTIONS.some(q => q.key === key) && responses[key] > 0
  ).length
  const progress = (completedQuestions / TRUST_QUESTIONS.length) * 100

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          🛡️ Vertrauen in das System
        </h3>
        <p className="text-sm text-green-700 mb-3">
          Bewerten Sie Ihr Vertrauen in <strong>{variantName}</strong>. 
          Vertrauen ist ein wichtiger Faktor für die Akzeptanz von KI-Systemen.
        </p>
        <div className="w-full bg-green-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-green-600 mt-1">
          {completedQuestions} von {TRUST_QUESTIONS.length} Fragen beantwortet
        </p>
      </div>

      {TRUST_QUESTIONS.map((item, index) => (
        <LikertScale
          key={item.key}
          questionNumber={index + 1}
          question={item.question}
          value={responses[item.key] || 0}
          onChange={(value) => handleChange(item.key, value)}
          labels={item.labels}
          required
        />
      ))}
    </div>
  )
}