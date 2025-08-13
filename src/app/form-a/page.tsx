'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function FormAContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isStudy = searchParams.get('study') === 'true'
  const participantId = searchParams.get('participant')

  const [instructions, setInstructions] = useState<any>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)

  // Generate instructions on mount
  useEffect(() => {
    generateForm()
  }, [])

  const generateForm = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: 'Gebäude-Energieberatung Formular mit grundlegenden Gebäudedaten' 
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setInstructions(data)
      } else {
        // Fallback form
        setInstructions({
          fields: [
            {
              id: "gebaeudeart",
              label: "Art des Gebäudes",
              type: "select",
              required: true,
              options: ["Einfamilienhaus", "Mehrfamilienhaus", "Gewerbe"]
            },
            {
              id: "baujahr",
              label: "Baujahr",
              type: "number",
              required: true,
              placeholder: "z.B. 1995"
            },
            {
              id: "wohnflaeche",
              label: "Wohnfläche (m²)",
              type: "number",
              required: true,
              placeholder: "z.B. 150"
            },
            {
              id: "heizung",
              label: "Heizungsart",
              type: "select",
              required: true,
              options: ["Gas", "Öl", "Wärmepumpe", "Fernwärme"]
            }
          ]
        })
      }
    } catch (error) {
      console.error('Error generating form:', error)
      // Fallback form
      setInstructions({
        fields: [
          {
            id: "gebaeudeart",
            label: "Art des Gebäudes",
            type: "select",
            required: true,
            options: ["Einfamilienhaus", "Mehrfamilienhaus", "Gewerbe"]
          },
          {
            id: "baujahr",
            label: "Baujahr",
            type: "number",
            required: true,
            placeholder: "z.B. 1995"
          }
        ]
      })
    }
    setLoading(false)
  }

  const handleInputChange = (fieldId: string, value: string) => {
    setValues(prev => ({ ...prev, [fieldId]: value }))
  }

  const sendChatMessage = async () => {
    if (!chatInput.trim()) return

    setChatLoading(true)
    const userMessage = chatInput
    setChatInput('')
    
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMessage,
          context: 'Gebäude-Energieberatung Formular'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response || 'Ich helfe Ihnen gerne bei Ihren Fragen zum Formular!'
        }])
      } else {
        setChatMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Entschuldigung, ich kann Ihnen momentan nicht helfen. Versuchen Sie es später erneut.'
        }])
      }
    } catch (error) {
      setChatMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Es gab ein Problem bei der Verbindung. Bitte versuchen Sie es erneut.'
      }])
    }
    setChatLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instructions,
          values,
          chatHistory: chatMessages,
          timestamp: new Date().toISOString(),
          variant: 'A',
          participantId: participantId || 'unknown'
        })
      })

      if (response.ok) {
        if (isStudy) {
          router.push('/study?step=survey1')
        } else {
          alert('Formular erfolgreich gespeichert!')
        }
      } else {
        alert('Fehler beim Speichern. Bitte versuchen Sie es erneut.')
      }
    } catch (error) {
      alert('Verbindungsfehler. Bitte versuchen Sie es erneut.')
    }
  }

  const renderFormField = (field: any) => {
    if (!field || typeof field !== 'object') {
      return null
    }

    const value = values[field.id] || ''

    const commonProps = {
      id: field.id,
      name: field.id,
      required: field.required,
      value: value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        handleInputChange(field.id, e.target.value),
      className: "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
    }

    switch (field.type) {
      case 'select':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
              {String(field.label)} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select {...commonProps}>
              <option value="">{String(field.placeholder || 'Bitte wählen')}</option>
              {Array.isArray(field.options) && field.options.map((option: any, index: number) => (
                <option key={index} value={String(option)}>{String(option)}</option>
              ))}
            </select>
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
              {String(field.label)} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea 
              {...commonProps}
              rows={3}
              placeholder={String(field.placeholder || '')}
            />
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
              {String(field.label)} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input 
              {...commonProps}
              type="number"
              placeholder={String(field.placeholder || '')}
            />
          </div>
        )

      default:
        return (
          <div key={field.id} className="mb-4">
            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 mb-2">
              {String(field.label)} {field.required && <span className="text-red-500">*</span>}
            </label>
            <input 
              {...commonProps}
              type={String(field.type || 'text')}
              placeholder={String(field.placeholder || '')}
            />
          </div>
        )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Formular wird generiert...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {isStudy && (
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-blue-600 mb-2">Variante A: Sichtbares Formular</h1>
            <p className="text-gray-600">Alle Felder sind sichtbar, KI-Chat verfügbar</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Formular */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                📋 Gebäude-Energieberatung Formular
              </h2>

              <form onSubmit={handleSubmit}>
                {instructions?.fields && Array.isArray(instructions.fields) && 
                  instructions.fields.map((field: any) => renderFormField(field))
                }

                <button 
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium mt-6"
                >
                  {isStudy ? 'Weiter zur Bewertung' : 'Formular speichern'}
                </button>
              </form>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💬 KI-Assistent</h3>
              
              <div className="h-64 overflow-y-auto border border-gray-200 rounded-md p-3 mb-4 space-y-3">
                {chatMessages.length === 0 && (
                  <p className="text-gray-500 text-sm">
                    Hallo! Ich helfe Ihnen gerne beim Ausfüllen des Formulars. Stellen Sie mir einfach eine Frage!
                  </p>
                )}
                
                {chatMessages.map((message, index) => (
                  <div key={index} className={`${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block p-3 rounded-lg max-w-xs ${
                      message.role === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{String(message.content)}</p>
                    </div>
                  </div>
                ))}
                
                {chatLoading && (
                  <div className="text-left">
                    <div className="inline-block p-3 rounded-lg bg-gray-100">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Ihre Frage..."
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={sendChatMessage}
                  disabled={chatLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  ↗
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FormAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <FormAContent />
    </Suspense>
  )
}