'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function HomePage() {
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
            <div className="relative overflow-hidden border-2 bg-white rounded-lg shadow-lg hover:border-blue-500 transition-colors">
              <div className="absolute top-4 right-4">
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Variante A
                </span>
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">
                  📋 Sichtbares Formular
                </h3>
                <p className="text-lg text-gray-600 mb-4">
                  Klassisches Formular mit KI-Chat-Unterstützung
                </p>
                
                <div className="space-y-3 mb-6">
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
                
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Geschätzte Dauer:</strong> 5-10 Minuten
                  </p>
                </div>
                
                <Link href="/form-a" className="w-full">
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                    Variante A starten
                  </button>
                </Link>
              </div>
            </div>

            {/* Variante B Card */}
            <div className="relative overflow-hidden border-2 bg-white rounded-lg shadow-lg hover:border-green-500 transition-colors">
              <div className="absolute top-4 right-4">
                <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                  Variante B
                </span>
              </div>
              
              <div className="p-6">
                <h3 className="text-2xl font-bold text-green-600 mb-2">
                  💬 Dialog-System
                </h3>
                <p className="text-lg text-gray-600 mb-4">
                  Interaktives Gespräch mit KI-Assistent
                </p>
                
                <div className="space-y-3 mb-6">
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
                
                <div className="bg-green-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-green-800">
                    <strong>Geschätzte Dauer:</strong> 5-10 Minuten
                  </p>
                </div>
                
                <Link href="/form-b" className="w-full">
                  <button className="w-full bg-green-600 hover:green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors">
                    Variante B starten
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Informationsbereich */}
          <div className="bg-gray-50 rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Studieninformationen</h3>
            
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
          </div>
        </div>
      </div>
    </div>
  )
}