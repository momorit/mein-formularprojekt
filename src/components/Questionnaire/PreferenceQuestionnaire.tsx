// src/components/Questionnaire/PreferenceQuestionnaire.tsx
import React from 'react'
import { LikertScale } from './LikertScale'

interface PreferenceQuestionnaireProps {
  responses: Record<string, number | string>
  onChange: (responses: Record<string, number | string>) => void
}

const COMPARISON_QUESTIONS = [
  {
    key: 'speed_preference',
    question: 'Welche Variante war schneller zu bedienen?',
    type: 'radio' as const,
    options: [
      'Variante A (Sichtbares Formular) war deutlich schneller',
      'Variante A war etwas schneller', 
      'Beide etwa gleich schnell',
      'Variante B (Dialog) war etwas schneller',
      'Variante B (Dialog) war deutlich schneller'
    ]
  },
  {
    key: 'ease_preference',
    question: 'Welche Variante war einfacher zu bedienen?',
    type: 'radio' as const,
    options: [
      'Variante A war deutlich einfacher',
      'Variante A war etwas einfacher',
      'Beide etwa gleich einfach', 
      'Variante B war etwas einfacher',
      'Variante B war deutlich einfacher'
    ]
  },
  {
    key: 'help_preference',
    question: 'Bei welcher Variante waren die Hilfestellungen nützlicher?',
    type: 'radio' as const,
    options: [
      'Variante A hatte deutlich bessere Hilfen',
      'Variante A hatte etwas bessere Hilfen',
      'Beide etwa gleich hilfreich',
      'Variante B hatte etwas bessere Hilfen', 
      'Variante B hatte deutlich bessere Hilfen'
    ]
  },
  {
    key: 'control_feeling',
    question: 'Bei welcher Variante hatten Sie mehr Kontrolle über den Prozess?',
    type: 'radio' as const,
    options: [
      'Deutlich mehr Kontrolle bei Variante A',
      'Etwas mehr Kontrolle bei Variante A',
      'Gleiche Kontrolle bei beiden',
      'Etwas mehr Kontrolle bei Variante B',
      'Deutlich mehr Kontrolle bei Variante B'
    ]
  }
]

const LIKERT_QUESTIONS = [
  {
    key: 'overall_preference',
    question: 'Insgesamt bevorzuge ich Variante A (Sichtbares Formular) gegenüber Variante B (Dialog)',
    labels: ['Stimme gar nicht zu', 'Stimme voll zu'] as [string, string]
  },
  {
    key: 'future_usage_a',
    question: 'Ich würde Variante A (Sichtbares Formular) in Zukunft gerne wieder nutzen',
    labels: ['Definitiv nicht', 'Definitiv ja'] as [string, string]
  },
  {
    key: 'future_usage_b', 
    question: 'Ich würde Variante B (Dialog-System) in Zukunft gerne wieder nutzen',
    labels: ['Definitiv nicht', 'Definitiv ja'] as [string, string]
  },
  {
    key: 'recommendation_a',
    question: 'Ich würde Variante A anderen Personen empfehlen',
    labels: ['Definitiv nicht', 'Definitiv ja'] as [string, string]
  },
  {
    key: 'recommendation_b',
    question: 'Ich würde Variante B anderen Personen empfehlen', 
    labels: ['Definitiv nicht', 'Definitiv ja'] as [string, string]
  }
]

