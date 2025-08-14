// lib/google-cloud-storage.ts
import { Storage } from '@google-cloud/storage'

class GoogleCloudStorageService {
  private storage: Storage | null = null
  private bucketName: string

  constructor() {
    this.bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'formulariq-study-data'
    
    try {
      // Initialize Google Cloud Storage
      this.storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // path to service account key
        // Alternative: use base64 encoded key
        credentials: process.env.GOOGLE_CLOUD_CREDENTIALS ? 
          JSON.parse(Buffer.from(process.env.GOOGLE_CLOUD_CREDENTIALS, 'base64').toString()) : 
          undefined
      })
    } catch (error) {
      console.error('❌ Google Cloud Storage initialization failed:', error)
      this.storage = null
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.storage) return false
    
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const [exists] = await bucket.exists()
      return exists
    } catch (error) {
      console.error('❌ Bucket access failed:', error)
      return false
    }
  }

  async saveStudyData(participantId: string, data: any): Promise<{
    success: boolean
    cloudUrl?: string
    fileName?: string
    error?: string
  }> {
    if (!this.storage) {
      return { success: false, error: 'Google Cloud Storage not initialized' }
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `complete_study_${participantId}_${timestamp}.json`
      
      // Enhanced data structure for analysis
      const enhancedData = {
        // === METADATA ===
        study_metadata: {
          project: 'FormularIQ - LLM-gestützte Formularbearbeitung',
          institution: 'HAW Hamburg', 
          researcher: 'Moritz Treu',
          data_version: '2.0.0',
          collection_timestamp: new Date().toISOString(),
          participant_id: participantId,
          storage_location: 'google_cloud_storage'
        },
        
        // === RAW DATA ===
        raw_data: {
          ...data,
          browser_info: {
            user_agent: data.metadata?.userAgent,
            screen_resolution: data.metadata?.screenResolution,
            language: data.metadata?.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        },
        
        // === ANALYSIS READY ===
        analysis_data: {
          // SUS Scores
          sus_scores: {
            variant_a: this.calculateSUSScore(data.variantAData?.susResults?.responses),
            variant_b: this.calculateSUSScore(data.variantBData?.susResults?.responses),
            difference: data.variantAData?.susResults && data.variantBData?.susResults ? 
              this.calculateSUSScore(data.variantBData.susResults.responses) - 
              this.calculateSUSScore(data.variantAData.susResults.responses) : null
          },
          
          // Trust Scores (average of 5 questions)
          trust_scores: {
            variant_a: this.calculateTrustScore(data.variantAData?.trustResults),
            variant_b: this.calculateTrustScore(data.variantBData?.trustResults)
          },
          
          // Completion Times
          completion_times: {
            variant_a_ms: data.variantAData?.completionTime,
            variant_b_ms: data.variantBData?.completionTime,
            variant_a_minutes: data.variantAData?.completionTime ? 
              Math.round(data.variantAData.completionTime / 60000 * 10) / 10 : null,
            variant_b_minutes: data.variantBData?.completionTime ? 
              Math.round(data.variantBData.completionTime / 60000 * 10) / 10 : null,
            total_study_minutes: data.timingData?.totalDuration ? 
              Math.round(data.timingData.totalDuration / 60000 * 10) / 10 : null
          },
          
          // Preferences (for easy aggregation)
          preferences: {
            overall: data.preferenceComparison?.overall_preference,
            speed: data.preferenceComparison?.speed_winner, 
            ease: data.preferenceComparison?.ease_winner,
            trust: data.preferenceComparison?.trust_winner,
            future_use: data.preferenceComparison?.future_use,
            nps_score: data.preferenceComparison?.recommendation_score
          },
          
          // Demographics (structured for analysis)
          demographics_structured: {
            age_group: data.demographics?.age,
            education_level: this.mapEducationLevel(data.demographics?.education),
            tech_experience_level: data.demographics?.tech_experience,
            form_usage_frequency: data.demographics?.form_frequency,
            preferred_device: data.demographics?.device_preference
          }
        }
      }

      const bucket = this.storage.bucket(this.bucketName)
      const file = bucket.file(`study_data/${fileName}`)
      
      await file.save(JSON.stringify(enhancedData, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            participant_id: participantId,
            study_date: new Date().toISOString().split('T')[0],
            data_type: 'complete_study_data'
          }
        }
      })

      const cloudUrl = `gs://${this.bucketName}/study_data/${fileName}`
      
      console.log('✅ Study data saved to Google Cloud:', {
        fileName,
        participantId,
        cloudUrl
      })

      return {
        success: true,
        cloudUrl,
        fileName
      }
      
    } catch (error) {
      console.error('❌ Google Cloud save failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  async saveFormData(participantId: string, variant: 'A' | 'B', data: any): Promise<{
    success: boolean
    cloudUrl?: string
    fileName?: string
    error?: string
  }> {
    if (!this.storage) {
      return { success: false, error: 'Google Cloud Storage not initialized' }
    }

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `form_${variant}_${participantId}_${timestamp}.json`
      
      const formData = {
        study_metadata: {
          project: 'FormularIQ - LLM-gestützte Formularbearbeitung',
          institution: 'HAW Hamburg',
          researcher: 'Moritz Treu',
          data_version: '2.0.0',
          collection_timestamp: new Date().toISOString(),
          participant_id: participantId,
          variant: variant,
          data_type: `variant_${variant}_form_data`
        },
        form_data: data
      }

      const bucket = this.storage.bucket(this.bucketName)
      const file = bucket.file(`form_data/${fileName}`)
      
      await file.save(JSON.stringify(formData, null, 2), {
        metadata: {
          contentType: 'application/json',
          metadata: {
            participant_id: participantId,
            variant: variant,
            study_date: new Date().toISOString().split('T')[0],
            data_type: 'form_data'
          }
        }
      })

      const cloudUrl = `gs://${this.bucketName}/form_data/${fileName}`
      
      console.log('✅ Form data saved to Google Cloud:', {
        fileName,
        participantId,
        variant,
        cloudUrl
      })

      return {
        success: true,
        cloudUrl,
        fileName
      }
      
    } catch (error) {
      console.error('❌ Google Cloud form save failed:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Helper methods for analysis data preparation
  private calculateSUSScore(responses: Record<string, number> | undefined): number | null {
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

  private calculateTrustScore(trustResults: any): number | null {
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

  private mapEducationLevel(education: string | undefined): string {
    if (!education) return 'unknown'
    
    const mapping: Record<string, string> = {
      'hauptschule': 'basic',
      'realschule': 'intermediate', 
      'abitur': 'high_school',
      'ausbildung': 'vocational',
      'bachelor': 'bachelor',
      'master': 'master',
      'promotion': 'phd'
    }
    
    return mapping[education] || education
  }

  async listStudyFiles(): Promise<string[]> {
    if (!this.storage) return []
    
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const [files] = await bucket.getFiles({ prefix: 'study_data/' })
      return files.map(file => file.name)
    } catch (error) {
      console.error('❌ Failed to list files:', error)
      return []
    }
  }

  async getStudyData(fileName: string): Promise<any | null> {
    if (!this.storage) return null
    
    try {
      const bucket = this.storage.bucket(this.bucketName)
      const file = bucket.file(fileName)
      const [contents] = await file.download()
      return JSON.parse(contents.toString())
    } catch (error) {
      console.error('❌ Failed to download file:', error)
      return null
    }
  }
}

// Singleton instance
export const googleCloudStorage = new GoogleCloudStorageService()

// Type definitions
export interface StudyDataSaveResult {
  success: boolean
  cloudUrl?: string
  fileName?: string
  localBackup?: string
  error?: string
}

export interface CloudStorageStatus {
  available: boolean
  bucketExists: boolean
  error?: string
}