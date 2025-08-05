// src/components/Questionnaire/TimingTracker.tsx
import { useState, useEffect, useRef } from 'react'

interface TimingData {
  studyStart: Date
  studyEnd?: Date
  totalDuration?: number
  variantTimes: {
    variantA?: { start: Date; end?: Date; duration?: number }
    variantB?: { start: Date; end?: Date; duration?: number }
  }
  questionnaireStartTimes: {
    demographics?: Date
    variantA?: Date
    variantB?: Date
    comparison?: Date
  }
  questionnaireDurations: {
    demographics?: number
    variantA?: number
    variantB?: number
    comparison?: number
  }
}

export const useTimingTracker = () => {
  const [timingData, setTimingData] = useState<TimingData>({
    studyStart: new Date(),
    variantTimes: {},
    questionnaireStartTimes: {},
    questionnaireDurations: {}
  })

  const currentQuestionnaireStart = useRef<Date | null>(null)

  const startVariant = (variant: 'A' | 'B') => {
    console.log(`⏱️ Starting variant ${variant}`)
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
    console.log(`⏱️ Ending variant ${variant}`)
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

  const startQuestionnaire = (type: 'demographics' | 'variantA' | 'variantB' | 'comparison') => {
    console.log(`⏱️ Starting questionnaire: ${type}`)
    const startTime = new Date()
    currentQuestionnaireStart.current = startTime
    
    setTimingData(prev => ({
      ...prev,
      questionnaireStartTimes: {
        ...prev.questionnaireStartTimes,
        [type]: startTime
      }
    }))
  }

  const endQuestionnaire = (type: 'demographics' | 'variantA' | 'variantB' | 'comparison') => {
    console.log(`⏱️ Ending questionnaire: ${type}`)
    const endTime = new Date()
    const startTime = currentQuestionnaireStart.current || timingData.questionnaireStartTimes[type]
    
    if (startTime) {
      const duration = endTime.getTime() - startTime.getTime()
      
      setTimingData(prev => ({
        ...prev,
        questionnaireDurations: {
          ...prev.questionnaireDurations,
          [type]: duration
        }
      }))
    }
    
    currentQuestionnaireStart.current = null
  }

  const finishStudy = () => {
    console.log('⏱️ Finishing study')
    const endTime = new Date()
    setTimingData(prev => ({
      ...prev,
      studyEnd: endTime,
      totalDuration: endTime.getTime() - prev.studyStart.getTime()
    }))
  }

  return {
    timingData,
    startVariant,
    endVariant,
    startQuestionnaire,
    endQuestionnaire,
    finishStudy
  }
}