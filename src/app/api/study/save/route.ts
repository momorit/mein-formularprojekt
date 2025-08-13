import { NextRequest, NextResponse } from 'next/server';
import { saveToGoogleDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const studyData = await request.json();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `study_${studyData.participantId}_${timestamp}.json`;
    
    try {
      const fileId = await saveToGoogleDrive(studyData, filename);
      
      return NextResponse.json({
        success: true,
        filename,
        fileId,
        message: 'Studiendaten erfolgreich gespeichert!',
        storage: 'google_drive'
      });
    } catch (driveError) {
      return NextResponse.json({
        success: true,
        filename: `local_backup_${Date.now()}.json`,
        downloadData: studyData,
        message: 'Daten als Download gespeichert',
        storage: 'local_download'
      });
    }
  } catch (error) {
    console.error('Study save error:', error);
    return NextResponse.json({
      success: true,
      filename: `emergency_backup_${Date.now()}.json`,
      downloadData: await request.json(),
      message: 'Notfall-Backup erstellt',
      storage: 'local_download'
    });
  }
}