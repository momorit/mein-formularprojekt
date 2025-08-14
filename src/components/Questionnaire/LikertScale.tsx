// src/components/Questionnaire/LikertScale.tsx
import React from 'react'

interface LikertScaleProps {
  questionNumber: number
  question: string
  value: number
  onChange: (value: number) => void
  labels: [string, string] // [minLabel, maxLabel]
  required?: boolean
  scale?: 5 | 7 // 5-point or 7-point scale
  className?: string
}

export const LikertScale: React.FC<LikertScaleProps> = ({
  questionNumber,
  question,
  value,
  onChange,
  labels,
  required = false,
  scale = 5,
  className = ''
}) => {
  const scalePoints = Array.from({ length: scale }, (_, i) => i + 1)
  
  const getScaleLabel = (point: number) => {
    if (point === 1) return labels[0]
    if (point === scale) return labels[1]
    return `${point}`
  }

  const getScaleDescription = (point: number) => {
    if (scale === 5) {
      switch (point) {
        case 1: return 'Stimme gar nicht zu'
        case 2: return 'Stimme eher nicht zu'
        case 3: return 'Neutral'
        case 4: return 'Stimme eher zu'
        case 5: return 'Stimme voll zu'
        default: return ''
      }
    } else {
      // 7-point scale
      switch (point) {
        case 1: return 'Stimme gar nicht zu'
        case 2: return 'Stimme nicht zu'
        case 3: return 'Stimme eher nicht zu'
        case 4: return 'Neutral'
        case 5: return 'Stimme eher zu'
        case 6: return 'Stimme zu'
        case 7: return 'Stimme voll zu'
        default: return ''
      }
    }
  }

  return (
    <div className={`p-4 border border-gray-200 rounded-lg bg-white ${className}`}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-900 mb-2">
          <span className="text-blue-600 font-semibold">{questionNumber}. </span>
          {question} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
      
      {/* Scale */}
      <div className="space-y-4">
        {/* Scale Points */}
        <div className="flex justify-between items-center">
          {scalePoints.map((point) => (
            <div key={point} className="flex flex-col items-center">
              <label className="cursor-pointer group">
                <input
                  type="radio"
                  name={`question_${questionNumber}`}
                  value={point}
                  checked={value === point}
                  onChange={() => onChange(point)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 group-hover:border-blue-400"
                  required={required}
                />
                <div className="text-xs text-gray-600 mt-1 text-center min-w-[2rem]">
                  {point}
                </div>
              </label>
            </div>
          ))}
        </div>
        
        {/* Scale Labels */}
        <div className="flex justify-between items-center text-xs text-gray-600 px-2">
          <span className="text-left max-w-[120px]">{labels[0]}</span>
          <span className="text-center text-gray-400">
            {scale === 5 ? '1 = gar nicht ... 5 = sehr' : '1 = gar nicht ... 7 = sehr'}
          </span>
          <span className="text-right max-w-[120px]">{labels[1]}</span>
        </div>
        
        {/* Selected Value Description */}
        {value > 0 && (
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              Ihre Bewertung: {getScaleDescription(value)}
            </span>
          </div>
        )}
        
        {/* Required Field Error */}
        {required && value === 0 && (
          <p className="text-xs text-red-500 mt-2">
            Bitte wählen Sie eine Bewertung aus.
          </p>
        )}
      </div>
    </div>
  )
}