// src/components/VariantA.tsx - REPARIERTE VERSION
'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { MessageCircle, Save, RefreshCw } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface VariantAProps {
  onDataCollected: (data: any) => void
}

export default function VariantA({ onDataCollected }: VariantAProps) {
  const [context, setContext] = useState('')
  const [instructions, setInstructions] = useState<string[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{role: string, message: string}>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isChatLoading, setIsChatLoading] = useState(false)

  const generateInitialInstructions = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.generateInstructions(context)
      
      if (response.instructions && Array.isArray(response.instructions)) {
        setInstructions(response.instructions)
        
        // Initialize form values
        const initialValues: Record<string, string> = {}
        response.instructions.forEach((_: string, index: number) => {
          initialValues[`field_${index}`] = ''
        })
        setFormValues(initialValues)
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error) {
      console.error('Failed to generate instructions:', error)
      // Fallback instructions
      const fallbackInstructions = [
        "Geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Reihenhaus)",
        "In welchem Jahr wurde das Gebäude errichtet?",
        "Wie groß ist die Wohnfläche in Quadratmetern?",
        "Welche Art der Heizung ist installiert?",
        "Beschreiben Sie den Dämmzustand des Gebäudes",
        "Welcher Fenstertyp ist installiert?",
        "Welche Renovierungsmaßnahmen sind geplant?",
        "Wie hoch ist Ihr Budget für die Sanierung?"
      ]
      setInstructions(fallbackInstructions)
      
      const initialValues: Record<string, string> = {}
      fallbackInstructions.forEach((_, index) => {
        initialValues[`field_${index}`] = ''
      })
      setFormValues(initialValues)
    } finally {
      setIsLoading(false)
    }
  }, [context])

  useEffect(() => {
    generateInitialInstructions()
  }, [generateInitialInstructions])

  const handleInputChange = (field: string, value: string) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleChat = async () => {
    if (!chatMessage.trim()) return

    try {
      setIsChatLoading(true)
      setChatHistory(prev => [...prev, { role: 'user', message: chatMessage }])
      
      const response = await apiClient.getChatHelp(chatMessage, context)
      
      setChatHistory(prev => [...prev, { role: 'assistant', message: response.response || response }])
      setChatMessage('')
    } catch (error) {
      console.error('Chat error:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        message: 'Entschuldigung, der Chat-Service ist momentan nicht verfügbar.' 
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      
      const data = {
        variant: 'A',
        instructions,
        values: formValues,
        chatHistory,
        timestamp: new Date().toISOString(),
        completionRate: calculateCompletionRate()
      }

      await apiClient.saveFormData(instructions, formValues)
      onDataCollected(data)
      
      alert('Daten erfolgreich gespeichert!')
    } catch (error) {
      console.error('Save error:', error)
      alert('Fehler beim Speichern. Versuchen Sie es erneut.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCompletionRate = () => {
    const totalFields = instructions.length
    const filledFields = Object.values(formValues).filter(value => value.trim()).length
    return totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Variante A: Sichtbares Formular</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="context">Kontext (optional)</Label>
            <Textarea
              id="context"
              placeholder="Beschreiben Sie Ihr Gebäude oder geben Sie zusätzliche Informationen an..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="mt-1"
            />
          </div>
          
          <Button 
            onClick={generateInitialInstructions}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
            Anweisungen {instructions.length > 0 ? 'neu ' : ''}generieren
          </Button>
        </CardContent>
      </Card>

      {instructions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Formular ausfüllen</CardTitle>
            <p className="text-sm text-gray-600">
              Fortschritt: {calculateCompletionRate()}% ({Object.values(formValues).filter(v => v.trim()).length}/{instructions.length} Felder)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructions.map((instruction, index) => (
              <div key={index}>
                <Label htmlFor={`field_${index}`}>{instruction}</Label>
                <Input
                  id={`field_${index}`}
                  value={formValues[`field_${index}`] || ''}
                  onChange={(e) => handleInputChange(`field_${index}`, e.target.value)}
                  className="mt-1"
                  placeholder="Ihre Antwort..."
                />
              </div>
            ))}
            
            <Button onClick={handleSave} disabled={isLoading} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Daten speichern
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Chat-Hilfe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-40 overflow-y-auto border rounded p-3 bg-gray-50">
            {chatHistory.length === 0 ? (
              <p className="text-gray-500 text-sm">Stellen Sie Fragen zum Formular...</p>
            ) : (
              chatHistory.map((msg, index) => (
                <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-block p-2 rounded text-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-800'
                  }`}>
                    {msg.message}
                  </span>
                </div>
              ))
            )}
          </div>
          
          <div className="flex gap-2">
            <Input
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Ihre Frage..."
              onKeyPress={(e) => e.key === 'Enter' && handleChat()}
            />
            <Button onClick={handleChat} disabled={isChatLoading}>
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}