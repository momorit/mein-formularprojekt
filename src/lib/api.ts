// === VARIANTE A (FORMULAR) ===
export async function generateInstructions(context: string) {
  try {
    const response = await fetch('/api/generate-instructions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context }),
    });

    if (!response.ok) {
      throw new Error(`Instructions generation failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Generate instructions error:', error);
    throw new Error('Formular-Generierung fehlgeschlagen');
  }
}

export async function getChatHelp(message: string, context?: string) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, context }),
    });

    if (!response.ok) {
      throw new Error(`Chat help failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Chat help error:', error);
    throw new Error('Chat-Hilfe nicht verfügbar');
  }
}

// ✅ KORRIGIERTE VERSION - 2 Parameter akzeptieren
export async function saveFormData(instructions: any, values: any) {
  try {
    const data = {
      instructions,
      values,
      timestamp: new Date().toISOString(),
      variant: 'A',
      metadata: {
        completion_rate: calculateCompletionRate(instructions, values),
        total_fields: instructions?.fields?.length || 0,
        filled_fields: Object.keys(values || {}).length
      }
    };

    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Save failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save form data error:', error);
    throw new Error('Speichern fehlgeschlagen');
  }
}

// Helper function für Completion Rate
function calculateCompletionRate(instructions: any, values: any): number {
  const totalFields = instructions?.fields?.length || 0;
  const filledFields = Object.keys(values || {}).length;
  
  if (totalFields === 0) return 0;
  return Math.round((filledFields / totalFields) * 100);
}

// === VARIANTE B (DIALOG) - Rest bleibt gleich ===
export async function startDialog(context?: string) {
  try {
    const response = await fetch('/api/dialog/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: context || '' }),
    });

    if (!response.ok) {
      throw new Error(`Dialog start failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Start dialog error:', error);
    throw new Error('Dialog konnte nicht gestartet werden');
  }
}

export async function sendDialogMessage(message: string, currentQuestion?: any) {
  try {
    const response = await fetch('/api/dialog/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message, 
        currentQuestion,
        questionIndex: 0,
        totalQuestions: 1
      }),
    });

    if (!response.ok) {
      throw new Error(`Dialog message failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Send dialog message error:', error);
    throw new Error('Nachricht konnte nicht gesendet werden');
  }
}

export async function saveDialogData(data: any) {
  try {
    const response = await fetch('/api/dialog/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Dialog save failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save dialog data error:', error);
    throw new Error('Dialog-Speichern fehlgeschlagen');
  }
}

// === SYSTEM STATUS ===
export async function checkSystemStatus() {
  try {
    const response = await fetch('/api/health', {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Health check error:', error);
    return {
      status: 'error',
      services: {
        groq: false,
        google: false
      }
    };
  }
}

// === STUDY SYSTEM ===
export async function saveStudyData(studyData: any) {
  try {
    const response = await fetch('/api/study/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studyData),
    });

    if (!response.ok) {
      throw new Error(`Study save failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Save study data error:', error);
    throw new Error('Studiendaten konnten nicht gespeichert werden');
  }
}