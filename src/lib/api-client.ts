// src/lib/api-client.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

class APIClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  // === HEALTH CHECK ===
  async healthCheck() {
    return this.request('/health')
  }

  // === VARIANTE A (FORM) ===
  async generateFormInstructions(context: string = '') {
    return this.request('/generate-instructions', {
      method: 'POST',
      body: JSON.stringify({ context })
    })
  }

  async getChatHelp(message: string, context: string = '') {
    return this.request('/chat', {
      method: 'POST', 
      body: JSON.stringify({ message, context })
    })
  }

  async saveFormData(instructions: any, values: any) {
    const data = {
      instructions,
      values,
      timestamp: new Date().toISOString(),
      variant: 'A',
      metadata: {
        completion_rate: this.calculateCompletionRate(instructions, values),
        total_fields: instructions?.fields?.length || Object.keys(instructions || {}).length,
        filled_fields: Object.keys(values || {}).filter(key => values[key]?.trim()).length
      }
    }

    return this.request('/save', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // === VARIANTE B (DIALOG) ===
  async startDialog(context: string = '') {
    return this.request('/dialog/start', {
      method: 'POST',
      body: JSON.stringify({ context })
    })
  }

  async sendDialogMessage(
    message: string, 
    sessionId: string = '',
    currentQuestion: any = null,
    questionIndex: number = 0
  ) {
    return this.request('/dialog/message', {
      method: 'POST',
      body: JSON.stringify({ 
        session_id: sessionId,
        message, 
        currentQuestion,
        questionIndex
      })
    })
  }

  async saveDialogData(
    questions: any[], 
    answers: Record<string, string>, 
    chatHistory: any[],
    sessionId: string = ''
  ) {
    const data = {
      session_id: sessionId,
      questions,
      answers,
      chatHistory,
      timestamp: new Date().toISOString(),
      variant: 'B',
      metadata: {
        completion_rate: this.calculateDialogCompletionRate(questions, answers),
        total_questions: questions.length,
        answered_questions: Object.keys(answers).length,
        chat_interactions: chatHistory.length
      }
    }

    return this.request('/dialog/save', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // === STUDY DATA ===
  async saveStudyData(studyData: {
    participantId: string
    demographics: any
    variantAData?: any
    variantBData?: any
    surveys: any
    comparison?: any
  }) {
    return this.request('/study/save', {
      method: 'POST',
      body: JSON.stringify({
        ...studyData,
        timestamp: new Date().toISOString(),
        metadata: {
          project: 'FormularIQ',
          institution: 'HAW Hamburg',
          researcher: 'Moritz Treu',
          version: '1.0.0'
        }
      })
    })
  }

  // === HELPER METHODS ===
  private calculateCompletionRate(instructions: any, values: any): number {
    const totalFields = instructions?.fields?.length || Object.keys(instructions || {}).length
    const filledFields = Object.keys(values || {}).filter(key => values[key]?.trim()).length
    
    if (totalFields === 0) return 0
    return Math.round((filledFields / totalFields) * 100)
  }

  private calculateDialogCompletionRate(questions: any[], answers: Record<string, string>): number {
    const totalQuestions = questions.length
    const answeredQuestions = Object.keys(answers).length
    
    if (totalQuestions === 0) return 0
    return Math.round((answeredQuestions / totalQuestions) * 100)
  }

  // === ERROR HANDLING ===
  async testConnection(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch (error) {
      console.error('API connection test failed:', error)
      return false
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Export class for custom instances
export default APIClient

// === TYPES FOR API RESPONSES ===
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: string
}

export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  services: {
    google_drive?: 'connected' | 'error'
    llm_ollama?: 'online' | 'offline'
    groq?: 'available' | 'unavailable'
  }
  timestamp: string
  version: string
}

export interface FormInstructionsResponse {
  instructions: string[]
  fields: Array<{
    id: string
    label: string
    type: string
    required: boolean
    placeholder?: string
    hint?: string
  }>
  context_used: string
}

export interface ChatResponse {
  response: string
  context_understanding: string
  suggestions?: string[]
}

export interface DialogStartResponse {
  session_id: string
  questions: Array<{
    id: string
    question: string
    field: string
    type: string
    required: boolean
  }>
  welcome_message: string
}

export interface DialogMessageResponse {
  response: string
  next_question?: {
    id: string
    question: string
    field: string
  }
  is_complete: boolean
  progress: {
    current: number
    total: number
    percentage: number
  }
}

export interface SaveResponse {
  success: boolean
  file_id: string
  storage_location: 'google_drive' | 'local'
  timestamp: string
}