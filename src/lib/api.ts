// src/lib/api.ts
// Professional API Layer für FormularIQ Wissenschaftliche Studie

// API Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.NEXT_PUBLIC_API_URL || 'https://your-production-url.com')
  : 'http://localhost:8000'

// TypeScript Interfaces für saubere Typisierung
export interface FormInstructions {
  [key: string]: string
}

export interface FormValues {
  [key: string]: string
}

export interface SaveResponse {
  message: string
  filename: string
  storage: 'google_drive' | 'local'
  google_drive_id?: string
  web_link?: string
  folder?: string
  path?: string
}

export interface ChatMessage {
  type: 'user' | 'bot'
  message: string
  timestamp: Date
}

export interface DialogQuestion {
  question: string
  field: string
}

export interface DialogStartResponse {
  questions: DialogQuestion[]
  totalQuestions: number
  currentQuestionIndex: number
}

export interface DialogMessageResponse {
  response: string
  nextQuestion: boolean
  questionIndex?: number
  helpProvided?: boolean
  dialogComplete?: boolean
}

// === SYSTEM STATUS ===
export async function checkSystemStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      console.error('System Health Check failed:', response.status)
      return false
    }

    const data = await response.json()
    console.log('System Status:', data)
    return data.status === 'healthy'
  } catch (error) {
    console.error('System nicht erreichbar:', error)
    return false
  }
}

// === VARIANTE A: SICHTBARES FORMULAR ===
export async function generateInstructions(context: string): Promise<FormInstructions> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/instructions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ context: context.trim() }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Fehler beim Generieren der Anweisungen`)
    }

    const instructions = await response.json()
    
    // Validierung der Antwort-Struktur
    if (typeof instructions === 'object' && instructions !== null) {
      return instructions as FormInstructions
    } else {
      throw new Error('Ungültige Anweisungsstruktur erhalten')
    }
  } catch (error) {
    console.error('Fehler bei generateInstructions:', error)
    
    // Wissenschaftlich validierte Fallback-Anweisungen
    return {
      "GEBÄUDEART": "Geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Mehrfamilienhaus)",
      "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet? (Format: JJJJ)",
      "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern? (nur beheizte Räume)",
      "ANZAHL_STOCKWERKE": "Über wie viele Stockwerke erstreckt sich das Gebäude?",
      "HEIZUNGSART": "Welche Art der Heizung ist installiert? (z.B. Gas, Öl, Wärmepumpe)",
      "DACHTYP": "Welcher Dachtyp ist vorhanden? (z.B. Satteldach, Flachdach)",
      "KELLER_VORHANDEN": "Ist ein Keller vorhanden? (Ja/Nein/Teilunterkellert)",
      "ENERGIEAUSWEIS": "Liegt ein Energieausweis vor? Falls ja, welche Energieklasse?"
    }
  }
}

export async function saveFormData(instructions: FormInstructions, values: FormValues): Promise<SaveResponse> {
  try {
    const timestamp = new Date().toISOString()
    const filename = `formular_a_${timestamp.replace(/[:.]/g, '-')}.json`
    
    const response = await fetch(`${API_BASE_URL}/api/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        instructions,
        values,
        filename
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    return result as SaveResponse
  } catch (error) {
    console.error('Fehler beim Speichern der Formulardaten:', error)
    throw new Error('Fehler beim Speichern der Formulardaten. Bitte versuchen Sie es erneut.')
  }
}

// === VARIANTE B: DIALOG-SYSTEM ===
export async function startDialog(context: string): Promise<DialogStartResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dialog/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ context: context.trim() }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Fehler beim Starten des Dialogs`)
    }

    const data = await response.json()
    
    // Validierung der Dialog-Struktur
    if (data.questions && Array.isArray(data.questions) && data.totalQuestions) {
      return data as DialogStartResponse
    } else {
      throw new Error('Ungültige Dialog-Struktur erhalten')
    }
  } catch (error) {
    console.error('Fehler bei startDialog:', error)
    
    // Wissenschaftlich validierte Fallback-Fragen
    return {
      questions: [
        { question: "Welche Art von Gebäude möchten Sie erfassen?", field: "GEBÄUDEART" },
        { question: "In welchem Jahr wurde das Gebäude errichtet?", field: "BAUJAHR" },
        { question: "Wie groß ist die Wohnfläche des Gebäudes in Quadratmetern?", field: "WOHNFLÄCHE" },
        { question: "Über wie viele Stockwerke erstreckt sich das Gebäude?", field: "ANZAHL_STOCKWERKE" },
        { question: "Welche Art der Heizung ist installiert?", field: "HEIZUNGSART" },
        { question: "Welcher Dachtyp ist vorhanden?", field: "DACHTYP" },
        { question: "Ist ein Keller vorhanden?", field: "KELLER_VORHANDEN" },
        { question: "Liegt ein Energieausweis vor?", field: "ENERGIEAUSWEIS" }
      ],
      totalQuestions: 8,
      currentQuestionIndex: 0
    }
  }
}

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
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        message,
        currentQuestion,
        questionIndex,
        totalQuestions
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Fehler bei der Dialog-Verarbeitung`)
    }

    const data = await response.json()
    return data as DialogMessageResponse
  } catch (error) {
    console.error('Fehler bei sendDialogMessage:', error)
    return {
      response: 'Es gab einen Fehler bei der Verarbeitung Ihrer Nachricht. Bitte versuchen Sie es erneut.',
      nextQuestion: false
    }
  }
}

export async function saveDialogData(
  questions: DialogQuestion[],
  answers: Record<string, string>,
  chatHistory: ChatMessage[]
): Promise<SaveResponse> {
  try {
    const timestamp = new Date().toISOString()
    const filename = `dialog_b_${timestamp.replace(/[:.]/g, '-')}.json`
    
    const response = await fetch(`${API_BASE_URL}/api/dialog/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        questions,
        answers,
        chatHistory,
        filename
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    const result = await response.json()
    return result as SaveResponse
  } catch (error) {
    console.error('Fehler beim Speichern der Dialog-Daten:', error)
    throw new Error('Fehler beim Speichern der Dialog-Daten. Bitte versuchen Sie es erneut.')
  }
}

// === CHAT-HILFE (für beide Varianten) ===
export async function getChatHelp(message: string, context: string = ""): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ 
        message: message.trim(),
        context 
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Chat-Service nicht verfügbar`)
    }

    const data = await response.json()
    return data.response || 'Keine Antwort vom Chat-Service erhalten.'
  } catch (error) {
    console.error('Fehler bei getChatHelp:', error)
    return 'Der Chat-Service ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut.'
  }
}

// === UTILITY FUNCTIONS ===
export function formatTimestamp(timestamp: Date): string {
  return timestamp.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export function validateFormData(values: FormValues, requiredFields: string[]): string[] {
  const missingFields: string[] = []
  
  for (const field of requiredFields) {
    if (!values[field] || !values[field].trim()) {
      missingFields.push(field)
    }
  }
  
  return missingFields
}

export function calculateProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

// === ERROR HANDLING ===
export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: unknown, endpoint: string): never {
  if (error instanceof APIError) {
    throw error
  } else if (error instanceof Error) {
    throw new APIError(error.message, undefined, endpoint)
  } else {
    throw new APIError('Unbekannter Fehler aufgetreten', undefined, endpoint)
  }
}