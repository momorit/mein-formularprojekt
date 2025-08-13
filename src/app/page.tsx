'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            FormularIQ Studie
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Willkommen zu unserer Forschungsstudie über KI-gestützte Formularsysteme. 
            Sie werden zwei verschiedene Ansätze zur Gebäude-Energieberatung testen.
          </p>
        </div>

        {/* Fortschrittsanzeige */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold">
                1
              </div>
              <div className="ml-3">
                <p className="font-medium">Variante A</p>
                <p className="text-sm text-gray-500">Sichtbares Formular</p>
              </div>
            </div>
            
            <div className="flex-1 h-1 bg-gray-200 mx-4">
              <div className="h-1 bg-blue-500 w-0 transition-all duration-300"></div>
            </div>
            
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-semibold">
                2
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-500">Variante B</p>
                <p className="text-sm text-gray-400">Dialog-System</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hauptinhalt */}
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            
            {/* Variante A Card */}
            <Card className="relative overflow-hidden border-2 hover:border-blue-500 transition-colors">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Variante A</Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-2xl text-blue-600">
                  📋 Sichtbares Formular
                </CardTitle>
                <CardDescription className="text-lg">
                  Klassisches Formular mit KI-Chat-Unterstützung
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Alle Felder auf einen Blick</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>KI-Chat für Hilfestellungen</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Flexible Bearbeitung</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Geschätzte Dauer:</strong> 5-10 Minuten
                  </p>
                </div>
              </CardContent>
              
              <CardFooter>
                <Link href="/form-a" className="w-full">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Variante A starten
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Variante B Card */}
            <Card className="relative overflow-hidden border-2 hover:border-green-500 transition-colors">
              <div className="absolute top-4 right-4">
                <Badge variant="secondary">Variante B</Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-2xl text-green-600">
                  💬 Dialog-System
                </CardTitle>
                <CardDescription className="text-lg">
                  Interaktives Gespräch mit KI-Assistent
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Schritt-für-Schritt Dialog</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Persönliche KI-Beratung</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Geführte Bearbeitung</span>
                  </div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>Geschätzte Dauer:</strong> 5-10 Minuten
                  </p>
                </div>
              </CardContent>
              
              <CardFooter>
                <Link href="/form-b" className="w-full">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    Variante B starten
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>

          {/* Informationsbereich */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-xl">📋 Studieninformationen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Ablauf der Studie:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                    <li>Testen Sie beide Varianten (beliebige Reihenfolge)</li>
                    <li>Füllen Sie jeweils ein Gebäude-Energieberatung Formular aus</li>
                    <li>Ihre Daten werden automatisch anonymisiert gespeichert</li>
                    <li>Optional: Kurzer Vergleich der beiden Ansätze</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Wichtige Hinweise:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    <li>Alle Daten werden anonymisiert behandelt</li>
                    <li>Die Teilnahme ist freiwillig</li>
                    <li>Sie können jederzeit abbrechen</li>
                    <li>Bei Fragen nutzen Sie die Hilfe-Funktionen</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}