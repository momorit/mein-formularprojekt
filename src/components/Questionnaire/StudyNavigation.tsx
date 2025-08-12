// src/components/StudyNavigation.tsx - Navigation Fix

import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, Play, FileText, MessageSquare, BarChart3 } from 'lucide-react'

interface StudyNavigationProps {
  currentStep: string
  onNavigate: (step: string) => void
  studyData: any
  className?: string
}

export default function StudyNavigation({ 
  currentStep, 
  onNavigate, 
  studyData,
  className = '' 
}: StudyNavigationProps) {
  
  const getFirstVariant = () => studyData.randomization === 'A-B' ? 'A' : 'B'
  const getSecondVariant = () => studyData.randomization === 'A-B' ? 'B' : 'A'

  const navigationSteps = [
    {
      id: 'welcome',
      title: 'Willkommen',
      icon: Play,
      completed: currentStep !== 'welcome'
    },
    {
      id: 'demographics',
      title: 'Angaben zu Ihrer Person',
      icon: FileText,
      completed: !!studyData.demographics,
      disabled: currentStep === 'welcome'
    },
    {
      id: 'first-variant',
      title: `Variante ${getFirstVariant()} ${getFirstVariant() === 'A' ? '(Formular)' : '(Dialog)'}`,
      icon: getFirstVariant() === 'A' ? FileText : MessageSquare,
      completed: !!studyData.variantAData || !!studyData.variantBData,
      disabled: !studyData.demographics
    },
    {
      id: 'second-variant', 
      title: `Variante ${getSecondVariant()} ${getSecondVariant() === 'A' ? '(Formular)' : '(Dialog)'}`,
      icon: getSecondVariant() === 'A' ? FileText : MessageSquare,
      completed: !!studyData.variantAData && !!studyData.variantBData,
      disabled: !(!!studyData.variantAData || !!studyData.variantBData)
    },
    {
      id: 'comparison',
      title: 'Vergleich der Varianten',
      icon: BarChart3,
      completed: !!studyData.comparisonData,
      disabled: !(!!studyData.variantAData && !!studyData.variantBData)
    },
    {
      id: 'completion',
      title: 'Abschluss',
      icon: Play,
      completed: false,
      disabled: !studyData.comparisonData
    }
  ]

  const currentStepIndex = navigationSteps.findIndex(step => step.id === currentStep)
  const currentStepData = navigationSteps[currentStepIndex]

  const handleNext = () => {
    const nextStepIndex = currentStepIndex + 1
    if (nextStepIndex < navigationSteps.length) {
      const nextStep = navigationSteps[nextStepIndex]
      if (!nextStep.disabled) {
        console.log(`📍 Navigation: ${currentStep} → ${nextStep.id}`)
        onNavigate(nextStep.id)
      }
    }
  }

  const handlePrevious = () => {
    const prevStepIndex = currentStepIndex - 1
    if (prevStepIndex >= 0) {
      const prevStep = navigationSteps[prevStepIndex]
      console.log(`📍 Navigation: ${currentStep} ← ${prevStep.id}`)
      onNavigate(prevStep.id)
    }
  }

  const canGoNext = currentStepIndex < navigationSteps.length - 1 && 
                   !navigationSteps[currentStepIndex + 1]?.disabled
  
  const canGoPrevious = currentStepIndex > 0

  return (
    <div className={`bg-white border-t border-gray-200 ${className}`}>
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-2">
        <div 
          className="bg-blue-500 h-2 transition-all duration-300 ease-out"
          style={{ 
            width: `${Math.round(((currentStepIndex + 1) / navigationSteps.length) * 100)}%` 
          }}
        />
      </div>
      
      {/* Navigation Controls */}
      <div className="flex items-center justify-between p-4">
        {/* Previous Button */}
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            canGoPrevious
              ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Zurück</span>
        </button>

        {/* Current Step Info */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center space-x-2">
            {currentStepData && (
              <>
                <currentStepData.icon className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-900">
                  {currentStepData.title}
                </span>
              </>
            )}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Schritt {currentStepIndex + 1} von {navigationSteps.length}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
            canGoNext
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-50 text-gray-400 cursor-not-allowed'
          }`}
        >
          <span>Weiter</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Debug Info (nur in Development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="px-4 pb-2 text-xs text-gray-500">
          Debug: {currentStep} | Next: {canGoNext ? 'enabled' : 'disabled'} | 
          Data: A={!!studyData.variantAData} B={!!studyData.variantBData} D={!!studyData.demographics}
        </div>
      )}
    </div>
  )
}

// Navigation Hook für einfache Verwendung
export function useStudyNavigation(initialStep = 'welcome') {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [stepHistory, setStepHistory] = useState([initialStep])

  const navigateToStep = (step: string) => {
    console.log(`🚀 Study Navigation: ${currentStep} → ${step}`)
    
    setStepHistory(prev => {
      const newHistory = [...prev]
      if (newHistory[newHistory.length - 1] !== step) {
        newHistory.push(step)
      }
      return newHistory
    })
    
    setCurrentStep(step)
  }

  const goBack = () => {
    if (stepHistory.length > 1) {
      const newHistory = [...stepHistory]
      newHistory.pop()
      const previousStep = newHistory[newHistory.length - 1]
      setStepHistory(newHistory)
      setCurrentStep(previousStep)
    }
  }

  return {
    currentStep,
    stepHistory,
    navigateToStep,
    goBack
  }
}