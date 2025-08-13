import { NextRequest, NextResponse } from 'next/server';
import { saveToGoogleDrive } from '@/lib/google-drive';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `form_a_${timestamp}.json`;
    
    // Versuche Google Drive
    try {
      const fileId = await saveToGoogleDrive(data, filename);
      
      return NextResponse.json({
        success: true,
        filename,
        fileId,
        storage: 'google_drive'
      });
    } catch (driveError) {
      // Fallback: Return data for download
      return NextResponse.json({
        success: false,
        error: 'Google Drive nicht verfügbar',
        downloadData: data,
        filename: `local_${filename}`
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json(
      { error: 'Speichern fehlgeschlagen' },
      { status: 500 }
    );
  }
}