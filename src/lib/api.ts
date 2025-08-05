// src/lib/api.ts - SIMPLIFIED & FIXED

// API-Base-URL für verschiedene Umgebungen
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://mein-formularprojekt-production.up.railway.app')
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

// ✅ FIX: Correct interface matching backend
interface DialogQuestion {
  question: string  // Backend sendet "question"
  field: string     // Backend sendet "field"
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

// === FORMULAR-ANWEISUNGEN (Variante A) ===
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

// === CHAT-HILFE ===
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

// === FORMULAR-DATEN SPEICHERN ===
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

// === DIALOG-START (Variante B) ===
export async function startDialog(context: string): Promise<DialogStartResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dialog/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ context }),  // ✅ Correct JSON format
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

// === DIALOG-NACHRICHT VERARBEITEN ===
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

// === DIALOG-DATEN SPEICHERN ===
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

// === UTILITY-FUNKTIONEN ===
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

export function getApiConfig() {
  return {
    baseUrl: API_BASE_URL,
    environment: process.env.NODE_ENV,
    hasCustomApiUrl: !!process.env.NEXT_PUBLIC_API_URL
  }
}

// === ALIASES FÜR COMPATIBILITY ===
export const getInstructions = generateInstructions
export const sendChatMessage = getChatHelp