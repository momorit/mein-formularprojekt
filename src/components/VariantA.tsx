// src/components/VariantA.tsx - UPDATED: Ohne Überspringen, mit Szenario, angepasste Fragen
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Save, Send, Play, CheckCircle, Lightbulb, Home } from 'lucide-react'

interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'textarea'
  placeholder: string
  hint: string
  difficulty: 'easy' | 'hard'
  required: boolean
  options?: string[]
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
  const [isFormGenerated, setIsFormGenerated] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formFields, setFormFields] = useState<FormField[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatMessage, setChatMessage] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!isFormGenerated && !isGenerating) {
      generateFormFields()
    }
  }, [isFormGenerated, isGenerating])

  // Predefined optimized form fields - most are easy, one is hard
  const generateFormFields = async () => {
    setIsGenerating(true)
    
    try {
      // Predefined fields optimized for the scenario
      const predefinedFields: FormField[] = [
        {
          id: 'building_year',
          label: 'Baujahr des Gebäudes',
          type: 'number',
          placeholder: '1965',
          hint: 'Laut Szenario: Baujahr 1965',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'total_units',
          label: 'Anzahl Wohneinheiten',
          type: 'number',
          placeholder: '10',
          hint: 'Laut Szenario: 10 Wohneinheiten',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'total_living_space',
          label: 'Gesamte Wohnfläche (m²)',
          type: 'number',
          placeholder: '634',
          hint: 'Laut Szenario: 634m² Wohnfläche',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'building_address',
          label: 'Gebäudeadresse',
          type: 'text',
          placeholder: 'Siedlungsstraße 23, Großstadt',
          hint: 'Laut Szenario: Siedlungsstraße 23, Großstadt',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'insulation_system',
          label: 'Geplantes Dämmsystem',
          type: 'select',
          placeholder: 'Bitte wählen',
          hint: 'Laut Szenario: WDVS mit 140mm Mineralwolle',
          difficulty: 'easy',
          required: true,
          options: ['WDVS mit Mineralwolle', 'WDVS mit Polystyrol', 'Vorhangfassade', 'Innendämmung']
        },
        {
          id: 'insulation_thickness',
          label: 'Dämmstärke (mm)',
          type: 'number',
          placeholder: '140',
          hint: 'Laut Szenario: 140mm Mineralwolle-Dämmung',
          difficulty: 'easy',
          required: true
        },
        {
          id: 'detailed_energy_analysis',
          label: 'Detaillierte energetische Bewertung und Berechnung der erwarteten Energieeinsparungen',
          type: 'textarea',
          placeholder: 'Bitte beschreiben Sie die erwarteten U-Werte vor/nach Sanierung, Primärenergiebedarf, CO2-Einsparungen und Wirtschaftlichkeitsberechnung...',
          hint: '⚠️ Komplex: Hier ist eine detaillierte Analyse nötig. Schätzen Sie die energetischen Verbesserungen und fragen Sie bei Unsicherheiten nach!',
          difficulty: 'hard',
          required: true
        }
      ]
      
      setFormFields(predefinedFields)
      
      // Welcome message
      setChatHistory([{
        role: 'assistant',
        message: `Ich helfe Ihnen beim Ausfüllen des Formulars für Ihre Gebäude-Energieberatung.

Das Formular ist jetzt bereit und enthält Hinweise zu jedem Feld. Bei schwierigen Feldern (markiert mit ⚠️) können Sie mich gerne um detaillierte Hilfe bitten.

**Ihr Szenario:** Mehrfamilienhaus, Baujahr 1965, Siedlungsstraße 23 in Großstadt. Sie planen eine Fassadendämmung mit WDVS (140mm Mineralwolle).

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
          context: 'Mehrfamilienhaus Baujahr 1965, WDVS-Sanierung' 
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
        message: 'Entschuldigung, der Chat-Service ist momentan nicht verfügbar. Versuchen Sie es später erneut.',
        timestamp: new Date()
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const formData = {
        variant: 'A',
        participantId: participantId,
        instructions: formFields,
        values: formValues,
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
        // Navigation to next step
        const nextStep = step === '2' ? 'variant1_survey' : 'variant2_survey'
        router.push(`/study?step=${nextStep}&participant=${participantId}`)
      } else {
        alert('Daten erfolgreich gespeichert!')
        if (onComplete) onComplete(formData)
      }
      
    } catch (error) {
      console.error('Save error:', error)
      alert('Fehler beim Speichern. Versuchen Sie es erneut.')
    } finally {
      setIsSaving(false)
    }
  }

  const calculateCompletionRate = () => {
    const totalFields = formFields.length
    const filledFields = Object.keys(formValues).filter(key => formValues[key]?.trim()).length
    return totalFields > 0 ? (filledFields / totalFields) * 100 : 0
  }

  const renderField = (field: FormField) => {
    const isHard = field.difficulty === 'hard'
    const commonProps = {
      id: field.id,
      value: formValues[field.id] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        setFormValues(prev => ({ ...prev, [field.id]: e.target.value })),
      className: `w-full p-3 border rounded-lg transition-colors ${
        formValues[field.id] && formValues[field.id].trim() 
          ? 'border-green-300 bg-green-50' 
          : isHard && field.required 
            ? 'border-orange-300' 
            : 'border-gray-300'
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
                  Sie besitzen ein <strong>Mehrfamilienhaus (Baujahr 1965)</strong> in der Siedlungsstraße 23, Großstadt. 
                  Das Gebäude hat 10 Wohneinheiten mit 634m² Wohnfläche.
                </p>
                <p className="text-blue-900">
                  Sie planen eine <strong>energetische Modernisierung der Fassade mit WDVS</strong> (140mm Mineralwolle) 
                  und benötigen eine Energieberatung für die Mieterhöhungsberechnung.
                </p>
              </div>

              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Formular wird vorbereitet...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
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

        {/* Scenario Display - Always visible */}
        <div className="mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <Home className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="text-lg font-semibold text-green-800">🏢 Ihr Szenario</h3>
                </div>
                <p className="text-green-900 text-sm">
                  <strong>Mehrfamilienhaus, Baujahr 1965</strong> • Siedlungsstraße 23, Großstadt • 
                  <strong>10 Wohneinheiten, 634m² Wohnfläche</strong> • 
                  Geplante Sanierung: <strong>WDVS mit 140mm Mineralwolle</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">🏢 Gebäude-Energieberatung Formular</CardTitle>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Ausgefüllt: {Object.keys(formValues).filter(key => formValues[key]?.trim()).length} von {formFields.length} Feldern
                  </p>
                  <Badge variant="outline" className="text-blue-600">
                    {Math.round(calculateCompletionRate())}% vollständig
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  {formFields.map(renderField)}
                  
                  <div className="flex flex-col space-y-3 pt-6 border-t">
                    <Button 
                      type="submit"
                      disabled={isSaving}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    >
                      {isSaving ? (
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Speichert...
                        </div>
                      ) : (
                        <>
                          <Save className="w-5 h-5 mr-2" />
                          {isStudy ? 'Daten speichern & weiter' : 'Formular speichern'}
                        </>
                      )}
                    </Button>
                    {/* REMOVED: Überspringen Button */}
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
                          : 'bg-white text-gray-800 mr-4'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                        <span className="text-xs text-gray-500 mt-1 block">
                          {msg.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {isChatLoading && (
                      <div className="bg-white text-gray-800 mr-4 p-3 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm">KI denkt nach...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat Input */}
                  <div className="flex space-x-2">
                    <Textarea
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      placeholder="Fragen Sie die KI... (oder '?' für Hilfe)"
                      className="flex-1 min-h-[60px] max-h-[120px]"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleChatMessage()
                        }
                      }}
                    />
                    <Button 
                      onClick={handleChatMessage}
                      disabled={isChatLoading || !chatMessage.trim()}
                      className="bg-blue-600 hover:bg-blue-700 px-4"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="text-xs text-gray-500 space-y-1">
                    <p>💡 <strong>Tipp:</strong> "?" für kontextuelle Hilfe</p>
                    <p>⌨️ <strong>Enter:</strong> Senden, <strong>Shift+Enter:</strong> Neue Zeile</p>
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