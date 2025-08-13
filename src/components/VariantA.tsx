'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, Send, Loader2, CheckCircle } from 'lucide-react'

interface VariantAProps {
  onComplete: (data: any) => void
  startTime: Date
}

const SAMPLE_CONTEXT = `
Gebäude-Energieberatung Förderantrag

Beispiel-Gebäudedaten:
- Mehrfamilienhaus, Baujahr 1985
- Wohnfläche: 420 m², 3 Stockwerke + Dachgeschoss
- Gas-Brennwert Heizung, teilweise gedämmt
- Doppelverglasung Fenster
- Eigentümer möchte energetische Sanierung
`

export default function VariantA({ onComplete, startTime }: VariantAProps) {
  const [formFields, setFormFields] = useState<Record<string, string>>({})
  const [instructions, setInstructions] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'bot', message: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [isLoadingInstructions, setIsLoadingInstructions] = useState(false)
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [helpRequests, setHelpRequests] = useState(0)
  const [errors, setErrors] = useState(0)

  // Generate initial instructions
  useEffect(() => {
    generateInitialInstructions()
  }, [])

  const generateInitialInstructions = async () => {
    setIsLoadingInstructions(true)
    
    try {
      // Try backend first
      const response = await fetch('/api/formular/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: SAMPLE_CONTEXT })
      })

      if (response.ok) {
        const data = await response.json()
        setInstructions(data.instructions || getDefaultInstructions())
      } else {
        throw new Error('Backend not available')
      }
    } catch (error) {
      console.warn('Using default instructions:', error)
      setInstructions(getDefaultInstructions())
    } finally {
      setIsLoadingInstructions(false)
    }
  }

  const getDefaultInstructions = () => ({
    "GEBAEUDETYP": "Geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Mehrfamilienhaus, Gewerbe)",
    "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet? (Format: JJJJ)",
    "WOHNFLAECHE": "Wie groß ist die beheizte Wohnfläche in Quadratmetern?",
    "STOCKWERKE": "Über wie viele Stockwerke erstreckt sich das Gebäude?",
    "HEIZUNGSART": "Welche Art der Heizung ist installiert? (z.B. Gas, Öl, Wärmepumpe, Fernwärme)",
    "DAEMMUNG_DACH": "Ist das Dach gedämmt? Wenn ja, welche Dämmstärke in cm?",
    "DAEMMUNG_WAND": "Sind die Außenwände gedämmt? Wenn ja, welches Material und welche Stärke?",
    "FENSTER": "Welche Art von Fenstern sind eingebaut? (Einfach-, Doppel-, Dreifachverglasung)",
    "ENERGIEVERBRAUCH": "Wie hoch ist der jährliche Energieverbrauch für Heizung in kWh oder Liter/m³?",
    "SANIERUNGSWUNSCH": "Welche energetischen Verbesserungen planen Sie? (z.B. neue Heizung, Dämmung, Fenster)"
  })

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormFields(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleHelpRequest = async (fieldName?: string) => {
    if (!chatInput.trim()) return
    
    setHelpRequests(prev => prev + 1)
    setIsLoadingChat(true)
    
    const userMessage = chatInput.trim()
    const context = fieldName ? `Feld: ${fieldName} - ${instructions[fieldName]}` : ''
    
    setChatHistory(prev => [...prev, { type: 'user', message: userMessage }])
    setChatInput('')
    
    try {
      const response = await fetch('/api/formular/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage, 
          context: context + '\n' + SAMPLE_CONTEXT 
        })
      })

      if (response.ok) {
        const data = await response.json()
        setChatHistory(prev => [...prev, { type: 'bot', message: data.response }])
      } else {
        throw new Error('Chat service not available')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatHistory(prev => [...prev, { 
        type: 'bot', 
        message: 'Der Chat-Service ist momentan nicht verfügbar. Versuchen Sie es später erneut.' 
      }])
      setErrors(prev => prev + 1)
    } finally {
      setIsLoadingChat(false)
    }
  }

  const handleSubmit = () => {
    const completedFields = Object.values(formFields).filter(v => v.trim()).length
    const totalFields = Object.keys(instructions).length
    const completionRate = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

    const variantData = {
      type: 'formular',
      startTime,
      endTime: new Date(),
      duration: Date.now() - startTime.getTime(),
      formFields,
      instructions,
      chatHistory,
      helpRequests,
      errors,
      interactions: chatHistory.length,
      completedFields,
      totalFields,
      completionRate,
      completed: true
    }

    onComplete(variantData)
  }

  if (isLoadingInstructions) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span>Formular wird generiert...</span>
      </div>
    )
  }

  const completedFields = Object.values(formFields).filter(v => v.trim()).length
  const totalFields = Object.keys(instructions).length
  const progress = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Fortschritt</h3>
          <span className="text-sm text-gray-600">
            {completedFields} von {totalFields} Feldern ausgefüllt
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">{progress}%</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formular */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-bold mb-6">Förderantrag - Gebäudedaten</h2>
            
            <div className="space-y-4">
              {Object.entries(instructions).map(([fieldName, instruction]) => (
                <div key={fieldName} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-gray-700 flex-1">
                      {fieldName.replace(/_/g, ' ')}
                    </label>
                    <button
                      onClick={() => {
                        setChatInput(`Hilfe zu ${fieldName}: ${instruction}`)
                      }}
                      className="text-blue-500 hover:text-blue-700 p-1"
                      title="Hilfe zu diesem Feld"
                    >
                      <HelpCircle className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{instruction}</p>
                  
                  <input
                    type="text"
                    value={formFields[fieldName] || ''}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`${fieldName.replace(/_/g, ' ')} eingeben...`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t">
              <button
                onClick={handleSubmit}
                className="w-full bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition-colors font-medium"
              >
                <CheckCircle className="w-5 h-5 inline-block mr-2" />
                Variante A abschließen ({progress}% ausgefüllt)
              </button>
            </div>
          </div>
        </div>

        {/* Chat-Hilfe */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-4">
            <h3 className="font-semibold mb-4">💬 KI-Hilfe</h3>
            
            {/* Chat History */}
            <div className="h-64 overflow-y-auto mb-4 space-y-2 bg-gray-50 rounded p-3">
              {chatHistory.length === 0 ? (
                <div className="text-gray-500 text-sm text-center py-8">
                  Stellen Sie Fragen zum Formular!<br/>
                  Beispiel: "Was bedeutet Dämmstärke?"
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div 
                    key={idx}
                    className={`p-2 rounded text-sm ${
                      msg.type === 'user' 
                        ? 'bg-blue-100 text-blue-900 ml-4' 
                        : 'bg-white text-gray-800 mr-4 shadow-sm'
                    }`}
                  >
                    <strong>{msg.type === 'user' ? 'Sie:' : 'KI:'}</strong> {msg.message}
                  </div>
                ))
              )}
            </div>

            {/* Chat Input */}
            <div className="space-y-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Fragen Sie die KI um Hilfe..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
              />
              
              <button
                onClick={() => handleHelpRequest()}
                disabled={!chatInput.trim() || isLoadingChat}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isLoadingChat ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
                    KI antwortet...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2 inline-block" />
                    Frage senden
                  </>
                )}
              </button>
            </div>

            {/* Stats */}
            <div className="mt-4 text-xs text-gray-600 space-y-1">
              <div>🤝 Hilfe-Anfragen: {helpRequests}</div>
              <div>💬 Chat-Nachrichten: {chatHistory.length}</div>
              <div>⚠️ Fehler: {errors}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}