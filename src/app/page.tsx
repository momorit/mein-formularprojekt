'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { checkSystemStatus } from '@/lib/api'

export default function HomePage() {
  const [systemStatus, setSystemStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    checkSystemStatus().then(status => {
      setSystemStatus(status ? 'online' : 'offline')
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header Section */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">FormularIQ</h1>
                <p className="text-sm text-gray-500">LLM-gestützte Formularbearbeitung</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  systemStatus === 'online' ? 'bg-green-500' : 
                  systemStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                }`}></div>
                <span className="text-gray-600">
                  {systemStatus === 'checking' ? 'Prüfe System...' :
                   systemStatus === 'online' ? 'System online' : 'System offline'}
                </span>
              </div>
              <div className="text-gray-400">•</div>
              <span className="text-gray-600">HAW Hamburg</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Wissenschaftliche Studie
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            FormularIQ
          </h1>
          
          <p className="text-2xl text-gray-600 mb-4 max-w-4xl mx-auto">
            Vergleichsstudie zur LLM-gestützten Formularbearbeitung
          </p>
          
          <p className="text-lg text-gray-500 max-w-3xl mx-auto">
            Diese Studie untersucht die Benutzerfreundlichkeit verschiedener Ansätze 
            zur intelligenten Formularbearbeitung mit Large Language Models.
          </p>
        </div>

        {/* Study Information */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Studiendesign</h3>
            <p className="text-gray-600 mb-4">
              Vergleich zweier Interaktionsansätze zur Formularbearbeitung mit KI-Unterstützung.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Within-Subject-Design</li>
              <li>• Randomisierte Reihenfolge</li>
              <li>• Quantitative Messung</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Datenerfassung</h3>
            <p className="text-gray-600 mb-4">
              Automatische Speicherung aller Interaktionen und Nutzungsdaten für die Analyse.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• DSGVO-konform</li>
              <li>• Anonymisierte Daten</li>
              <li>• Sichere Cloud-Speicherung</li>
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Technologie</h3>
            <p className="text-gray-600 mb-4">
              Modernste LLM-Technologie (LLaMA3) für intelligente Formularunterstützung.
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Natural Language Processing</li>
              <li>• Kontextbewusstes System</li>
              <li>• Real-time Interaktion</li>
            </ul>
          </div>
        </div>

        {/* Variants Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Zwei Varianten im Vergleich
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Testen Sie beide Ansätze zur Formularbearbeitung und bewerten Sie deren Benutzerfreundlichkeit.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Variant A */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 group hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">A</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Sichtbares Formular</h3>
                      <p className="text-blue-100">Klassischer Ansatz mit KI-Chat</p>
                    </div>
                  </div>
                </div>
                <p className="text-blue-100 leading-relaxed">
                  Traditionelle Formularansicht mit allen Feldern sichtbar und einem 
                  integrierten KI-Assistenten für Hilfestellungen.
                </p>
              </div>
              
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Vollständige Übersicht</p>
                      <p className="text-sm text-gray-500">Alle Formularfelder auf einen Blick</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">KI-Chat-Unterstützung</p>
                      <p className="text-sm text-gray-500">Hilfe zu spezifischen Feldern</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Flexible Bearbeitung</p>
                      <p className="text-sm text-gray-500">Felder in beliebiger Reihenfolge</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/form-a"
                  className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl hover:bg-blue-700 transition-colors text-lg font-medium flex items-center justify-center group-hover:bg-blue-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Variante A starten
                </Link>
              </div>
            </div>

            {/* Variant B */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 group hover:shadow-2xl transition-all duration-300">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-xl">B</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">Dialog-System</h3>
                      <p className="text-green-100">Konversationeller Ansatz</p>
                    </div>
                  </div>
                </div>
                <p className="text-green-100 leading-relaxed">
                  Interaktive Datenerfassung durch natürlichen Dialog mit einem 
                  KI-System, das durch den Prozess führt.
                </p>
              </div>
              
              <div className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Geführte Interaktion</p>
                      <p className="text-sm text-gray-500">Schritt-für-Schritt durch den Dialog</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Natürliche Sprache</p>
                      <p className="text-sm text-gray-500">Antworten in eigenen Worten</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Kontextuelle Hilfe</p>
                      <p className="text-sm text-gray-500">Spezifische Unterstützung pro Frage</p>
                    </div>
                  </div>
                </div>

                <Link
                  href="/form-b"
                  className="w-full bg-green-600 text-white py-4 px-6 rounded-xl hover:bg-green-700 transition-colors text-lg font-medium flex items-center justify-center group-hover:bg-green-700"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.017 8.017 0 01-6.1-2.9L3 21l3.9-3.9A8.017 8.017 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                  </svg>
                  Variante B starten
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-12 text-center text-white mb-16">
          <h2 className="text-3xl font-bold mb-6">Teilnahmeanleitung</h2>
          <div className="grid md:grid-cols-4 gap-8 text-left">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Vorbereitung</h3>
              <p className="text-gray-300 text-sm">Stellen Sie sich vor, Sie erfassen Gebäudedaten für eine energetische Sanierung</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Beide Varianten</h3>
              <p className="text-gray-300 text-sm">Testen Sie beide Ansätze in beliebiger Reihenfolge</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Datenerfassung</h3>
              <p className="text-gray-300 text-sm">Ihre Eingaben werden automatisch und anonym gespeichert</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center mb-4">
                <span className="text-xl font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Abschluss</h3>
              <p className="text-gray-300 text-sm">Bewerten Sie die Benutzerfreundlichkeit beider Systeme</p>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Systemanforderungen & Datenschutz</h3>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Technische Voraussetzungen</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Moderner Webbrowser (Chrome, Firefox, Safari)</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Stabile Internetverbindung</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Desktop oder Tablet (empfohlen)</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>Etwa 15-20 Minuten Zeit</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Datenschutz & Privatsphäre</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center"><svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Vollständig anonymisierte Datensammlung</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>DSGVO-konforme Speicherung</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Verwendung nur für wissenschaftliche Zwecke</li>
                <li className="flex items-center"><svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Jederzeit Studienabbruch möglich</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FormularIQ Studie</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Wissenschaftliche Untersuchung zur Benutzerfreundlichkeit von 
                LLM-gestützten Formularsystemen im Rahmen einer Masterarbeit.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Institution</h3>
              <div className="text-gray-400 text-sm space-y-1">
                <p>HAW Hamburg</p>
                <p>Department Informatik</p>
                <p>Fakultät Technik und Informatik</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Kontakt</h3>
              <div className="text-gray-400 text-sm space-y-1">
                <p>Betreuer: Prof. Dr. [Name]</p>
                <p>Student: Moritz Treu</p>
                <p>Semester: WiSe 2024/25</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2024 HAW Hamburg - FormularIQ Studie. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}