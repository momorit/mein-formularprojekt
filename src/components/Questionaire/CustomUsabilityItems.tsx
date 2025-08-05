// src/components/Questionnaire/CustomUsabilityItems.tsx
import React from 'react'
import { LikertScale } from './LikertScale'

interface CustomUsabilityItemsProps {
  responses: Record<string, number | string>
  onChange: (responses: Record<string, number | string>) => void
}

const CUSTOM_ITEMS = [
  {
    key: 'helpfulness',
    question: 'Die Eingabehilfen waren hilfreich für das Ausfüllen des Formulars',
    labels: ['Gar nicht hilfreich', 'Sehr hilfreich'] as [string, string]
  },
  {
    key: 'efficiency', 
    question: 'Ich konnte schnell und effizient die gewünschten Informationen eingeben',
    labels: ['Sehr langsam', 'Sehr schnell'] as [string, string]
  },
  {
    key: 'trust',
    question: 'Ich vertraue darauf, dass das System meine Eingaben korrekt verarbeitet',
    labels: ['Gar kein Vertrauen', 'Vollständiges Vertrauen'] as [string, string]
  },
  {
    key: 'frustration',
    question: 'Wie frustrierend war die Nutzung dieser Variante?',
    labels: ['Gar nicht frustrierend', 'Sehr frustrierend'] as [string, string]
  },
  {
    key: 'satisfaction',
    question: 'Wie zufrieden sind Sie mit dieser Formular-Variante?',
    labels: ['Sehr unzufrieden', 'Sehr zufrieden'] as [string, string]
  }
]

export const CustomUsabilityItems: React.FC<CustomUsabilityItemsProps> = ({
  responses,
  onChange
}) => {
  const handleChange = (key: string, value: number | string) => {
    onChange({
      ...responses,
      [key]: value
    })
  }

  const completedItems = Object.keys(responses).filter(key => 
    CUSTOM_ITEMS.some(item => item.key === key) && responses[key] !== 0
  ).length
  const progress = (completedItems / CUSTOM_ITEMS.length) * 100

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-green-900 mb-2">
          🎯 Spezifische Bewertung
        </h3>
        <p className="text-sm text-green-700 mb-3">
          Bewerten Sie spezifische Aspekte der Formularbearbeitung.
        </p>
        <div className="w-full bg-green-200 rounded-full h-2">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-green-600 mt-1">
          {completedItems} von {CUSTOM_ITEMS.length} Fragen beantwortet
        </p>
      </div>

      {CUSTOM_ITEMS.map((item, index) => (
        <LikertScale
          key={item.key}
          questionNumber={index + 1}
          question={item.question}
          value={responses[item.key] as number || 0}
          onChange={(value) => handleChange(item.key, value)}
          labels={item.labels}
          required
        />
      ))}

      {/* Free text feedback */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          6. Was hat Sie bei dieser Variante am meisten gestört? (Optional)
        </label>
        <textarea
          value={responses['negative_feedback'] as string || ''}
          onChange={(e) => handleChange('negative_feedback', e.target.value)}
          placeholder="Beschreiben Sie kurz, was problematisch war..."
          maxLength={300}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {(responses['negative_feedback'] as string || '').length}/300 Zeichen
        </p>
      </div>

      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          7. Was war besonders hilfreich bei dieser Variante? (Optional)
        </label>
        <textarea
          value={responses['positive_feedback'] as string || ''}
          onChange={(e) => handleChange('positive_feedback', e.target.value)}
          placeholder="Beschreiben Sie kurz, was gut funktioniert hat..."
          maxLength={300}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-1">
          {(responses['positive_feedback'] as string || '').length}/300 Zeichen
        </p>
      </div>
    </div>
  )
}