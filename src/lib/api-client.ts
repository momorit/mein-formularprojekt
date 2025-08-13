// src/lib/api-client.ts - PRODUCTION-READY VERSION
const getBackendUrls = () => {
  const urls: string[] = []
  
  // Production URL von Environment Variable
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    urls.push(process.env.NEXT_PUBLIC_BACKEND_URL)
  }
  
  // Development URLs (nur wenn nicht in Production)
  if (process.env.NODE_ENV === 'development') {
    urls.push('http://localhost:8000', 'http://127.0.0.1:8000')
  }
  
  // Fallback URLs für Production
  urls.push(
    'https://mein-formularprojekt-production.up.railway.app',
    'https://mein-formularprojekt-db8b8pq9n-momorits-projects.vercel.app'
  )
  
  return urls
}

const BACKEND_URLS = getBackendUrls()

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

    console.log(`🔍 Testing backend URLs (${process.env.NODE_ENV}):`, BACKEND_URLS)
    
    for (const url of BACKEND_URLS) {
      try {
        console.log(`🧪 Testing: ${url}`)
        
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout für Production
        
        const response = await fetch(`${url}/health`, {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'User-Agent': 'FormularIQ-Frontend'
          },
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const healthData = await response.json()
          console.log(`✅ Backend found: ${url}`, healthData)
          workingBackendUrl = url
          backendHealthChecked = true
          return url
        }
        
        console.log(`❌ Backend failed (${response.status}): ${url}`)
      } catch (error) {
        console.log(`💥 Backend error: ${url}`, error instanceof Error ? error.message : error)
      }
    }

    throw new Error(`❌ Kein erreichbares Backend gefunden. Getestet: ${BACKEND_URLS.join(', ')}`)
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    try {
      const baseUrl = await this.findWorkingBackend()
      const url = `${baseUrl}${endpoint}`
      
      const defaultOptions: RequestInit = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'FormularIQ-Frontend'
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
      
      const response = await fetch(url, mergedOptions)
      
      if (!response.ok) {
        let errorText = `HTTP ${response.status}`
        try {
          const errorBody = await response.text()
          if (errorBody) {
            errorText = `${errorText}: ${errorBody}`
          }
        } catch (e) {
          // ignore parse errors
        }
        
        console.error(`❌ API Error:`, { url, status: response.status, error: errorText })
        throw new Error(`Backend Fehler (${response.status}): ${errorText}`)
      }
      
      const data = await response.json()
      console.log(`✅ API Success: ${endpoint} (${response.status})`)
      
      return data
    } catch (error) {
      console.error(`💥 Request failed for ${endpoint}:`, error)
      
      // Bei Netzwerk-Fehlern Backend-Cache zurücksetzen
      if (error instanceof TypeError || error.name === 'AbortError') {
        backendHealthChecked = false
        workingBackendUrl = null
      }
      
      // User-friendly error messages
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.name === 'AbortError') {
          throw new Error('❌ Backend nicht erreichbar - überprüfe deine Internetverbindung')
        }
        if (error.message.includes('NetworkError')) {
          throw new Error('❌ Netzwerk-Fehler - versuche es später erneut')
        }
        throw error
      }
      
      throw new Error('❌ Unbekannter API-Fehler')
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
    return this.makeRequest('/api/generate-instructions', {
      method: 'POST',
      body: JSON.stringify({ context }),
    })
  }

  async getChatHelp(message: string, context: string = '') {
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
      const healthData = await this.makeRequest('/health', { method: 'GET' })
      return { 
        status: 'healthy', 
        url: baseUrl,
        services: healthData.services || {},
        version: healthData.version || 'unknown',
        environment: healthData.environment || 'unknown'
      }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        tested_urls: BACKEND_URLS,
        environment: process.env.NODE_ENV || 'unknown'
      }
    }
  }

  // === DEBUGGING METHODS ===
  async testAllEndpoints() {
    try {
      const baseUrl = await this.findWorkingBackend()
      
      const tests = [
        { name: 'Health Check', endpoint: '/health', method: 'GET' },
        { name: 'Generate Instructions', endpoint: '/api/generate-instructions', method: 'POST', body: { context: 'test' } },
        { name: 'Chat', endpoint: '/api/chat', method: 'POST', body: { message: 'test', context: '' } },
        { name: 'Dialog Start', endpoint: '/api/dialog/start', method: 'POST', body: { context: 'test' } }
      ]
      
      const results = []
      
      for (const test of tests) {
        try {
          console.log(`🧪 Testing endpoint: ${test.name}`)
          await this.makeRequest(test.endpoint, {
            method: test.method,
            body: test.body ? JSON.stringify(test.body) : undefined
          })
          results.push({ ...test, status: '✅ success' })
        } catch (error) {
          results.push({ 
            ...test, 
            status: '❌ failed', 
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
      
      return { 
        baseUrl, 
        tests: results,
        environment: process.env.NODE_ENV,
        backend_urls_tested: BACKEND_URLS
      }
    } catch (error) {
      return { 
        error: error instanceof Error ? error.message : 'Backend not reachable',
        tested_urls: BACKEND_URLS,
        environment: process.env.NODE_ENV
      }
    }
  }

  // Reset backend cache (for debugging)
  resetBackendCache() {
    workingBackendUrl = null
    backendHealthChecked = false
    console.log('🔄 Backend cache reset')
  }

  // Get current configuration (for debugging)
  getConfig() {
    return {
      backend_urls: BACKEND_URLS,
      current_backend: workingBackendUrl,
      health_checked: backendHealthChecked,
      environment: process.env.NODE_ENV,
      next_public_backend_url: process.env.NEXT_PUBLIC_BACKEND_URL
    }
  }
}

// Export singleton instance
export const apiClient = new APIClient()

// Development debugging
if (typeof window !== 'undefined') {
  // Expose for debugging in both dev and production
  ;(window as any).apiClient = apiClient
  
  // Auto-test on load with better logging
  apiClient.checkHealth().then(status => {
    console.log('🏥 Backend Health Check:', status)
    
    if (status.status === 'unhealthy') {
      console.error('🚨 Backend Problem detected!')
      console.log('📊 Run window.apiClient.testAllEndpoints() for detailed diagnostics')
      console.log('⚙️ Current config:', apiClient.getConfig())
    } else {
      console.log('✅ Backend connection successful:', status.url)
    }
  })
}

export default apiClient