// src/lib/api.ts - Vollständige Version mit allen Funktionen

// API-Base-URL für verschiedene Umgebungen
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://your-backend.up.railway.app')
  : 'http://localhost:8000'

// TypeScript Interface Definitionen
interface FormInstructions {
  [key: string]: string
}

interface FormValues {
  [key: string]: string
}

interface SaveResponse {
  filename: string
  message: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface DialogQuestion {
  question: string
  field: string
}

interface DialogStartResponse {
  questions: DialogQuestion[]
  totalQuestions: number
  currentQuestionIndex: number
}

interface DialogMessageResponse {
  response: string
  nextQuestion: boolean
}

// === BESTEHENDE FUNKTIONEN ===

// API-Funktionen für Formular-Anweisungen
export async function generateInstructions(context: string): Promise<FormInstructions> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/instructions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const instructions = await response.json()
    return instructions as FormInstructions
  } catch (error) {
    console.error('Fehler beim Generieren der Anweisungen:', error)
    
    // Fallback bei Netzwerk-Fehlern
    return {
      "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an",
      "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?",
      "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern?",
      "HEIZUNGSART": "Welche Art der Heizung ist installiert?",
      "DACHTYP": "Beschreiben Sie die Art des Daches"
    }
  }
}

// Chat-Hilfe API
export async function getChatHelp(message: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data.response || 'Entschuldigung, ich konnte Ihre Frage nicht beantworten.'
  } catch (error) {
    console.error('Fehler bei Chat-Hilfe:', error)
    return 'Entschuldigung, der Chat-Service ist momentan nicht verfügbar.'
  }
}

// Formular-Daten speichern
export async function saveFormData(instructions: FormInstructions, values: FormValues): Promise<SaveResponse> {
  try {
    const timestamp = new Date().toISOString()
    const filename = `output_${timestamp.replace(/[:.]/g, '-')}.json`
    
    const response = await fetch(`${API_BASE_URL}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructions,
        values,
        filename
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result as SaveResponse
  } catch (error) {
    console.error('Fehler beim Speichern:', error)
    throw new Error('Fehler beim Speichern der Formulardaten')
  }
}

// Dialog-Start API
export async function startDialog(context: string): Promise<DialogStartResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dialog/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as DialogStartResponse
  } catch (error) {
    console.error('Fehler beim Dialog-Start:', error)
    
    // Fallback-Fragen
    return {
      questions: [
        { question: "Welche Art von Gebäude möchten Sie erfassen?", field: "GEBÄUDEART" },
        { question: "In welchem Jahr wurde das Gebäude errichtet?", field: "BAUJAHR" },
        { question: "Wie groß ist die Wohnfläche in Quadratmetern?", field: "WOHNFLÄCHE" },
        { question: "Welche Art der Heizung ist installiert?", field: "HEIZUNGSART" },
        { question: "Welche Art von Dach hat das Gebäude?", field: "DACHTYP" }
      ],
      totalQuestions: 5,
      currentQuestionIndex: 0
    }
  }
}

// Dialog-Nachricht verarbeiten
export async function sendDialogMessage(
  message: string,
  currentQuestion: DialogQuestion,
  questionIndex: number,
  totalQuestions: number
): Promise<DialogMessageResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dialog/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        currentQuestion,
        questionIndex,
        totalQuestions
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data as DialogMessageResponse
  } catch (error) {
    console.error('Fehler bei Dialog-Nachricht:', error)
    return {
      response: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Nachricht.',
      nextQuestion: false
    }
  }
}

// Dialog-Daten speichern
export async function saveDialogData(
  questions: DialogQuestion[],
  answers: Record<string, string>,
  chatHistory: ChatMessage[]
): Promise<SaveResponse> {
  try {
    const timestamp = new Date().toISOString()
    const filename = `dialog_output_${timestamp.replace(/[:.]/g, '-')}.json`
    
    const response = await fetch(`${API_BASE_URL}/api/dialog/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questions,
        answers,
        chatHistory,
        filename
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const result = await response.json()
    return result as SaveResponse
  } catch (error) {
    console.error('Fehler beim Speichern der Dialog-Daten:', error)
    throw new Error('Fehler beim Speichern der Dialog-Daten')
  }
}

// === FEHLENDE FUNKTIONEN FÜR FORM-A ===

// Alias für generateInstructions (für form-a compatibility)
export async function getInstructions(context: string): Promise<FormInstructions> {
  return generateInstructions(context)
}

// Chat-Message senden (für form-a compatibility)
export async function sendChatMessage(message: string): Promise<string> {
  return getChatHelp(message)
}

// === FEHLENDE FUNKTIONEN FÜR FORM-B ===

// Nur Fragen speichern (vereinfacht)
export async function saveQuestionsOnly(questions: DialogQuestion[]): Promise<SaveResponse> {
  const timestamp = new Date().toISOString()
  const filename = `questions_${timestamp.replace(/[:.]/g, '-')}.json`
  
  try {
    // Local fallback - speichert nur in Browser
    const data = {
      questions,
      timestamp,
      type: "questions_only"
    }
    
    // Für Demo: Als JSON-String zurückgeben
    console.log('Questions saved:', data)
    
    return {
      filename,
      message: "Fragen gespeichert (Demo-Modus)"
    }
  } catch (error) {
    console.error('Fehler beim Speichern der Fragen:', error)
    throw new Error('Fehler beim Speichern der Fragen')
  }
}

// Antworten aus Chat-History extrahieren
export function extractAnswers(
  questions: DialogQuestion[], 
  chatHistory: ChatMessage[]
): Record<string, string> {
  const answers: Record<string, string> = {}
  
  // Einfache Extraktion: jede User-Nachricht wird der entsprechenden Frage zugeordnet
  const userMessages = chatHistory.filter(msg => msg.role === 'user')
  
  questions.forEach((question, index) => {
    if (userMessages[index]) {
      answers[question.field] = userMessages[index].content
    }
  })
  
  return answers
}

// Komplette Dialog-Daten speichern (für form-b compatibility)
export async function saveCompleteDialogData(
  questions: DialogQuestion[],
  chatHistory: ChatMessage[]
): Promise<SaveResponse> {
  const answers = extractAnswers(questions, chatHistory)
  return saveDialogData(questions, answers, chatHistory)
}

// Utility-Funktion für API-Status
export async function checkApiStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
    })
    return response.ok
  } catch (error) {
    console.error('API-Status-Check fehlgeschlagen:', error)
    return false
  }
}

// Debug-Information
export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    environment: process.env.NODE_ENV,
    hasCustomApiUrl: !!process.env.NEXT_PUBLIC_API_URL
  }
}