// src/lib/google-cloud-storage.ts
// Google Cloud Storage Integration für FormularIQ Studiendaten
// Sichere Implementierung mit Fallback für Vercel Production

import { Storage } from '@google-cloud/storage'

export interface StorageResult {
  success: boolean
  method: 'google_cloud' | 'vercel_logs'
  fileId?: string
  fileName?: string
  error?: string
}

// Google Cloud Storage-Konfiguration
function createGCSClient() {
  // Credentials aus Umgebungsvariablen laden
  const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME

  if (!credentials || !projectId || !bucketName) {
    console.log('🔧 Google Cloud Storage nicht vollständig konfiguriert')
    return null
  }

  try {
    // JSON-Credentials aus Base64 oder direktem JSON parsen
    let credentialsObject
    try {
      // Versuche Base64-dekodierte Credentials
      credentialsObject = JSON.parse(Buffer.from(credentials, 'base64').toString())
    } catch {
      // Fallback: direkte JSON-String
      credentialsObject = JSON.parse(credentials)
    }

    const storage = new Storage({
      projectId,
      credentials: credentialsObject,
    })

    return { storage, bucketName }
  } catch (error) {
    console.error('❌ Google Cloud Storage Client Error:', error)
    return null
  }
}

// Hauptfunktion: Studiendaten speichern
export async function saveStudyDataToCloud(
  data: any,
  participantId: string
): Promise<StorageResult> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const fileName = `study_${participantId}_${timestamp}.json`

  // Versuche zuerst Google Cloud Storage
  const gcsResult = await tryGoogleCloudStorage(data, fileName)
  if (gcsResult.success) {
    return gcsResult
  }

  // Fallback: Vercel Logs (bisherige Methode)
  console.log('📝 Fallback: Speichere in Vercel Logs...')
  
  // Enhanced logging für bessere Auswertung
  const logData = {
    timestamp: new Date().toISOString(),
    type: 'formulariq_study_data',
    participant_id: participantId,
    file_name: fileName,
    data_size_kb: Math.round(JSON.stringify(data).length / 1024),
    study_metadata: {
      project: "FormularIQ - LLM-gestützte Formularbearbeitung",
      institution: "HAW Hamburg", 
      version: "2.0.0",
      storage_method: "vercel_logs_fallback"
    },
    study_data: data
  }

  // Strukturiertes Logging für Export
  console.log('🗃️ STUDY_DATA_EXPORT:', JSON.stringify(logData))

  return {
    success: true,
    method: 'vercel_logs',
    fileName: fileName
  }
}

// Google Cloud Storage-Versuch
async function tryGoogleCloudStorage(
  data: any, 
  fileName: string
): Promise<StorageResult> {
  try {
    const gcsConfig = createGCSClient()
    if (!gcsConfig) {
      return { success: false, method: 'google_cloud', error: 'Konfiguration fehlt' }
    }

    const { storage, bucketName } = gcsConfig
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
      raw_study_data: data,
      analysis_ready: {
        participant_id: data.participantId,
        completion_status: {
          demographics: !!data.demographics,
          variant_a: !!data.variantAData?.susResults,
          variant_b: !!data.variantBData?.susResults,
          comparison: !!data.preferenceComparison
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
          participantId: data.participantId
        }
      }
    })

    console.log('☁️ Erfolgreich in Google Cloud Storage gespeichert:', fileName)
    
    return {
      success: true,
      method: 'google_cloud',
      fileName: fileName,
      fileId: `gs://${bucketName}/formulariq-study-data/${fileName}`
    }

  } catch (error) {
    console.error('❌ Google Cloud Storage Fehler:', error)
    return { 
      success: false, 
      method: 'google_cloud', 
      error: error instanceof Error ? error.message : 'Unbekannter Fehler' 
    }
  }
}

// Storage-Status prüfen
export async function checkStorageStatus() {
  const gcsConfig = createGCSClient()
  
  return {
    google_cloud_storage: gcsConfig ? 'configured' : 'not_configured',
    vercel_logging: 'available',
    environment_variables: {
      GOOGLE_CLOUD_CREDENTIALS: !!process.env.GOOGLE_CLOUD_CREDENTIALS,
      GOOGLE_CLOUD_PROJECT_ID: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      GOOGLE_CLOUD_BUCKET_NAME: !!process.env.GOOGLE_CLOUD_BUCKET_NAME,
    }
  }
}

// Export für Tests und Debugging
export async function testGoogleCloudConnection() {
  try {
    const gcsConfig = createGCSClient()
    if (!gcsConfig) {
      return { success: false, error: 'Konfiguration fehlt' }
    }

    const { storage, bucketName } = gcsConfig
    const bucket = storage.bucket(bucketName)
    
    // Test-Zugriff auf Bucket
    const [exists] = await bucket.exists()
    if (!exists) {
      return { success: false, error: `Bucket ${bucketName} existiert nicht` }
    }

    return { success: true, bucket: bucketName }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Verbindungsfehler' 
    }
  }
}