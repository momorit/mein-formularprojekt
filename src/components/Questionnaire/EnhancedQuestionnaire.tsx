// src/components/Questionnaire/EnhancedQuestionnaire.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react'
import { TrustQuestionnaire } from './TrustQuestionnaire'
import { SUSQuestionnaire } from './SUSQuestionnaire'
import { PreferenceQuestionnaire } from './PreferenceQuestionnaire'
import { ProgressBar } from '../LoadingStates'

interface EnhancedQuestionnaireProps {
  variant: 'A' | 'B' | 'comparison'
  participantId?: string
  onComplete: (data: QuestionnaireData) => void
  onBack?: () => void
}

interface QuestionnaireData {
  variant: 'A' | 'B' | 'comparison'
  participantId?: string
  trustResponses: Record<string, number>
  susResponses: Record<string, number>
  preferenceResponses: Record<string, number | string>
  completedSections: string[]
  startTime: Date
  endTime?: Date
  sectionTimes: Record<string, { start: Date; end?: Date; duration?: number }>
}

const SECTIONS = {
  A: [
    { key: 'trust', title: 'Vertrauen', description: 'Bewertung des Vertrauens in Variante A' },
    { key: 'sus', title: 'Usability (SUS)', description: 'System Usability Scale für Variante A' }
  ],
  B: [
    { key: 'trust', title: 'Vertrauen', description: 'Bewertung des Vertrauens in Variante B' },
    { key: 'sus', title: 'Usability (SUS)', description: 'System Usability Scale für Variante B' }
  ],
  comparison: [
    { key: 'preference', title: 'Nutzerpräferenz', description: 'Direkter Vergleich beider Varianten' }
  ]
}

