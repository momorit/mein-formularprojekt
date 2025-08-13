// src/app/api/study/save/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { saveToGoogleDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const studyData = await request.json();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `study_${studyData.participantId}_${timestamp}.json`;
    
    // Speichere in Google Drive
    const fileId = await saveToGoogleDrive(studyData, filename);
    
    return NextResponse.json({
      success: true,
      filename,
      fileId,
      message: 'Studiendaten erfolgreich gespeichert!',
      storage: 'google_drive'
    });
  } catch (error) {
    console.error('Save Error:', error);
    
    // Fallback: Return data for local download
    const studyData = await request.json();
    return NextResponse.json({
      success: false,
      error: 'Google Drive nicht erreichbar',
      downloadData: studyData,
      filename: `local_backup_${Date.now()}.json`
    }, { status: 500 });
  }
}