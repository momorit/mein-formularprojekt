// src/app/api/save/route.ts - VEREINFACHTE VERSION (ohne Google Cloud)
import { NextRequest, NextResponse } from 'next/server'

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

    // Log data for now (Vercel compatible)
    console.log('📊 VARIANT A DATA:', JSON.stringify(enhancedData, null, 2))
    
    return NextResponse.json({
      success: true,
      variant: 'A',
      storage_location: 'vercel_logging',
      timestamp: new Date().toISOString(),
      message: 'Variant A data logged successfully'
    })
    
  } catch (error) {
    console.error('❌ Variant A save error:', error)
    return NextResponse.json(
      { error: 'Failed to save Variant A data' },
      { status: 500 }
    )
  }
}