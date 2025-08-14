// src/app/api/dialog/save/route.ts - VEREINFACHTE VERSION (ohne Google Cloud)
import { NextRequest, NextResponse } from 'next/server'

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

    // Log data for now (Vercel compatible)
    console.log('📊 VARIANT B DATA:', JSON.stringify(enhancedData, null, 2))
    
    return NextResponse.json({
      success: true,
      variant: 'B',
      storage_location: 'vercel_logging',
      timestamp: new Date().toISOString(),
      message: 'Variant B data logged successfully'
    })
    
  } catch (error) {
    console.error('❌ Variant B save error:', error)
    return NextResponse.json(
      { error: 'Failed to save Variant B data' },
      { status: 500 }
    )
  }
}