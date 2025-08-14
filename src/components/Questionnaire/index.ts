// src/components/Questionnaire/index.ts
// Centralized exports for all questionnaire components

export { EnhancedQuestionnaire } from './EnhancedQuestionnaire'
export { TrustQuestionnaire } from './TrustQuestionnaire'
export { SUSQuestionnaire } from './SUSQuestionnaire'
export { PreferenceQuestionnaire } from './PreferenceQuestionnaire'
export { LikertScale } from './LikertScale'

// Legacy components (if still needed)
export { ComparisonQuestionnaire } from './ComparisonQuestionnaire'
export { CustomUsabilityItems } from './CustomUsabilityItems'
export { useTimingTracker } from './TimingTracker'

// Types
export interface QuestionnaireData {
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

export interface TrustResponse {
  trust_reliability: number
  trust_accuracy: number
  trust_recommendations: number
  trust_data_handling: number
  trust_decision_support: number
}

export interface SUSResponse {
  sus_1: number
  sus_2: number
  sus_3: number
  sus_4: number
  sus_5: number
  sus_6: number
  sus_7: number
  sus_8: number
  sus_9: number
  sus_10: number
}

export interface PreferenceResponse {
  // Direct comparisons
  speed_preference: string
  ease_preference: string
  help_preference: string
  control_feeling: string
  
  // Likert scales
  overall_preference: number
  future_usage_a: number
  future_usage_b: number
  recommendation_a: number
  recommendation_b: number
  
  // Open text
  preference_reasoning: string
  
  // Context preferences
  simple_forms_preference: string
  complex_forms_preference: string
}