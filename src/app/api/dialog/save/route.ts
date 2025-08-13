import { NextRequest, NextResponse } from 'next/server';
import { saveToGoogleDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `dialog_${timestamp}.json`;
    
    try {
      const fileId = await saveToGoogleDrive(data, filename);
      
      return NextResponse.json({
        success: true,
        filename,
        fileId,
        storage: 'google_drive'
      });
    } catch (driveError) {
      return NextResponse.json({
        success: false,
        error: 'Google Drive nicht verfügbar',
        downloadData: data,
        filename: `local_${filename}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Dialog save error:', error);
    return NextResponse.json(
      { error: 'Dialog-Speichern fehlgeschlagen' },
      { status: 500 }
    );
  }
}