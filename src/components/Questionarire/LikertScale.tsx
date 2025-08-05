// src/components/Questionnaire/LikertScale.tsx
import React from 'react'

interface LikertScaleProps {
  question: string
  value: number
  onChange: (value: number) => void
  labels: [string, string]
  required?: boolean
}

export const LikertScale: React.FC<LikertScaleProps> = ({
  question,
  value,
  onChange,
  labels,
  required = false
}) => {
  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-900 mb-3">
        {question} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{labels[0]}</span>
        <span className="text-xs text-gray-500">{labels[1]}</span>
      </div>
      
      <div className="flex justify-center space-x-4">
        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="flex flex-col items-center cursor-pointer">
            <input
              type="radio"
              name={`likert-${question}`}
              value={num}
              checked={value === num}
              onChange={() => onChange(num)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              required={required}
            />
            <span className="text-xs mt-1 text-gray-600">{num}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

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

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          System Usability Scale (SUS) - {variantName}
        </h3>
        <p className="text-sm text-blue-700">
          Bewerten Sie bitte Ihre Erfahrung mit dem gerade getesteten System.
        </p>
      </div>

      {SUS_QUESTIONS.map((question, index) => (
        <LikertScale
          key={index}
          question={`${index + 1}. ${question}`}
          value={responses[`sus_${index + 1}`] || 0}
          onChange={(value) => handleChange(index, value)}
          labels={["Stimme gar nicht zu", "Stimme voll zu"]}
          required
        />
      ))}
    </div>
  )
}

// src/components/Questionnaire/CustomUsabilityItems.tsx
import React from 'react'
import { LikertScale } from './LikertScale'

interface CustomUsabilityItemsProps {
  responses: Record<string, number>
  onChange: (responses: Record<string, number>) => void
}

const CUSTOM_ITEMS = [
  {
    key: 'helpfulness',
    question: 'Die Eingabehilfen waren hilfreich',
    labels: ['Gar nicht hilfreich', 'Sehr hilfreich'] as [string, string]
  },
  {
    key: 'efficiency', 
    question: 'Ich konnte schnell die gewünschten Informationen eingeben',
    labels: ['Sehr langsam', 'Sehr schnell'] as [string, string]
  },
  {
    key: 'trust',
    question: 'Ich vertraue darauf, dass das System meine Eingaben korrekt verarbeitet',
    labels: ['Gar nicht', 'Vollständig'] as [string, string]
  },
  {
    key: 'frustration',
    question: 'Wie frustrierend war diese Variante?',
    labels: ['Gar nicht frustrierend', 'Sehr frustrierend'] as [string, string]
  }
]

export const CustomUsabilityItems: React.FC<CustomUsabilityItemsProps> = ({
  responses,
  onChange
}) => {
  const handleChange = (key: string, value: number) => {
    onChange({
      ...responses,
      [key]: value
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-green-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          🎯 Spezifische Bewertung
        </h3>
        <p className="text-sm text-green-700">
          Bewerten Sie spezifische Aspekte der Formularbearbeitung.
        </p>
      </div>

      {CUSTOM_ITEMS.map((item) => (
        <LikertScale
          key={item.key}
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

// src/components/Questionnaire/ComparisonQuestionnaire.tsx
import React from 'react'

interface ComparisonQuestionnaireProps {
  responses: Record<string, string>
  onChange: (responses: Record<string, string>) => void
}

const COMPARISON_QUESTIONS = [
  {
    key: 'speed',
    question: 'Welche Variante war schneller zu bedienen?',
    options: ['Variante A (Sichtbar)', 'Variante B (Dialog)', 'Etwa gleich']
  },
  {
    key: 'understandability', 
    question: 'Welche Variante war verständlicher?',
    options: ['Variante A (Sichtbar)', 'Variante B (Dialog)', 'Etwa gleich']
  },
  {
    key: 'pleasantness',
    question: 'Welche Variante war angenehmer zu nutzen?', 
    options: ['Variante A (Sichtbar)', 'Variante B (Dialog)', 'Etwa gleich']
  },
  {
    key: 'future_preference',
    question: 'Welche würden Sie in Zukunft wählen?',
    options: ['Eindeutig A', 'Eher A', 'Egal', 'Eher B', 'Eindeutig B']
  }
]

export const ComparisonQuestionnaire: React.FC<ComparisonQuestionnaireProps> = ({
  responses,
  onChange
}) => {
  const handleChange = (key: string, value: string) => {
    onChange({
      ...responses,
      [key]: value
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-purple-900 mb-2">
          ⚖️ Direkter Vergleich
        </h3>
        <p className="text-sm text-purple-700">
          Vergleichen Sie beide Varianten direkt miteinander.
        </p>
      </div>

      {COMPARISON_QUESTIONS.map((item) => (
        <div key={item.key} className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            {item.question} <span className="text-red-500">*</span>
          </label>
          
          <div className="space-y-2">
            {item.options.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={item.key}
                  value={option}
                  checked={responses[item.key] === option}
                  onChange={() => handleChange(item.key, option)}
                  className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  required
                />
                <span className="ml-2 text-sm text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {/* Preference Reason */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Warum würden Sie diese Variante wählen? (Optional)
        </label>
        <textarea
          value={responses['preference_reason'] || ''}
          onChange={(e) => handleChange('preference_reason', e.target.value)}
          placeholder="1-2 Sätze..."
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          rows={3}
        />
      </div>

      {/* Overall Rating */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          Wie bewerten Sie beide Systeme insgesamt? <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500">Sehr schlecht</span>
          <input
            type="range"
            min="1"
            max="10"
            value={responses['overall_rating'] || '5'}
            onChange={(e) => handleChange('overall_rating', e.target.value)}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            required
          />
          <span className="text-xs text-gray-500">Ausgezeichnet</span>
        </div>
        <div className="text-center mt-2">
          <span className="text-lg font-semibold text-purple-600">
            {responses['overall_rating'] || '5'}/10
          </span>
        </div>
      </div>
    </div>
  )
}

// src/components/Questionnaire/TimingTracker.tsx
import React, { useEffect, useState } from 'react'

interface TimingData {
  startTime: Date
  endTime?: Date
  duration?: number
  variantTimes: {
    variantA?: { start: Date; end?: Date; duration?: number }
    variantB?: { start: Date; end?: Date; duration?: number }
  }
  questionnaireTime?: number
}

export const useTimingTracker = () => {
  const [timingData, setTimingData] = useState<TimingData>({
    startTime: new Date(),
    variantTimes: {}
  })

  const startVariant = (variant: 'A' | 'B') => {
    setTimingData(prev => ({
      ...prev,
      variantTimes: {
        ...prev.variantTimes,
        [`variant${variant}`]: {
          start: new Date()
        }
      }
    }))
  }

  const endVariant = (variant: 'A' | 'B') => {
    setTimingData(prev => {
      const variantKey = `variant${variant}` as keyof typeof prev.variantTimes
      const variantTime = prev.variantTimes[variantKey]
      
      if (variantTime && variantTime.start) {
        const endTime = new Date()
        const duration = endTime.getTime() - variantTime.start.getTime()
        
        return {
          ...prev,
          variantTimes: {
            ...prev.variantTimes,
            [variantKey]: {
              ...variantTime,
              end: endTime,
              duration
            }
          }
        }
      }
      return prev
    })
  }

  const finishStudy = () => {
    setTimingData(prev => ({
      ...prev,
      endTime: new Date(),
      duration: new Date().getTime() - prev.startTime.getTime()
    }))
  }

  return {
    timingData,
    startVariant,
    endVariant,
    finishStudy
  }
}