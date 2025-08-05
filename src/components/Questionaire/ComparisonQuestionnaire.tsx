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
    options: ['Variante A (Sichtbares Formular)', 'Variante B (Dialog-System)', 'Etwa gleich schnell']
  },
  {
    key: 'understandability', 
    question: 'Welche Variante war verständlicher und intuitiver?',
    options: ['Variante A (Sichtbares Formular)', 'Variante B (Dialog-System)', 'Etwa gleich verständlich']
  },
  {
    key: 'pleasantness',
    question: 'Welche Variante war angenehmer zu nutzen?', 
    options: ['Variante A (Sichtbares Formular)', 'Variante B (Dialog-System)', 'Etwa gleich angenehm']
  },
  {
    key: 'helpfulness',
    question: 'Bei welcher Variante waren die Hilfestellungen nützlicher?',
    options: ['Variante A (Sichtbares Formular)', 'Variante B (Dialog-System)', 'Etwa gleich hilfreich']
  },
  {
    key: 'future_preference',
    question: 'Welche Variante würden Sie in Zukunft für ähnliche Aufgaben wählen?',
    options: ['Eindeutig Variante A', 'Eher Variante A', 'Mir egal', 'Eher Variante B', 'Eindeutig Variante B']
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

  const completedQuestions = Object.keys(responses).filter(key => 
    COMPARISON_QUESTIONS.some(q => q.key === key)
  ).length
  const progress = (completedQuestions / COMPARISON_QUESTIONS.length) * 100

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-purple-900 mb-2">
          ⚖️ Direkter Vergleich
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
          {completedQuestions} von {COMPARISON_QUESTIONS.length} Fragen beantwortet
        </p>
      </div>

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

      {/* Preference Reason */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-3">
          <span className="text-purple-600 font-semibold">6. </span>
          Begründen Sie kurz Ihre Präferenz: Warum würden Sie diese Variante wählen?
        </label>
        <textarea
          value={responses['preference_reason'] || ''}
          onChange={(e) => handleChange('preference_reason', e.target.value)}
          placeholder="Z.B. 'Das Dialog-System war persönlicher und hat mich durch den Prozess geführt' oder 'Das sichtbare Formular gab mir eine bessere Übersicht'..."
          maxLength={400}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          rows={4}
        />
        <p className="text-xs text-gray-500 mt-1">
          {(responses['preference_reason'] || '').length}/400 Zeichen
        </p>
      </div>

      {/* Overall Rating */}
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <label className="block text-sm font-medium text-gray-900 mb-4">
          <span className="text-purple-600 font-semibold">7. </span>
          Wie bewerten Sie beide Systeme insgesamt? <span className="text-red-500">*</span>
        </label>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-gray-500 min-w-[80px]">Sehr schlecht</span>
          <div className="flex-1 relative">
            <input
              type="range"
              min="1"
              max="10"
              value={responses['overall_rating'] || '5'}
              onChange={(e) => handleChange('overall_rating', e.target.value)}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              required
            />
          </div>
          <span className="text-xs text-gray-500 min-w-[80px] text-right">Ausgezeichnet</span>
        </div>
        <div className="text-center mt-3">
          <span className="text-2xl font-bold text-purple-600">
            {responses['overall_rating'] || '5'}/10
          </span>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #7c3aed;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  )
}