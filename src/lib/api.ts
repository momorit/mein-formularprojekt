// src/lib/api.ts

export async function getInstructions(context: string) {
  const res = await fetch("http://localhost:8000/api/instructions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context })
  })
  if (!res.ok) throw new Error("Fehler bei der Verarbeitung")
  return await res.json()
}

export async function saveFormData(instructions: any, values: any) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `output_${timestamp}.json`
  const res = await fetch("http://localhost:8000/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions, values, filename })
  })
  if (!res.ok) throw new Error("Fehler beim Speichern der JSON-Datei")
  return await res.json()
}

export async function sendChatMessage(message: string) {
  const res = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
  if (!res.ok) throw new Error("Fehler bei der Chatverarbeitung")
  return await res.json()
}


// === NEUE FUNKTIONEN FÜR VARIANTE B (DIALOG) ===

export async function startDialog(formData: FormData) {
  const res = await fetch("http://localhost:8000/api/dialog/start", {
    method: "POST",
    body: formData
  })
  if (!res.ok) throw new Error("Fehler beim Starten des Dialogs")
  return await res.json()
}

export async function sendDialogMessage(data: {
  message: string
  currentQuestion: { feld: string; frage: string }
  questionIndex: number
  totalQuestions: number
}) {
  const res = await fetch("http://localhost:8000/api/dialog/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("Fehler beim Senden der Dialog-Nachricht")
  return await res.json()
}

// Verbesserte Version für src/lib/api.ts - saveDialogData Funktion

export async function saveDialogData(data: {
  questions: Array<{ feld: string; frage: string }>
  answers: Record<string, string>
  chatHistory: Array<{ role: string; content: string }>
}) {
  try {
    // Timestamp für eindeutige Dateinamen (gleiche Logik wie Variante A)
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `dialog_output_${timestamp}.json`
    
    // Daten validieren
    if (!data.questions || data.questions.length === 0) {
      throw new Error("Keine Fragen vorhanden")
    }
    
    // API-Aufruf
    const res = await fetch("http://localhost:8000/api/dialog/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ...data, 
        filename,
        // Zusätzliche Metadaten für bessere Nachverfolgung
        metadata: {
          saved_at: new Date().toISOString(),
          variant: "B",
          total_questions: data.questions.length,
          answered_questions: Object.keys(data.answers).length,
          completion_rate: Math.round((Object.keys(data.answers).length / data.questions.length) * 100)
        }
      })
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }
    
    const result = await res.json()
    console.log("✅ Dialog-Daten erfolgreich gespeichert:", result)
    return result
    
  } catch (error) {
    console.error("❌ Fehler beim Speichern der Dialog-Daten:", error)
    throw new Error(`Fehler beim Speichern der Dialog-Daten: ${error.message}`)
  }
}

// Optional: Funktion zum Laden gespeicherter Dialog-Dateien
export async function getDialogFiles() {
  try {
    const res = await fetch("http://localhost:8000/api/dialog/files")
    if (!res.ok) throw new Error("Fehler beim Laden der Dateien")
    return await res.json()
  } catch (error) {
    console.error("Fehler beim Laden der Dialog-Dateien:", error)
    throw error
  }
}

// Erweiterte Speicherfunktion mit zusätzlichen Optionen
export async function saveDialogDataWithOptions(data: {
  questions: Array<{ feld: string; frage: string }>
  answers: Record<string, string>
  chatHistory: Array<{ role: string; content: string }>
}, options?: {
  customFilename?: string
  includeMetadata?: boolean
  folder?: string
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = options?.customFilename || `dialog_output_${timestamp}.json`
  
  const payload = {
    ...data,
    filename
  }
  
  // Zusätzliche Metadaten hinzufügen falls gewünscht
  if (options?.includeMetadata !== false) {
    payload.metadata = {
      saved_at: new Date().toISOString(),
      variant: "B - Dialog-basiert", 
      total_questions: data.questions.length,
      answered_questions: Object.keys(data.answers).length,
      completion_rate: Math.round((Object.keys(data.answers).length / data.questions.length) * 100),
      chat_messages: data.chatHistory.length
    }
  }
  
  const res = await fetch("http://localhost:8000/api/dialog/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  
  if (!res.ok) throw new Error("Fehler beim Speichern der Dialog-Daten")
  return await res.json()
}

// Füge diese Funktionen zu deiner src/lib/api.ts hinzu:

// Neue API-Funktion für Fragen-Download
export async function saveQuestionsOnly(data: {
  questions: Array<{ feld: string; frage: string }>
  context: string
}) {
  try {
    // Timestamp für eindeutige Dateinamen
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const filename = `questions_${timestamp}.json`
    
    // Daten validieren
    if (!data.questions || data.questions.length === 0) {
      throw new Error("Keine Fragen vorhanden")
    }
    
    // API-Aufruf
    const res = await fetch("http://localhost:8000/api/dialog/save-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        ...data, 
        filename
      })
    })
    
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`HTTP ${res.status}: ${errorText}`)
    }
    
    const result = await res.json()
    console.log("✅ Fragen erfolgreich gespeichert:", result)
    return result
    
  } catch (error) {
    console.error("❌ Fehler beim Speichern der Fragen:", error)
    throw new Error(`Fehler beim Speichern der Fragen: ${error.message}`)
  }
}

// Funktion zum Laden der Fragen-Dateien
export async function getQuestionsFiles() {
  try {
    const res = await fetch("http://localhost:8000/api/dialog/questions-files")
    if (!res.ok) throw new Error("Fehler beim Laden der Fragen-Dateien")
    return await res.json()
  } catch (error) {
    console.error("Fehler beim Laden der Fragen-Dateien:", error)
    throw error
  }
}

// Erweiterte Funktion mit zusätzlichen Metadaten
export async function saveQuestionsWithMetadata(data: {
  questions: Array<{ feld: string; frage: string }>
  context: string
}, options?: {
  customFilename?: string
  includeStats?: boolean
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = options?.customFilename || `questions_${timestamp}.json`
  
  const payload = {
    ...data,
    filename
  }
  
  const res = await fetch("http://localhost:8000/api/dialog/save-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  
  if (!res.ok) throw new Error("Fehler beim Speichern der Fragen")
  return await res.json()
}