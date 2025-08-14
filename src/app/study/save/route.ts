// src/app/api/study/save/route.ts - SCHNELLE FIX VERSION
// Ersetzt die aktuelle Datei temporär, bis Google Cloud Setup gemacht ist

import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 API: Saving complete study data...')
    
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

    // Local backup (Vercel-kompatibel)
    let localSaveResult = { success: false, fileName: '', error: '' }
    
    try {
      console.log('💾 Creating local backup...')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `study_${requestBody.participantId}_${timestamp}.json`
      
      // Enhanced data for analysis
      const backupData = {
        study_info: {
          project: "FormularIQ - LLM-gestützte Formularbearbeitung",
          institution: "HAW Hamburg",
          researcher: "Moritz Treu",
          version: "2.0.0",
          collection_date: new Date().toISOString(),
          participant_id: requestBody.participantId,
          storage_type: 'local_vercel'
        },
        
        // All the raw data
        raw_study_data: requestBody,
        
        // Pre-calculated analysis data for easy processing
        quick_analysis: {
          completion_summary: {
            demographics_completed: !!requestBody.demographics,
            variant_a_completed: !!requestBody.variantAData?.susResults,
            variant_b_completed: !!requestBody.variantBData?.susResults,
            comparison_completed: !!requestBody.preferenceComparison,
            total_duration_minutes: requestBody.timingData?.totalDuration ? 
              Math.round(requestBody.timingData.totalDuration / 60000 * 10) / 10 : null
          },
          
          // SUS Scores berechnen
          sus_scores: {
            variant_a: calculateSUSScore(requestBody.variantAData?.susResults?.responses),
            variant_b: calculateSUSScore(requestBody.variantBData?.susResults?.responses)
          },
          
          // Trust Scores berechnen
          trust_scores: {
            variant_a: calculateTrustScore(requestBody.variantAData?.trustResults),
            variant_b: calculateTrustScore(requestBody.variantBData?.trustResults)
          },
          
          preferences: {
            overall_winner: requestBody.preferenceComparison?.overall_preference,
            speed_winner: requestBody.preferenceComparison?.speed_winner,
            ease_winner: requestBody.preferenceComparison?.ease_winner,
            trust_winner: requestBody.preferenceComparison?.trust_winner,
            nps_score: requestBody.preferenceComparison?.recommendation_score
          }
        },
        
        // Metadata
        collection_metadata: {
          timestamp: new Date().toISOString(),
          user_agent: requestBody.metadata?.userAgent || 'unknown',
          screen_resolution: requestBody.metadata?.screenResolution || 'unknown',
          deployment_platform: 'vercel'
        }
      }
      
      // In Vercel, we can't write to local filesystem in production
      // So we'll log the data and provide it as download
      console.log('📊 STUDY DATA COLLECTED:', JSON.stringify(backupData, null, 2))
      
      localSaveResult = {
        success: true,
        fileName: fileName,
        error: ''
      }
      
      console.log('✅ Study data processed successfully')
      
    } catch (localError) {
      console.error('❌ Local processing failed:', localError)
      localSaveResult = { 
        success: false, 
        fileName: '',
        error: localError instanceof Error ? localError.message : 'Local processing failed' 
      }
    }

    // Response
    const response = {
      participant_id: requestBody.participantId,
      timestamp: new Date().toISOString(),
      
      // Storage result  
      storage_result: {
        success: localSaveResult.success,
        file_name: localSaveResult.fileName,
        storage_method: 'vercel_logging',
        error: localSaveResult.error
      },
      
      // Overall status
      overall_status: {
        data_saved: localSaveResult.success,
        message: localSaveResult.success 
          ? 'Studiendaten erfolgreich verarbeitet!' 
          : 'Datenverarbeitung fehlgeschlagen!',
        next_steps: localSaveResult.success 
          ? 'Daten wurden in Vercel Logs gespeichert. Für Production Setup Google Cloud Storage konfigurieren.'
          : 'Bitte Fehler prüfen und erneut versuchen.'
      }
    }

    const statusCode = localSaveResult.success ? 200 : 500

    console.log('📤 API Response Status:', statusCode)

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
  return NextResponse.json({
    status: 'healthy',
    storage_services: {
      vercel_logging: 'available',
      google_cloud_storage: 'not_configured',
      local_backup: 'not_available_in_production'
    },
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    platform: 'vercel'
  })
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
  return totalScore * 2.5
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