// src/app/api/debug/gcs/route.ts
// Debug-Endpoint um Google Cloud Storage Verbindung zu testen

import { NextRequest, NextResponse } from 'next/server'
import { Storage } from '@google-cloud/storage'

export async function GET() {
  console.log('🔍 DEBUG: Testing Google Cloud Storage connection...')
  
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment_variables: {
      project_id: !!process.env.GOOGLE_CLOUD_PROJECT_ID,
      bucket_name: !!process.env.GOOGLE_CLOUD_BUCKET_NAME,
      credentials: !!process.env.GOOGLE_CLOUD_CREDENTIALS,
      project_id_value: process.env.GOOGLE_CLOUD_PROJECT_ID,
      bucket_name_value: process.env.GOOGLE_CLOUD_BUCKET_NAME
    },
    tests: []
  }

  try {
    // Test 1: Credentials parsing
    let credentialsObject
    try {
      const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
      if (!credentials) {
        debugInfo.tests.push({
          test: 'credentials_exist',
          status: 'FAIL',
          error: 'GOOGLE_CLOUD_CREDENTIALS environment variable not set'
        })
        return NextResponse.json(debugInfo)
      }

      // Try Base64 decode first
      try {
        credentialsObject = JSON.parse(Buffer.from(credentials, 'base64').toString())
        debugInfo.tests.push({
          test: 'credentials_base64_decode',
          status: 'SUCCESS',
          details: 'Successfully decoded Base64 credentials'
        })
      } catch {
        // Fallback: direct JSON
        credentialsObject = JSON.parse(credentials)
        debugInfo.tests.push({
          test: 'credentials_direct_parse',
          status: 'SUCCESS',
          details: 'Successfully parsed direct JSON credentials'
        })
      }

      debugInfo.tests.push({
        test: 'credentials_structure',
        status: 'SUCCESS',
        details: {
          has_project_id: !!credentialsObject.project_id,
          has_private_key: !!credentialsObject.private_key,
          has_client_email: !!credentialsObject.client_email,
          project_id: credentialsObject.project_id,
          client_email: credentialsObject.client_email
        }
      })

    } catch (error) {
      debugInfo.tests.push({
        test: 'credentials_parsing',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return NextResponse.json(debugInfo)
    }

    // Test 2: Storage client creation
    let storage
    try {
      storage = new Storage({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        credentials: credentialsObject,
      })
      
      debugInfo.tests.push({
        test: 'storage_client_creation',
        status: 'SUCCESS',
        details: 'Storage client created successfully'
      })
    } catch (error) {
      debugInfo.tests.push({
        test: 'storage_client_creation',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      return NextResponse.json(debugInfo)
    }

    // Test 3: Bucket existence check
    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME!
    try {
      const bucket = storage.bucket(bucketName)
      const [exists] = await bucket.exists()
      
      debugInfo.tests.push({
        test: 'bucket_exists',
        status: exists ? 'SUCCESS' : 'FAIL',
        details: {
          bucket_name: bucketName,
          exists: exists,
          message: exists ? 'Bucket exists and is accessible' : 'Bucket does not exist or is not accessible'
        }
      })

      if (!exists) {
        debugInfo.tests.push({
          test: 'bucket_creation_needed',
          status: 'INFO',
          details: 'Bucket needs to be created in Google Cloud Console'
        })
      }

    } catch (error) {
      debugInfo.tests.push({
        test: 'bucket_access',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Could not access bucket - check permissions'
      })
    }

    // Test 4: Permission test (if bucket exists)
    try {
      const bucket = storage.bucket(bucketName)
      const [exists] = await bucket.exists()
      
      if (exists) {
        // Try to list files (minimal permission test)
        const [files] = await bucket.getFiles({ maxResults: 1 })
        
        debugInfo.tests.push({
          test: 'bucket_permissions',
          status: 'SUCCESS',
          details: {
            can_list_files: true,
            file_count_sample: files.length
          }
        })

        // Try to create a test file
        try {
          const testFile = bucket.file('test-connection.txt')
          await testFile.save('test', {
            metadata: {
              contentType: 'text/plain'
            }
          })
          
          // Delete test file immediately
          await testFile.delete()
          
          debugInfo.tests.push({
            test: 'bucket_write_permissions',
            status: 'SUCCESS',
            details: 'Can create and delete files in bucket'
          })
          
        } catch (error) {
          debugInfo.tests.push({
            test: 'bucket_write_permissions',
            status: 'FAIL',
            error: error instanceof Error ? error.message : 'Unknown error',
            details: 'Cannot write to bucket - check service account permissions'
          })
        }
      }

    } catch (error) {
      debugInfo.tests.push({
        test: 'bucket_permissions',
        status: 'FAIL',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    debugInfo.tests.push({
      test: 'general_error',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
    
    return NextResponse.json(debugInfo, { status: 500 })
  }
}

// POST endpoint to test actual save operation
export async function POST() {
  try {
    const testData = {
      test: true,
      timestamp: new Date().toISOString(),
      sample_study_data: {
        participant_id: 'test-participant',
        variant_a: { completed: true },
        variant_b: { completed: true }
      }
    }

    // Try to save test data
    const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
    if (!credentials) {
      return NextResponse.json({ error: 'No credentials' }, { status: 400 })
    }

    let credentialsObject
    try {
      credentialsObject = JSON.parse(Buffer.from(credentials, 'base64').toString())
    } catch {
      credentialsObject = JSON.parse(credentials)
    }

    const storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      credentials: credentialsObject,
    })

    const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME!
    const bucket = storage.bucket(bucketName)
    const fileName = `test-save-${Date.now()}.json`
    const file = bucket.file(`formulariq-study-data/${fileName}`)

    await file.save(JSON.stringify(testData, null, 2), {
      metadata: {
        contentType: 'application/json',
        metadata: {
          test: 'true',
          created: new Date().toISOString()
        }
      }
    })

    // Clean up test file
    await file.delete()

    return NextResponse.json({
      success: true,
      message: 'Test save operation successful',
      file_name: fileName,
      bucket: bucketName
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: 'Test save operation failed'
    }, { status: 500 })
  }
}