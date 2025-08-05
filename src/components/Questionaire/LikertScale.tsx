// src/components/Questionnaire/LikertScale.tsx
import React from 'react'

interface LikertScaleProps {
  question: string
  value: number
  onChange: (value: number) => void
  labels: [string, string]
  required?: boolean
  questionNumber?: number
}

export const LikertScale: React.FC<LikertScaleProps> = ({
  question,
  value,
  onChange,
  labels,
  required = false,
  questionNumber
}) => {
  return (
    <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-white">
      <label className="block text-sm font-medium text-gray-900 mb-4">
        {questionNumber && <span className="text-blue-600 font-semibold">{questionNumber}. </span>}
        {question} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
        <span className="max-w-[120px] text-left">{labels[0]}</span>
        <span className="max-w-[120px] text-right">{labels[1]}</span>
      </div>
      
      <div className="flex justify-center space-x-6">
        {[1, 2, 3, 4, 5].map((num) => (
          <label key={num} className="flex flex-col items-center cursor-pointer group">
            <input
              type="radio"
              name={`likert-${question}`}
              value={num}
              checked={value === num}
              onChange={() => onChange(num)}
              className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
              required={required}
            />
            <span className="text-sm mt-2 text-gray-600 group-hover:text-blue-600 font-medium">{num}</span>
          </label>
        ))}
      </div>
      
      {!value && required && (
        <p className="text-xs text-red-500 mt-2">Bitte wählen Sie eine Bewertung aus.</p>
      )}
    </div>
  )
}