export const PreferenceQuestionnaire: React.FC<PreferenceQuestionnaireProps> = ({
  responses,
  onChange
}) => {
  const handleChange = (key: string, value: number | string) => {
    onChange({
      ...responses,
      [key]: value
    })
  }

  const completedRadio = COMPARISON_QUESTIONS.filter(q => responses[q.key]).length
  const completedLikert = LIKERT_QUESTIONS.filter(q => responses[q.key] && responses[q.key] !== 0).length
  const totalQuestions = COMPARISON_QUESTIONS.length + LIKERT_QUESTIONS.length
  const completedTotal = completedRadio + completedLikert
  const progress = (completedTotal / totalQuestions) * 100

  return (
    <div className="space-y-8">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-purple-900 mb-2">
          ⚖️ Nutzerpräferenz & Vergleich
        </h3>
        <p className="text-sm text-purple-700 mb-3">
          Vergleichen Sie beide Varianten direkt miteinander. Denken Sie an Ihre Erfahrung 
          mit dem <strong>sichtbaren Formular (A)</strong> und dem <strong>Dialog-System (B)</strong>.
        </p>
        <div className="w-full bg-purple-200 rounded-full h-2">
          <div 
            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-purple-600 mt-1">
          {completedTotal} von {totalQuestions} Fragen beantwortet
        </p>
      </div>

      {/* Direkte Vergleichsfragen */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          📊 Direkter Vergleich
        </h4>
        
        {COMPARISON_QUESTIONS.map((item, index) => (
          <div key={item.key} className="p-4 border border-gray-200 rounded-lg bg-white">
            <label className="block text-sm font-medium text-gray-900 mb-4">
              <span className="text-purple-600 font-semibold">{index + 1}. </span>
              {item.question} <span className="text-red-500">*</span>
            </label>
            
            <div className="space-y-3">
              {item.options.map((option, optionIndex) => (
                <label key={optionIndex} className="flex items-center cursor-pointer group">
                  <input
                    type="radio"
                    name={item.key}
                    value={option}
                    checked={responses[item.key] === option}
                    onChange={() => handleChange(item.key, option)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500 group-hover:border-purple-400"
                    required
                  />
                  <span className="ml-3 text-sm text-gray-700 group-hover:text-purple-700">
                    {option}
                  </span>
                </label>
              ))}
            </div>
            
            {!responses[item.key] && (
              <p className="text-xs text-red-500 mt-2">Bitte wählen Sie eine Option aus.</p>
            )}
          </div>
        ))}
      </div>

      {/* Bewertungsfragen */}
      <div className="space-y-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Persönliche Bewertung
        </h4>
        
        {LIKERT_QUESTIONS.map((item, index) => (
          <LikertScale
            key={item.key}
            questionNumber={COMPARISON_QUESTIONS.length + index + 1}
            question={item.question}
            value={responses[item.key] as number || 0}
            onChange={(value) => handleChange(item.key, value)}
            labels={item.labels}
            required
          />
        ))}
      </div>

      {/* Begründung der Präferenz */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          <span className="text-purple-600 font-semibold">{totalQuestions + 1}. </span>
          Begründen Sie Ihre Gesamtpräferenz: Was hat Ihre Entscheidung beeinflusst?
        </label>
        <textarea
          value={responses['preference_reasoning'] || ''}
          onChange={(e) => handleChange('preference_reasoning', e.target.value)}
          placeholder="Beschreiben Sie, welche Faktoren für Ihre Präferenz entscheidend waren (z.B. Übersichtlichkeit, Führung durch den Prozess, Geschwindigkeit, Vertrauen...)."
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          {(responses['preference_reasoning'] || '').toString().length}/500 Zeichen
        </p>
      </div>

      {/* Anwendungskontext */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-4">
          <span className="text-purple-600 font-semibold">{totalQuestions + 2}. </span>
          Für welche Art von Formularen würden Sie welche Variante bevorzugen?
        </label>
        
        <div className="space-y-4">
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Kurze, einfache Formulare (1-5 Felder):</h5>
            <div className="space-y-2">
              {['Variante A (Sichtbares Formular)', 'Variante B (Dialog)', 'Beide gleich gut'].map((option) => (
                <label key={option} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="simple_forms_preference"
                    value={option}
                    checked={responses['simple_forms_preference'] === option}
                    onChange={() => handleChange('simple_forms_preference', option)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium text-gray-800 mb-2">Lange, komplexe Formulare (10+ Felder):</h5>
            <div className="space-y-2">
              {['Variante A (Sichtbares Formular)', 'Variante B (Dialog)', 'Beide gleich gut'].map((option) => (
                <label key={option} className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="complex_forms_preference"
                    value={option}
                    checked={responses['complex_forms_preference'] === option}
                    onChange={() => handleChange('complex_forms_preference', option)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}