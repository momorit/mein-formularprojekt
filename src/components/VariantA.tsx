// src/components/VariantA.tsx - FLOW FIXED
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Save, Lightbulb, HelpCircle, Play } from 'lucide-react'

interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  options?: string[]
  required: boolean
  difficulty: 'easy' | 'hard'
  hint: string
  placeholder: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  message: string
  timestamp: Date
}

interface VariantAProps {
  onComplete?: (data: any) => void
  startTime?: Date
}

export default function VariantA({ onComplete, startTime }: VariantAProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isStudy = searchParams.get('study') === 'true'
  const participantId = searchParams.get('participant')
  const variant = searchParams.get('variant')
  const step = searchParams.get('step') // '2' for first variant, '4' for second variant

  // Form state
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isFormGenerated, setIsFormGenerated] = useState(false)
  const [formFields, setFormFields] = useState<FormField[]>([])

  const generateFormInstructions = async () => {
    setIsGenerating(true)
    setIsFormGenerated(false)
    
    try {
      const response = await fetch('/api/generate-instructions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          context: 'Siedlungsstraße 23, Großstadt: 10 WE, Rotklinkerfassade 1965, WDVS-Sanierung Mieter EG' 
        })
      })
      
      if (!response.ok) throw new Error('Failed to generate instructions')
      
      const data = await response.json()
      setFormFields(data.fields)
      
      // Initialize form values
      const initialValues: Record<string, string> = {}
      data.fields.forEach((field: FormField) => {
        initialValues[field.id] = ''
      })
      setFormValues(initialValues)
      
      setChatHistory([{
        role: 'assistant',
        message: `Willkommen! Ich helfe Ihnen beim Ausfüllen des Formulars für Ihre Gebäude-Energieberatung.

Das Formular ist jetzt bereit und enthält Hinweise zu jedem Feld. Bei schwierigen Feldern (markiert mit ⚠️) können Sie mich gerne um detaillierte Hilfe bitten.

**Ihr Szenario:**   Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23. 
  Es hat eine Rotklinkerfassade und 10 Wohneinheiten. Sie planen eine <strong>WDVS-Sanierung</strong> 
  und müssen für Mieterin Miriam (EG rechts, 57,5m²) die Mieterhöhung berechnen.

Beginnen Sie einfach mit dem Ausfüllen und fragen Sie bei Unsicherheiten!`,
        timestamp: new Date()
      }])
      
      setIsFormGenerated(true)
    } catch (error) {
      console.error('Error generating instructions:', error)
      setChatHistory([{
        role: 'assistant',
        message: 'Entschuldigung, es gab einen Fehler beim Generieren der Anweisungen. Das Formular ist trotzdem verfügbar.',
        timestamp: new Date()
      }])
      setIsFormGenerated(true)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleChatMessage = async () => {
    if (!chatMessage.trim()) return
    
    setIsChatLoading(true)
    const userMsg = chatMessage
    setChatMessage('')
    
    // Add user message
    setChatHistory(prev => [...prev, {
      role: 'user',
      message: userMsg,
      timestamp: new Date()
    }])
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          context: 'Siedlungsstraße 23, Großstadt: 10 WE, Rotklinkerfassade 1965, WDVS-Sanierung Mieter EG'
        })
      })
      
      if (!response.ok) throw new Error('Chat request failed')
      
      const data = await response.json()
      setChatHistory(prev => [...prev, {
        role: 'assistant', 
        message: data.response,
        timestamp: new Date()
      }])
      
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        message: 'Entschuldigung, der Chat-Service ist momentan nicht verfügbar.',
        timestamp: new Date()
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // DEBUG LOGGING
  console.log('🐛 DEBUG VariantA handleSubmit:', {
    step,
    isStudy,
    participantId,
    variant,
    searchParams: Object.fromEntries(searchParams.entries())
  })
  
  try {
    // Validate required fields
    const missingFields = formFields
      .filter(field => field.required && !formValues[field.id]?.trim())
      .map(field => field.label)
    
    if (missingFields.length > 0) {
      alert(`Bitte füllen Sie folgende Pflichtfelder aus: ${missingFields.join(', ')}`)
      return
    }
    
    // Save data
    const formData = {
      variant: 'A',
      participantId: participantId,
      formValues: formValues,
      chatHistory: chatHistory,
      timestamp: new Date().toISOString(),
      metadata: {
        completion_rate: calculateCompletionRate(),
        total_fields: formFields.length,
        filled_fields: Object.keys(formValues).filter(key => formValues[key]?.trim()).length
      }
    }
    
    const response = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    
    if (!response.ok) throw new Error('Save failed')
    
    if (isStudy) {
      // NAVIGATION LOGIC WITH DEBUG
      const nextStep = step === '2' ? 'variant1_survey' : 'variant2_survey'
      
      console.log('🔄 DEBUG VariantA Navigation:', {
        currentStep: step,
        nextStep,
        participantId,
        url: `/study?step=${nextStep}&participant=${participantId}`
      })
      
      router.push(`/study?step=${nextStep}&participant=${participantId}`)
    } else {
      alert('Daten erfolgreich gespeichert!')
      if (onComplete) onComplete(formData)
    }
    
  } catch (error) {
    console.error('❌ VariantA Save error:', error)
    alert('Fehler beim Speichern. Versuchen Sie es erneut.')
  }
}


  const calculateCompletionRate = () => {
    const totalFields = formFields.length
    const filledFields = Object.keys(formValues).filter(key => formValues[key]?.trim()).length
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
  }

  const renderFormField = (field: FormField) => {
    const value = formValues[field.id] || ''
    const isHard = field.difficulty === 'hard'
    
    const commonProps = {
      id: field.id,
      value: value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        setFormValues(prev => ({ ...prev, [field.id]: e.target.value })),
      className: `w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
        field.required && !value.trim() ? 'border-red-300' : ''
      }`,
      required: field.required
    }

    return (
      <div key={field.id} className="mb-6">
        <div className="flex items-center space-x-2 mb-2">
          <Label htmlFor={field.id} className="text-sm font-medium text-gray-700">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          {isHard && <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
            ⚠️ Komplex
          </Badge>}
        </div>
        
        {/* Hint */}
        <div className="bg-blue-50 p-3 rounded-lg mb-3 text-sm text-blue-800 border border-blue-200">
          <div className="flex items-start space-x-2">
            <Lightbulb className="w-4 h-4 mt-0.5 text-blue-600" />
            <span>{field.hint}</span>
          </div>
        </div>

        {/* Field */}
        {field.type === 'select' ? (
          <select {...commonProps}>
            <option value="">{field.placeholder}</option>
            {field.options?.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'textarea' ? (
          <Textarea 
            {...commonProps}
            rows={4}
            placeholder={field.placeholder}
          />
        ) : (
          <Input 
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
          />
        )}
      </div>
    )
  }

  if (!isFormGenerated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {isStudy && (
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-blue-600 mb-2">Variante A: Sichtbares Formular</h1>
              <p className="text-gray-600">Alle Felder sind sichtbar, KI-Chat verfügbar</p>
              {participantId && (
                <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
              )}
              <div className="mt-2">
                <Badge variant="outline" className="text-blue-600">
                  {step === '2' ? 'Erste Variante' : 'Zweite Variante'}
                </Badge>
              </div>
            </div>
          )}

          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-center">🏢 Gebäude-Energieberatung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Ihr Szenario</h3>
                <p className="text-blue-900 mb-3">
                  Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23. 
                  Es hat eine Rotklinkerfassade und 10 Wohneinheiten. Sie planen eine <strong>WDVS-Sanierung</strong> 
                  und müssen für Mieterin Miriam (EG rechts, 57,5m²) die Mieterhöhung berechnen.
                </p>
                <p className="text-blue-800 text-sm">
                  <strong>Ziel:</strong> Erfassung der Gebäudedaten für eine Energieberatung zur Berechnung 
                  möglicher Mieterhöhungen nach der geplanten Sanierung.
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-3">💡 So funktioniert Variante A</h3>
                <ul className="space-y-2 text-green-700">
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Sie sehen alle Formularfelder gleichzeitig</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Jedes Feld hat Ausfüllhinweise</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>Schwierige Felder sind markiert (⚠️)</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-600 mt-1">•</span>
                    <span>KI-Chat-Assistent hilft bei Fragen</span>
                  </li>
                </ul>
              </div>

              <Button 
                onClick={generateFormInstructions}
                disabled={isGenerating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Formular wird vorbereitet...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Formular starten & KI-Hilfe aktivieren
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
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
            {participantId && (
              <Badge variant="outline" className="mt-2">Teilnehmer: {participantId}</Badge>
            )}
            <div className="mt-2">
              <Badge variant="outline" className="text-blue-600">
                {step === '2' ? 'Erste Variante' : 'Zweite Variante'}
              </Badge>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Formular */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">📋 Gebäude-Energieberatung Formular</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    {calculateCompletionRate()}% ausgefüllt
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  {formFields.map(field => renderFormField(field))}

                  <div className="flex items-center space-x-4 pt-6 border-t">
                    <Button 
                      type="submit"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {isStudy ? 'Daten speichern & weiter' : 'Formular speichern'}
                    </Button>
                    {isStudy && (
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const nextStep = step === '2' ? 'variant1_survey' : 'variant2_survey'
                          router.push(`/study?step=${nextStep}&participant=${participantId}`)
                        }}
                      >
                        Überspringen
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Chat */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                  KI-Assistent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Chat History */}
                  <div className="h-96 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg">
                    {chatHistory.map((msg, index) => (
                      <div key={index} className={`p-3 rounded-lg ${
                        msg.role === 'user' 
                          ? 'bg-blue-100 text-blue-900 ml-4' 
                          : 'bg-white text-gray-800 mr-4 border'
                      }`}>
                        <div className="text-sm whitespace-pre-wrap">{msg.message}</div>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="bg-white p-3 rounded-lg mr-4 border">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-gray-500">Assistent antwortet...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="space-y-2">
                    <Textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Fragen Sie den Assistenten..."
                      rows={2}
                      className="resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleChatMessage()
                        }
                      }}
                    />
                    <Button 
                      onClick={handleChatMessage}
                      disabled={!chatMessage.trim() || isChatLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Frage stellen
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded border">
                    💡 <strong>Tipp:</strong> Fragen Sie z.B. "Wie berechne ich die Fassadenfläche?" 
                    oder "Was bedeutet WDVS?"
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}