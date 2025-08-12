// src/lib/api-client.ts - Robuster API Client mit Fallback

const BACKEND_URLS = [
  process.env.NEXT_PUBLIC_BACKEND_URL,
  process.env.BACKEND_URL,
  'http://127.0.0.1:8000',
  'https://web-production-xxxx.up.railway.app', // Ersetze mit deiner Railway URL
].filter(Boolean) as string[]

let workingBackendUrl: string | null = null
let backendHealthChecked = false

export interface StudySaveData {
  participantId: string
  startTime: string
  randomization: string
  demographics?: Record<string, string>
  variantAData?: any
  variantBData?: any
  comparisonData?: any
  totalDuration?: number
}

class APIClient {
  private async findWorkingBackend(): Promise<string> {
    if (workingBackendUrl && backendHealthChecked) {
      return workingBackendUrl
    }

    console.log('🔍 Testing backend URLs:', BACKEND_URLS)
    
    for (const url of BACKEND_URLS) {
      try {
        console.log(`🧪 Testing: ${url}`)
        
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          mode: 'cors',
          credentials: 'omit'
        })

        if (response.ok) {
          console.log(`✅ Backend found: ${url}`)
          workingBackendUrl = url
          backendHealthChecked = true
          return url
        }
        
        console.log(`❌ Backend failed (${response.status}): ${url}`)
      } catch (error) {
        console.log(`💥 Backend error: ${url}`, error)
      }
    }

    throw new Error('Kein erreichbares Backend gefunden')
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const baseUrl = await this.findWorkingBackend()
    const url = `${baseUrl}${endpoint}`
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      mode: 'cors',
      credentials: 'omit'
    }

    const mergedOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers,
      },
    }

    console.log(`📡 API Request: ${options.method || 'GET'} ${url}`)
    
    try {
      const response = await fetch(url, mergedOptions)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error(`❌ API Error (${response.status}):`, errorText)
        throw new Error(`Backend Fehler (${response.status}): ${errorText}`)
      }
      
      const data = await response.json()
      console.log('✅ API Success:', { endpoint, status: response.status })
      
      return data
    } catch (error) {
      console.error(`💥 Request failed: ${url}`, error)
      
      // Bei CORS/Network Fehlern, nächstes Backend versuchen
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        backendHealthChecked = false
        workingBackendUrl = null
        throw new Error('Backend nicht erreichbar - bitte überprüfe die URL')
      }
      
      throw error
    }
  }

  // === STUDY METHODS ===
  async saveCompleteStudy(studyData: StudySaveData) {
    return this.makeRequest('/api/study/save', {
      method: 'POST',
      body: JSON.stringify(studyData),
    })
  }

  // === FORM METHODS (Variante A) ===
  async generateInstructions(context: string) {
    return this.makeRequest('/api/instructions', {
      method: 'POST',
      body: JSON.stringify({ context }),
    })
  }

  async getChatHelp(message: string, context?: string) {
    return this.makeRequest('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context }),
    })
  }

  async saveFormData(instructions: string[], values: Record<string, string>) {
    return this.makeRequest('/api/save', {
      method: 'POST',
      body: JSON.stringify({ instructions, values }),
    })
  }

  // === DIALOG METHODS (Variante B) ===
  async startDialog(context: string) {
    return this.makeRequest('/api/dialog/start', {
      method: 'POST',
      body: JSON.stringify({ context }),
    })
  }

  async sendDialogMessage(sessionId: string, message: string, currentQuestion?: any) {
    return this.makeRequest('/api/dialog/message', {
      method: 'POST',
      body: JSON.stringify({ 
        session_id: sessionId,
        message,
        currentQuestion
      }),
    })
  }

  async saveDialogData(questions: any[], answers: Record<string, string>, chatHistory: any[]) {
    return this.makeRequest('/api/dialog/save', {
      method: 'POST',
      body: JSON.stringify({ questions, answers, chatHistory }),
    })
  }

  // === HEALTH CHECK ===
  async checkHealth() {
    try {
      const baseUrl = await this.findWorkingBackend()
      return { status: 'healthy', url: baseUrl }
    } catch (error) {
      return { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Health check für debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  apiClient.checkHealth().then(status => {
    console.log('🏥 Backend Health:', status)
  })
}

export default apiClient