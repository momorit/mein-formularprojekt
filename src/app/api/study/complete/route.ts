// src/app/api/study/complete/route.ts
import { NextRequest, NextResponse } from 'next/server'

interface CompletedStudyData {
  participant_id: string
  randomization: string
  start_time: string
  end_time: string
  demographics: {
    age: string
    education: string
    experience: string
    tech_affinity: string
  }
  variant1_questionnaire: any
  variant2_questionnaire: any
  comparison_questionnaire: any
  study_metadata: {
    project: string
    institution: string
    researcher: string
    version: string
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🎯 API: Completing full study...')
    
    const data: CompletedStudyData = await request.json()
    
    // Calculate study analytics
    const studyDuration = new Date(data.end_time).getTime() - new Date(data.start_time).getTime()
    const studyDurationMinutes = Math.round(studyDuration / 60000)
    
    // Analyze questionnaire data
    const variant1SUS = data.variant1_questionnaire?.analytics?.sus_score
    const variant2SUS = data.variant2_questionnaire?.analytics?.sus_score
    const variant1Trust = data.variant1_questionnaire?.analytics?.trust_analysis?.average_score
    const variant2Trust = data.variant2_questionnaire?.analytics?.trust_analysis?.average_score
    const overallPreference = data.comparison_questionnaire?.analytics?.preference_analysis?.overall_preference_direction
    
    const enhancedStudyData = {
      type: 'completed_study',
      participant_id: data.participant_id,
      randomization: data.randomization,
      timing: {
        start_time: data.start_time,
        end_time: data.end_time,
        total_duration_minutes: studyDurationMinutes
      },
      
      // Demographics
      demographics: data.demographics,
      
      // Questionnaire results
      questionnaire_results: {
        variant1: {
          variant: data.variant1_questionnaire?.variant,
          sus_score: variant1SUS,
          trust_average: variant1Trust,
          completion_time: data.variant1_questionnaire?.timing?.total_duration
        },
        variant2: {
          variant: data.variant2_questionnaire?.variant,
          sus_score: variant2SUS,
          trust_average: variant2Trust,
          completion_time: data.variant2_questionnaire?.timing?.total_duration
        },
        comparison: {
          overall_preference: overallPreference,
          completion_time: data.comparison_questionnaire?.timing?.total_duration
        }
      },
      
      // Quick analytics summary
      study_analytics: {
        participant_profile: {
          age_group: data.demographics.age,
          education_level: data.demographics.education,
          digital_experience: data.demographics.experience,
          tech_affinity: data.demographics.tech_affinity
        },
        performance_comparison: {
          sus_difference: variant1SUS && variant2SUS ? Math.round((variant2SUS - variant1SUS) * 100) / 100 : null,
          trust_difference: variant1Trust && variant2Trust ? Math.round((variant2Trust - variant1Trust) * 100) / 100 : null,
          preferred_variant: overallPreference,
          randomization_order: data.randomization
        },
        completion_quality: {
          total_duration_minutes: studyDurationMinutes,
          all_sections_completed: !!(data.variant1_questionnaire && data.variant2_questionnaire && data.comparison_questionnaire),
          study_flow: `Demographics → ${data.randomization} → Comparison`
        }
      },
      
      // Raw data (for detailed analysis)
      raw_questionnaire_data: {
        variant1: data.variant1_questionnaire,
        variant2: data.variant2_questionnaire,
        comparison: data.comparison_questionnaire
      },
      
      // Study metadata
      study_metadata: {
        ...data.study_metadata,
        completion_timestamp: new Date().toISOString(),
        data_version: 'enhanced_questionnaire_v1.0'
      }
    }

    // Log comprehensive study data (Vercel compatible)
    console.log('🎓 COMPLETED STUDY DATA:', JSON.stringify(enhancedStudyData, null, 2))
    
    // Create summary for quick analysis
    const studySummary = {
      participant: data.participant_id,
      duration_min: studyDurationMinutes,
      randomization: data.randomization,
      sus_scores: { [data.randomization.split('-')[0]]: variant1SUS, [data.randomization.split('-')[1]]: variant2SUS },
      trust_scores: { [data.randomization.split('-')[0]]: variant1Trust, [data.randomization.split('-')[1]]: variant2Trust },
      overall_preference: overallPreference,
      demographics: `${data.demographics.age}|${data.demographics.education}|${data.demographics.experience}|${data.demographics.tech_affinity}`
    }
    
    console.log('📊 STUDY SUMMARY:', studySummary)
    
    return NextResponse.json({
      success: true,
      participant_id: data.participant_id,
      study_summary: studySummary,
      analytics: enhancedStudyData.study_analytics,
      storage_location: 'vercel_logging',
      timestamp: new Date().toISOString(),
      message: 'Study completed and data saved successfully'
    })
    
  } catch (error) {
    console.error('❌ Study completion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to save completed study data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}