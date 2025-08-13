// app/api/error/report/route.ts
// Error Reporting API für besseres Debugging

import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'https://mein-formularprojekt-production.up.railway.app'

export async function POST(request: NextRequest) {
  try {
    console.log('🚨 API: Receiving error report...')
    
    const errorData = await request.json()
    
    // Enhanced error data with server info
    const enhancedErrorData = {
      ...errorData,
      server_info: {
        timestamp: new Date().toISOString(),
        server_id: process.env.VERCEL_REGION || 'unknown',
        deployment_id: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
        environment: process.env.NODE_ENV || 'unknown',
        user_ip: request.headers.get('x-forwarded-for') || 
                 request.headers.get('x-real-ip') || 
                 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        referer: request.headers.get('referer') || 'unknown'
      }
    }

    console.log('📊 Error Report Details:', {
      errorId: errorData.errorId,
      participantId: errorData.participantId,
      errorMessage: errorData.error?.message,
      timestamp: errorData.timestamp
    })

    // Try to save to backend
    try {
      const backendResponse = await fetch(`${BACKEND_URL}/api/error/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(enhancedErrorData),
      })
      
      if (backendResponse.ok) {
        console.log('✅ Error reported to backend successfully')
        return NextResponse.json({
          success: true,
          message: 'Error report saved to backend',
          errorId: errorData.errorId,
          saved_to: 'backend'
        })
      } else {
        console.warn('⚠️ Backend error reporting failed')
        throw new Error('Backend unavailable')
      }
    } catch (backendError) {
      console.warn('⚠️ Backend error reporting failed, saving locally:', backendError)
      
      // Fallback: Log to console with structured format
      console.error('💾 LOCAL ERROR REPORT:', JSON.stringify(enhancedErrorData, null, 2))
      
      // In a real app, you could save to a local database or file system
      // For now, we'll just return success since the error is logged
      
      return NextResponse.json({
        success: true,
        message: 'Error report logged locally (backend unavailable)',
        errorId: errorData.errorId,
        saved_to: 'local_logs',
        note: 'Backend was unavailable, error logged to server console'
      })
    }
    
  } catch (error) {
    console.error('💥 Error Report API failed:', error)
    
    // Even if everything fails, we should acknowledge the error report
    return NextResponse.json({
      success: false,
      message: 'Error reporting failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Error report could not be processed'
    }, { status: 500 })
  }
}

// GET route for error reporting status
export async function GET() {
  try {
    // Check if backend error reporting is available
    const backendCheck = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    
    const backendAvailable = backendCheck.ok
    
    return NextResponse.json({
      status: 'Error Reporting API active',
      backend_url: BACKEND_URL,
      backend_available: backendAvailable,
      error_reporting_methods: [
        backendAvailable ? 'backend_storage' : null,
        'local_logging',
        'console_output'
      ].filter(Boolean),
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'Error Reporting API active',
      backend_url: BACKEND_URL,
      backend_available: false,
      error_reporting_methods: ['local_logging', 'console_output'],
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}