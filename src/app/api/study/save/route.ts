// src/app/api/study/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { googleCloudStorage } from '@/lib/google-cloud-storage'
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

    let primarySaveResult: any = { success: false }
    let fallbackSaveResult: any = { success: false }

    // 1. Try Google Cloud Storage first
    try {
      console.log('☁️ Attempting Google Cloud Storage save...')
      const cloudAvailable = await googleCloudStorage.isAvailable()
      
      if (cloudAvailable) {
        primarySaveResult = await googleCloudStorage.saveStudyData(
          requestBody.participantId,
          requestBody
        )
        
        if (primarySaveResult.success) {
          console.log('✅ Google Cloud Storage save successful:', {
            fileName: primarySaveResult.fileName,
            cloudUrl: primarySaveResult.cloudUrl
          })
        }
      } else {
        console.warn('⚠️ Google Cloud Storage not available')
        primarySaveResult = { 
          success: false, 
          error: 'Google Cloud Storage not available' 
        }
      }
    } catch (cloudError) {
      console.error('❌ Google Cloud Storage save failed:', cloudError)
      primarySaveResult = { 
        success: false, 
        error: cloudError instanceof Error ? cloudError.message : 'Cloud save failed' 
      }
    }

    // 2. Local backup (always attempt)
    try {
      console.log('💾 Creating local backup...')
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `study_${requestBody.participantId}_${timestamp}.json`
      
      // Enhanced data for local backup
      const backupData = {
        study_info: {
          project: "FormularIQ - LLM-gestützte Formularbearbeitung",
          institution: "HAW Hamburg",
          researcher: "Moritz Treu",
          version: "2.0.0",
          collection_date: new Date().toISOString(),
          participant_id: requestBody.participantId,
          storage_type: primarySaveResult.success ? 'cloud_and_local' : 'local_only'
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
          cloud_save_success: primarySaveResult.success,
          cloud_file_name: primarySaveResult.fileName,
          user_agent: requestBody.metadata?.userAgent || 'unknown',
          screen_resolution: requestBody.metadata?.screenResolution || 'unknown'
        }
      }
      
      // Ensure output directory exists
      const outputDir = path.join(process.cwd(), 'study_output')
      try {
        await fs.mkdir(outputDir, { recursive: true })
      } catch (mkdirError) {
        console.log('📁 Output directory already exists or created')
      }
      
      const localPath = path.join(outputDir, fileName)
      await fs.writeFile(localPath, JSON.stringify(backupData, null, 2), 'utf-8')
      
      fallbackSaveResult = {
        success: true,
        localPath: localPath,
        fileName: fileName
      }
      
      console.log('✅ Local backup successful:', localPath)
      
    } catch (localError) {
      console.error('❌ Local backup failed:', localError)
      fallbackSaveResult = { 
        success: false, 
        error: localError instanceof Error ? localError.message : 'Local save failed' 
      }
    }

    // 3. Determine response based on save results
    const response = {
      participant_id: requestBody.participantId,
      timestamp: new Date().toISOString(),
      
      // Primary storage result
      cloud_storage: {
        success: primarySaveResult.success,
        file_name: primarySaveResult.fileName,
        cloud_url: primarySaveResult.cloudUrl,
        error: primarySaveResult.error
      },
      
      // Backup storage result  
      local_backup: {
        success: fallbackSaveResult.success,
        file_name: fallbackSaveResult.fileName,
        local_path: fallbackSaveResult.localPath,
        error: fallbackSaveResult.error
      },
      
      // Overall status
      overall_status: {
        data_saved: primarySaveResult.success || fallbackSaveResult.success,
        primary_method: primarySaveResult.success ? 'cloud' : 'local',
        message: primarySaveResult.success 
          ? 'Daten erfolgreich in der Cloud gespeichert!' 
          : fallbackSaveResult.success 
          ? 'Daten lokal gespeichert (Cloud nicht verfügbar)' 
          : 'Speicherung fehlgeschlagen!'
      }
    }

    const statusCode = (primarySaveResult.success || fallbackSaveResult.success) ? 200 : 500

    console.log('📤 API Response:', {
      status: statusCode,
      cloudSuccess: primarySaveResult.success,
      localSuccess: fallbackSaveResult.success
    })

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
    const cloudAvailable = await googleCloudStorage.isAvailable()
    
    return NextResponse.json({
      status: 'healthy',
      storage_services: {
        google_cloud_storage: cloudAvailable ? 'available' : 'unavailable',
        local_backup: 'available'
      },
      timestamp: new Date().toISOString(),
      version: '2.0.0'
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Health check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

---

// src/app/api/save/route.ts (for Variant A form data)
import { NextRequest, NextResponse } from 'next/server'
import { googleCloudStorage } from '@/lib/google-cloud-storage'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('📝 API: Saving Variant A form data...')
    
    const data = await request.json()
    
    const enhancedData = {
      variant: 'A_sichtbares_formular',
      ...data,
      timestamp: new Date().toISOString(),
      study_metadata: {
        project: 'FormularIQ - LLM-gestützte Formularbearbeitung',
        institution: 'HAW Hamburg',
        researcher: 'Moritz Treu',
        version: '2.0.0'
      }
    }

    // Try cloud save first
    let cloudResult = { success: false }
    try {
      const participantId = data.participantId || 'unknown'
      cloudResult = await googleCloudStorage.saveFormData(participantId, 'A', enhancedData)
    } catch (error) {
      console.warn('⚠️ Cloud save failed for Variant A:', error)
    }

    // Local backup
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `variant_A_${data.participantId || 'unknown'}_${timestamp}.json`
      const outputDir = path.join(process.cwd(), 'study_output')
      
      await fs.mkdir(outputDir, { recursive: true })
      await fs.writeFile(
        path.join(outputDir, fileName), 
        JSON.stringify(enhancedData, null, 2), 
        'utf-8'
      )
      
      console.log('✅ Variant A local backup successful')
    } catch (localError) {
      console.warn('⚠️ Local backup failed for Variant A:', localError)
    }
    
    return NextResponse.json({
      success: true,
      variant: 'A',
      storage_location: cloudResult.success ? 'cloud_and_local' : 'local_only',
      cloud_url: cloudResult.cloudUrl,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Variant A save error:', error)
    return NextResponse.json(
      { error: 'Failed to save Variant A data' },
      { status: 500 }
    )
  }
}

---

// src/app/api/dialog/save/route.ts (for Variant B dialog data)
import { NextRequest, NextResponse } from 'next/server'
import { googleCloudStorage } from '@/lib/google-cloud-storage'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('💬 API: Saving Variant B dialog data...')
    
    const data = await request.json()
    
    const enhancedData = {
      variant: 'B_dialog_system',
      ...data,
      timestamp: new Date().toISOString(),
      study_metadata: {
        project: 'FormularIQ - LLM-gestützte Formularbearbeitung',
        institution: 'HAW Hamburg',
        researcher: 'Moritz Treu',
        version: '2.0.0'
      }
    }

    // Try cloud save first
    let cloudResult = { success: false }
    try {
      const participantId = data.participantId || 'unknown'
      cloudResult = await googleCloudStorage.saveFormData(participantId, 'B', enhancedData)
    } catch (error) {
      console.warn('⚠️ Cloud save failed for Variant B:', error)
    }

    // Local backup
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `variant_B_${data.participantId || 'unknown'}_${timestamp}.json`
      const outputDir = path.join(process.cwd(), 'study_output')
      
      await fs.mkdir(outputDir, { recursive: true })
      await fs.writeFile(
        path.join(outputDir, fileName), 
        JSON.stringify(enhancedData, null, 2), 
        'utf-8'
      )
      
      console.log('✅ Variant B local backup successful')
    } catch (localError) {
      console.warn('⚠️ Local backup failed for Variant B:', localError)
    }
    
    return NextResponse.json({
      success: true,
      variant: 'B',
      storage_location: cloudResult.success ? 'cloud_and_local' : 'local_only',
      cloud_url: cloudResult.cloudUrl,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Variant B save error:', error)
    return NextResponse.json(
      { error: 'Failed to save Variant B data' },
      { status: 500 }
    )
  }
}

---

// src/app/api/storage/status/route.ts (for monitoring storage health)
import { NextRequest, NextResponse } from 'next/server'
import { googleCloudStorage } from '@/lib/google-cloud-storage'

export async function GET() {
  try {
    const cloudAvailable = await googleCloudStorage.isAvailable()
    const files = await googleCloudStorage.listStudyFiles()
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      storage_status: {
        google_cloud: {
          available: cloudAvailable,
          bucket_name: process.env.GOOGLE_CLOUD_BUCKET_NAME || 'not_configured',
          project_id: process.env.GOOGLE_CLOUD_PROJECT_ID || 'not_configured',
          file_count: files.length
        },
        local_backup: {
          available: true,
          location: './study_output/'
        }
      },
      configuration: {
        has_credentials: !!process.env.GOOGLE_CLOUD_CREDENTIALS || !!process.env.GOOGLE_CLOUD_KEY_FILE,
        has_project_id: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
        has_bucket_name: !!process.env.GOOGLE_CLOUD_BUCKET_NAME
      }
    })
    
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Storage status check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}