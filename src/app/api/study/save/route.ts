// src/app/api/study/save/route.ts
// Finale Version mit funktionierender Google Cloud Storage Integration

import { NextRequest, NextResponse } from 'next/server'
import { saveStudyDataToCloud, checkStorageStatus } from '@/lib/google-cloud-storage'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 API: Saving complete study data with GCS support...')
    
    const requestBody = await request.json()
    
    // Validate required fields
    if (!requestBody.participantId) {
      return NextResponse.json(
        { error: 'Participant ID is required' },
        { status: 400 }
      )
    }

    console.log('📋 Study data overview:', {
      participantId: requestBody.participantId,
      hasVariantA: !!requestBody.variantAData,
      hasVariantB: !!requestBody.variantBData,
      hasDemographics: !!requestBody.demographics,
      hasComparison: !!requestBody.preferenceComparison,
      totalDuration: requestBody.timingData?.totalDuration
    })

    // Enhanced data processing mit Analytics
    const enrichedData = {
      ...requestBody,
      
      // Pre-calculated analytics für schnelle Auswertung
      analytics: {
        completion_metrics: {
          demographics_completed: !!requestBody.demographics,
          variant_a_completed: !!requestBody.variantAData?.susResults,
          variant_b_completed: !!requestBody.variantBData?.susResults,
          comparison_completed: !!requestBody.preferenceComparison,
          total_duration_minutes: requestBody.timingData?.totalDuration ? 
            Math.round(requestBody.timingData.totalDuration / 60) : null
        },
        
        // SUS Scores berechnen
        sus_scores: {
          variant_a: calculateSUSScore(requestBody.variantAData?.susResults),
          variant_b: calculateSUSScore(requestBody.variantBData?.susResults)
        },
        
        // Trust Scores berechnen
        trust_scores: {
          variant_a: calculateTrustScore(requestBody.variantAData?.trustResults),
          variant_b: calculateTrustScore(requestBody.variantBData?.trustResults)
        },
        
        // Preference Analysis
        preference_analysis: requestBody.preferenceComparison ? {
          overall_preference: analyzePreference(requestBody.preferenceComparison),
          speed_preference: requestBody.preferenceComparison.speed,
          ease_preference: requestBody.preferenceComparison.ease_of_use,
          control_preference: requestBody.preferenceComparison.user_control
        } : null
      }
    }

    // Neue Cloud Storage Methode verwenden
    const storageResult = await saveStudyDataToCloud(enrichedData, requestBody.participantId)

    // Response basierend auf Speicherergebnis
    const response = {
      success: storageResult.success,
      participant_id: requestBody.participantId,
      storage: {
        method: storageResult.method,
        file_name: storageResult.fileName,
        file_id: storageResult.fileId,
        status: storageResult.success ? 'saved' : 'failed'
      },
      message: storageResult.success 
        ? `Studiendaten erfolgreich in ${storageResult.method === 'google_cloud' ? 'Google Cloud Storage' : 'Vercel Logs'} gespeichert!`
        : 'Datenverarbeitung fehlgeschlagen!',
      next_steps: storageResult.success 
        ? storageResult.method === 'google_cloud' 
          ? 'Daten wurden sicher in Google Cloud Storage gespeichert und sind für Analyse verfügbar.'
          : 'Daten wurden in Vercel Logs gespeichert. Für optimale Analyse bitte Google Cloud Storage konfigurieren.'
        : 'Bitte Fehler prüfen und erneut versuchen.',
      analytics_preview: enrichedData.analytics
    }

    const statusCode = storageResult.success ? 200 : 500

    console.log('📤 API Response Status:', statusCode, '| Storage:', storageResult.method)

    return NextResponse.json(response, { status: statusCode })
    
  } catch (error) {
    console.error('💥 API Error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// GET endpoint for checking storage status
export async function GET() {
  try {
    const storageStatus = await checkStorageStatus()
    
    return NextResponse.json({
      status: 'healthy',
      storage_services: storageStatus,
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      platform: 'vercel',
      features: {
        google_cloud_storage: storageStatus.google_cloud_storage === 'configured',
        vercel_logging_fallback: true,
        analytics_preprocessing: true,
        gdpr_compliant: true
      }
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json({
      status: 'partial',
      storage_services: { vercel_logging: 'available', google_cloud_storage: 'error' },
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Helper functions
function calculateSUSScore(responses: Record<string, number> | undefined): number | null {
  if (!responses) return null
  
  let totalScore = 0
  const questions = [
    { id: 'sus_1', reverse: false },
    { id: 'sus_2', reverse: true },
    { id: 'sus_3', reverse: false },
    { id: 'sus_4', reverse: true },
    { id: 'sus_5', reverse: false },
    { id: 'sus_6', reverse: true },
    { id: 'sus_7', reverse: false },
    { id: 'sus_8', reverse: true },
    { id: 'sus_9', reverse: false },
    { id: 'sus_10', reverse: true }
  ]

  let answeredQuestions = 0
  questions.forEach(question => {
    const response = responses[question.id]
    if (response !== undefined) {
      answeredQuestions++
      if (question.reverse) {
        totalScore += (5 - response)
      } else {
        totalScore += (response - 1)
      }
    }
  })

  if (answeredQuestions < questions.length) return null
  return Math.round(totalScore * 2.5 * 10) / 10 // Runde auf 1 Dezimalstelle
}

function calculateTrustScore(trustResults: any): number | null {
  if (!trustResults) return null
  
  const scores = [
    trustResults.system_reliability,
    trustResults.data_security,
    trustResults.error_handling,
    trustResults.transparency,
    trustResults.user_control
  ].filter(score => score && score > 0)
  
  if (scores.length === 0) return null
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
}

function analyzePreference(comparison: any): string {
  if (!comparison) return 'unknown'
  
  // Analysiere basierend auf speed, ease_of_use, user_control
  const aPreferences = (['A', 'variant_a'].includes(comparison.speed) ? 1 : 0) +
                       (['A', 'variant_a'].includes(comparison.ease_of_use) ? 1 : 0) +
                       (['A', 'variant_a'].includes(comparison.user_control) ? 1 : 0)
  
  const bPreferences = (['B', 'variant_b'].includes(comparison.speed) ? 1 : 0) +
                       (['B', 'variant_b'].includes(comparison.ease_of_use) ? 1 : 0) +
                       (['B', 'variant_b'].includes(comparison.user_control) ? 1 : 0)
  
  if (aPreferences > bPreferences) return 'variant_a_preferred'
  if (bPreferences > aPreferences) return 'variant_b_preferred'
  return 'no_clear_preference'
}