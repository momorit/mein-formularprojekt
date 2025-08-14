// src/app/api/study/save/route.ts
// Inline Google Cloud Storage Integration (garantiert funktionsfähig)

import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export async function POST(request: NextRequest) {
  try {
    console.log('📊 API: Saving complete study data with INLINE GCS support...')
    
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

    // INLINE Google Cloud Storage Integration
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `study_${requestBody.participantId}_${timestamp}.json`
    
    let storageResult: {
      success: boolean
      method: 'vercel_logs' | 'google_cloud'
      fileName: string
      fileId?: string
      error?: string
    } = { success: false, method: 'vercel_logs', fileName, error: '' }
    
    // Versuche Google Cloud Storage
    try {
      console.log('☁️ Versuche Google Cloud Storage...')
      
      // Credentials laden und parsen
      const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
      const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
      const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

      if (credentials && projectId && bucketName) {
        let credentialsObject
        try {
          credentialsObject = JSON.parse(Buffer.from(credentials, 'base64').toString())
        } catch {
          credentialsObject = JSON.parse(credentials)
        }

        // Storage Client erstellen
        const storage = new Storage({
          projectId,
          credentials: credentialsObject,
        })

        const bucket = storage.bucket(bucketName)
        const file = bucket.file(`formulariq-study-data/${fileName}`)

        // Enhanced Studiendaten für Cloud Storage
        const cloudData = {
          study_metadata: {
            project: "FormularIQ - LLM-gestützte Formularbearbeitung",
            institution: "HAW Hamburg",
            researcher: "Moritz Treu",
            version: "2.0.0",
            upload_timestamp: new Date().toISOString(),
            file_name: fileName,
            storage_location: "google_cloud_storage"
          },
          data_protection: {
            anonymized: true,
            gdpr_compliant: true,
            retention_period: "research_duration_only"
          },
          raw_study_data: enrichedData,
          analysis_ready: {
            participant_id: enrichedData.participantId,
            completion_status: {
              demographics: !!enrichedData.demographics,
              variant_a: !!enrichedData.variantAData?.susResults,
              variant_b: !!enrichedData.variantBData?.susResults,
              comparison: !!enrichedData.preferenceComparison
            }
          }
        }

        // Upload zu Google Cloud Storage
        await file.save(JSON.stringify(cloudData, null, 2), {
          metadata: {
            contentType: 'application/json',
            metadata: {
              project: 'FormularIQ',
              institution: 'HAW-Hamburg',
              dataType: 'study-response',
              participantId: enrichedData.participantId
            }
          }
        })

        console.log('✅ Google Cloud Storage erfolgreich:', fileName)
        storageResult = {
          success: true,
          method: 'google_cloud',
          fileName: fileName,
          fileId: `gs://${bucketName}/formulariq-study-data/${fileName}`
        }

      } else {
        console.log('⚠️ Google Cloud Umgebungsvariablen nicht vollständig')
        throw new Error('Umgebungsvariablen fehlen')
      }

    } catch (gcsError) {
      console.error('❌ Google Cloud Storage Fehler:', gcsError)
      
      // Fallback: Vercel Logs
      console.log('📝 Fallback: Speichere in Vercel Logs...')
      
      const logData = {
        timestamp: new Date().toISOString(),
        type: 'formulariq_study_data',
        participant_id: requestBody.participantId,
        file_name: fileName,
        data_size_kb: Math.round(JSON.stringify(enrichedData).length / 1024),
        study_metadata: {
          project: "FormularIQ - LLM-gestützte Formularbearbeitung",
          institution: "HAW Hamburg", 
          version: "2.0.0",
          storage_method: "vercel_logs_fallback"
        },
        study_data: enrichedData
      }

      // Strukturiertes Logging für Export
      console.log('🗃️ STUDY_DATA_EXPORT:', JSON.stringify(logData))

      storageResult = {
        success: true,
        method: 'vercel_logs',
        fileName: fileName,
        error: gcsError instanceof Error ? gcsError.message : 'Unknown error'
      }
    }

    // Response basierend auf Speicherergebnis
    const response = {
      success: storageResult.success,
      participant_id: requestBody.participantId,
      storage: {
        method: storageResult.method,
        file_name: storageResult.fileName,
        file_id: storageResult.fileId,
        status: storageResult.success ? 'saved' : 'failed',
        error: storageResult.error
      },
      message: storageResult.success 
        ? `Studiendaten erfolgreich in ${storageResult.method === 'google_cloud' ? 'Google Cloud Storage' : 'Vercel Logs'} gespeichert!`
        : 'Datenverarbeitung fehlgeschlagen!',
      next_steps: storageResult.success 
        ? storageResult.method === 'google_cloud' 
          ? 'Daten wurden sicher in Google Cloud Storage gespeichert und sind für Analyse verfügbar.'
          : 'Daten wurden in Vercel Logs gespeichert. Google Cloud Storage hatte einen Fehler.'
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
    // Inline storage status check
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
    const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME
    
    const gcsConfigured = !!(credentials && projectId && bucketName)
    
    return NextResponse.json({
      status: 'healthy',
      storage_services: {
        google_cloud_storage: gcsConfigured ? 'configured' : 'not_configured',
        vercel_logging: 'available',
        environment_variables: {
          GOOGLE_CLOUD_CREDENTIALS: !!credentials,
          GOOGLE_CLOUD_PROJECT_ID: !!projectId,
          GOOGLE_CLOUD_BUCKET_NAME: !!bucketName,
        }
      },
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      platform: 'vercel',
      features: {
        google_cloud_storage: gcsConfigured,
        vercel_logging_fallback: true,
        analytics_preprocessing: true,
        gdpr_compliant: true,
        inline_integration: true
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
  return Math.round(totalScore * 2.5 * 10) / 10
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