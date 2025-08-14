import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const saveData = {
      study_type: 'FormularIQ_Usability_Study',
      ...data,
      timestamp: new Date().toISOString(),
      study_metadata: {
        project: 'FormularIQ - LLM-gestützte Formularbearbeitung',
        institution: 'HAW Hamburg',
        researcher: 'Moritz Treu',
        version: '2.0.0'
      }
    }
    
    // In production, would save to database/storage (e.g., Supabase, PlanetScale)
    console.log('Study data saved:', saveData)
    
    return NextResponse.json({
      success: true,
      participant_id: data.participantId,
      storage_location: 'vercel_api',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error saving study data:', error)
    return NextResponse.json(
      { error: 'Failed to save study data' },
      { status: 500 }
    )
  }
}