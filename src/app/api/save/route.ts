import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const saveData = {
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
    
    // In production, would save to database/storage
    console.log('Form data saved:', saveData)
    
    return NextResponse.json({
      success: true,
      storage_location: 'vercel_api',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving form data:', error)
    return NextResponse.json(
      { error: 'Failed to save data' },
      { status: 500 }
    )
  }
}
