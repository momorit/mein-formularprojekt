// src/lib/google-drive.ts - Google Drive Integration
import { google } from 'googleapis';

function getGoogleAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GOOGLE_PROJECT_ID,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
}

export async function saveToGoogleDrive(data: any, filename: string): Promise<string> {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });

    const fileContent = JSON.stringify(data, null, 2);
    
    const response = await drive.files.create({
      requestBody: {
        name: filename,
        parents: [process.env.GOOGLE_DRIVE_FOLDER_ID!],
      },
      media: {
        mimeType: 'application/json',
        body: fileContent,
      },
    });

    return response.data.id || 'unknown';
  } catch (error) {
    console.error('Google Drive Error:', error);
    throw new Error('Google Drive Speicherung fehlgeschlagen');
  }
}