export const EnhancedQuestionnaire: React.FC<EnhancedQuestionnaireProps> = ({
  variant,
  participantId,
  onComplete,
  onBack
}) => {
  const [currentSection, setCurrentSection] = useState(0)
  const [startTime] = useState(new Date())
  const [sectionStartTime, setSectionStartTime] = useState(new Date())
  
  const [responses, setResponses] = useState<QuestionnaireData>({
    variant,
    participantId,
    trustResponses: {},
    susResponses: {},
    preferenceResponses: {},
    completedSections: [],
    startTime,
    sectionTimes: {}
  })

  const sections = SECTIONS[variant] || []
  const currentSectionConfig = sections[currentSection]

  // Track section timing
  useEffect(() => {
    if (currentSectionConfig) {
      const sectionStart = new Date()
      setSectionStartTime(sectionStart)
      setResponses(prev => ({
        ...prev,
        sectionTimes: {
          ...prev.sectionTimes,
          [currentSectionConfig.key]: { start: sectionStart }
        }
      }))
    }
  }, [currentSection, currentSectionConfig])

  const updateTrustResponses = (newResponses: Record<string, number>) => {
    setResponses(prev => ({ ...prev, trustResponses: newResponses }))
  }

  const updateSUSResponses = (newResponses: Record<string, number>) => {
    setResponses(prev => ({ ...prev, susResponses: newResponses }))
  }

  const updatePreferenceResponses = (newResponses: Record<string, number | string>) => {
    setResponses(prev => ({ ...prev, preferenceResponses: newResponses }))
  }

  const isCurrentSectionComplete = () => {
    if (!currentSectionConfig) return false

    switch (currentSectionConfig.key) {
      case 'trust':
        return Object.keys(responses.trustResponses).filter(key => responses.trustResponses[key] > 0).length >= 5
      case 'sus':
        return Object.keys(responses.susResponses).filter(key => key.startsWith('sus_')).length >= 10
      case 'preference':
        const requiredRadio = ['speed_preference', 'ease_preference', 'help_preference', 'control_feeling']
        const requiredLikert = ['overall_preference', 'future_usage_a', 'future_usage_b', 'recommendation_a', 'recommendation_b']
        const completedRadio = requiredRadio.filter(key => responses.preferenceResponses[key]).length
        const completedLikert = requiredLikert.filter(key => responses.preferenceResponses[key] && responses.preferenceResponses[key] !== 0).length
        return completedRadio === requiredRadio.length && completedLikert === requiredLikert.length
      default:
        return false
    }
  }

  const finishSection = () => {
    if (currentSectionConfig) {
      const endTime = new Date()
      const duration = endTime.getTime() - sectionStartTime.getTime()
      
      setResponses(prev => ({
        ...prev,
        completedSections: [...prev.completedSections, currentSectionConfig.key],
        sectionTimes: {
          ...prev.sectionTimes,
          [currentSectionConfig.key]: {
            ...prev.sectionTimes[currentSectionConfig.key],
            end: endTime,
            duration
          }
        }
      }))
    }
  }

  const goToNextSection = () => {
    if (isCurrentSectionComplete()) {
      finishSection()
      
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1)
      } else {
        // Complete questionnaire
        const finalData = {
          ...responses,
          endTime: new Date(),
          completedSections: [...responses.completedSections, currentSectionConfig.key]
        }
        onComplete(finalData)
      }
    }
  }

  const goToPreviousSection = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1)
    } else if (onBack) {
      onBack()
    }
  }

  const getVariantName = () => {
    switch (variant) {
      case 'A': return 'Variante A (Sichtbares Formular)'
      case 'B': return 'Variante B (Dialog-System)'
      case 'comparison': return 'Vergleich beider Varianten'
      default: return 'Unbekannte Variante'
    }
  }

  const renderCurrentSection = () => {
    if (!currentSectionConfig) return null

    switch (currentSectionConfig.key) {
      case 'trust':
        return (
          <TrustQuestionnaire
            responses={responses.trustResponses}
            onChange={updateTrustResponses}
            variantName={getVariantName()}
          />
        )
      case 'sus':
        return (
          <SUSQuestionnaire
            responses={responses.susResponses}
            onChange={updateSUSResponses}
            variantName={getVariantName()}
          />
        )
      case 'preference':
        return (
          <PreferenceQuestionnaire
            responses={responses.preferenceResponses}
            onChange={updatePreferenceResponses}
          />
        )
      default:
        return <div>Unbekannte Sektion</div>
    }
  }

  const getSectionProgress = () => {
    switch (currentSectionConfig?.key) {
      case 'trust':
        const trustCompleted = Object.keys(responses.trustResponses).filter(key => responses.trustResponses[key] > 0).length
        return { completed: trustCompleted, total: 5 }
      case 'sus':
        const susCompleted = Object.keys(responses.susResponses).filter(key => key.startsWith('sus_')).length
        return { completed: susCompleted, total: 10 }
      case 'preference':
        const requiredTotal = 9 // 4 radio + 5 likert
        const radioCompleted = ['speed_preference', 'ease_preference', 'help_preference', 'control_feeling']
          .filter(key => responses.preferenceResponses[key]).length
        const likertCompleted = ['overall_preference', 'future_usage_a', 'future_usage_b', 'recommendation_a', 'recommendation_b']
          .filter(key => responses.preferenceResponses[key] && responses.preferenceResponses[key] !== 0).length
        return { completed: radioCompleted + likertCompleted, total: requiredTotal }
      default:
        return { completed: 0, total: 1 }
    }
  }

  const { completed, total } = getSectionProgress()
  const isComplete = isCurrentSectionComplete()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📋 Fragebogen: {getVariantName()}
          </h1>
          {participantId && (
            <Badge variant="outline" className="mb-4">
              Teilnehmer: {participantId}
            </Badge>
          )}
          
          {/* Overall Progress */}
          <div className="max-w-md mx-auto">
            <ProgressBar
              current={currentSection + (isComplete ? 1 : 0)}
              total={sections.length}
              variant="blue"
              showLabel
              showPercentage
              className="mb-2"
            />
            <p className="text-sm text-gray-600">
              Abschnitt {currentSection + 1} von {sections.length}
            </p>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-3">
                <span>{currentSectionConfig?.title}</span>
                {isComplete && <CheckCircle className="w-5 h-5 text-green-500" />}
                {!isComplete && <AlertCircle className="w-5 h-5 text-amber-500" />}
              </CardTitle>
              <Badge variant={isComplete ? "default" : "secondary"}>
                {completed}/{total} Fragen
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              {currentSectionConfig?.description}
            </p>
          </CardHeader>
          
          <CardContent>
            {renderCurrentSection()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={goToPreviousSection}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Zurück</span>
          </Button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              {isComplete ? (
                <span className="text-green-600 font-medium">
                  ✓ Abschnitt vollständig
                </span>
              ) : (
                <span className="text-amber-600">
                  Noch {total - completed} Fragen offen
                </span>
              )}
            </p>
          </div>

          <Button
            onClick={goToNextSection}
            disabled={!isComplete}
            className="flex items-center space-x-2"
          >
            <span>
              {currentSection === sections.length - 1 ? 'Abschließen' : 'Weiter'}
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}