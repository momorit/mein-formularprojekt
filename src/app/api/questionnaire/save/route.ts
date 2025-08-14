// src/app/api/questionnaire/save/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface QuestionnaireData {
  variant: 'A' | 'B' | 'comparison'
  participantId?: string
  trustResponses: Record<string, number>
  susResponses: Record<string, number>
  preferenceResponses: Record<string, number | string>
  completedSections: string[]
  startTime: string
  endTime?: string
  sectionTimes: Record<string, { start: string; end?: string; duration?: number }>
}

// Helper function to calculate SUS score
function calculateSUSScore(responses: Record<string, number>): number {
  const oddQuestions = [1, 3, 5, 7, 9] // Positive statements
  const evenQuestions = [2, 4, 6, 8, 10] // Negative statements
  
  let totalScore = 0
  
  // For odd questions: subtract 1 from response
  oddQuestions.forEach(q => {
    const response = responses[`sus_${q}`] || 0
    totalScore += response - 1
  })
  
  // For even questions: subtract response from 5
  evenQuestions.forEach(q => {
    const response = responses[`sus_${q}`] || 0
    totalScore += 5 - response
  })
  
  // Multiply by 2.5 to get score out of 100
  return totalScore * 2.5
}

// Helper function to analyze trust responses
function analyzeTrustResponses(responses: Record<string, number>) {
  const trustKeys = ['trust_reliability', 'trust_accuracy', 'trust_recommendations', 'trust_data_handling', 'trust_decision_support']
  const validResponses = trustKeys.filter(key => responses[key] > 0)
  
  if (validResponses.length === 0) return null
  
  const total = validResponses.reduce((sum, key) => sum + responses[key], 0)
  const average = total / validResponses.length
  
  return {
    average_score: Math.round(average * 100) / 100,
    total_responses: validResponses.length,
    individual_scores: validResponses.reduce((acc, key) => {
      acc[key] = responses[key]
      return acc
    }, {} as Record<string, number>),
    trust_level: average >= 4 ? 'high' : average >= 3 ? 'medium' : 'low'
  }
}

// Helper function to analyze preference responses
function analyzePreferenceResponses(responses: Record<string, number | string>) {
  const analysis: any = {
    direct_comparisons: {},
    variant_ratings: {},
    usage_intentions: {},
    recommendations: {}
  }
  
  // Direct comparison questions
  const comparisonKeys = ['speed_preference', 'ease_preference', 'help_preference', 'control_feeling']
  comparisonKeys.forEach(key => {
    if (responses[key]) {
      analysis.direct_comparisons[key] = responses[key]
    }
  })
  
  // Likert scale ratings
  const likertKeys = ['overall_preference', 'future_usage_a', 'future_usage_b', 'recommendation_a', 'recommendation_b']
  likertKeys.forEach(key => {
    if (responses[key] && responses[key] !== 0) {
      analysis.variant_ratings[key] = responses[key]
    }
  })
  
  // Overall preference calculation
  const overallPref = responses['overall_preference'] as number
  if (overallPref) {
    analysis.overall_preference_direction = overallPref >= 4 ? 'prefers_A' : overallPref <= 2 ? 'prefers_B' : 'neutral'
  }
  
  return analysis
}

export async function POST(request: NextRequest) {
  try {
    console.log('📋 API: Saving questionnaire data...')
    
    const data: QuestionnaireData = await request.json()
    
    // Calculate analytics
    const analytics = {
      sus_score: Object.keys(data.susResponses).length > 0 ? calculateSUSScore(data.susResponses) : null,
      trust_analysis: analyzeTrustResponses(data.trustResponses),
      preference_analysis: data.variant === 'comparison' ? analyzePreferenceResponses(data.preferenceResponses) : null,
      completion_stats: {
        total_sections: data.completedSections.length,
        section_durations: data.sectionTimes,
        total_duration: data.endTime && data.startTime ? 
          new Date(data.endTime).getTime() - new Date(data.startTime).getTime() : null
      }
    }
    
    const enhancedData = {
      type: 'questionnaire_response',
      variant: data.variant,
      participant_id: data.participantId,
      timestamp: new Date().toISOString(),
      
      // Raw responses
      responses: {
        trust: data.trustResponses,
        sus: data.susResponses,
        preference: data.preferenceResponses
      },
      
      // Calculated analytics
      analytics,
      
      // Timing data
      timing: {
        start_time: data.startTime,
        end_time: data.endTime,
        section_times: data.sectionTimes,
        completed_sections: data.completedSections
      },
      
      // Study metadata
      study_metadata: {
        project: 'FormularIQ - LLM-gestützte Formularbearbeitung',
        institution: 'HAW Hamburg',
        researcher: 'Moritz Treu',
        version: '2.0.0',
        questionnaire_version: 'enhanced_v1.0'
      }
    }

    // Log comprehensive data (Vercel compatible)
    console.log('📊 QUESTIONNAIRE DATA:', JSON.stringify(enhancedData, null, 2))
    
    // Create summary for quick analysis
    const summary = {
      participant: data.participantId,
      variant: data.variant,
      sus_score: analytics.sus_score,
      trust_level: analytics.trust_analysis?.trust_level,
      overall_preference: analytics.preference_analysis?.overall_preference_direction,
      completion_time_minutes: analytics.completion_stats.total_duration ? 
        Math.round(analytics.completion_stats.total_duration / 60000) : null
    }
    
    console.log('📈 QUESTIONNAIRE SUMMARY:', summary)
    
    return NextResponse.json({
      success: true,
      questionnaire_type: data.variant,
      analytics: {
        sus_score: analytics.sus_score,
        trust_average: analytics.trust_analysis?.average_score,
        completion_time: analytics.completion_stats.total_duration
      },
      storage_location: 'vercel_logging',
      timestamp: new Date().toISOString(),
      message: `Questionnaire data for variant ${data.variant} saved successfully`
    })
    
  } catch (error) {
    console.error('❌ Questionnaire save error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save questionnaire data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}