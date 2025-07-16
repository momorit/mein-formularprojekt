"use client"

import Link from "next/link"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vereinfachte Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">FormularIQ</h1>
                <p className="text-sm text-gray-500">Intelligente Gebäudeerfassung</p>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              HAW Hamburg • Projekt 2
            </div>
          </div>
        </div>
      </nav>

      {/* Hauptbereich */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section - Vereinfacht */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
            KI-gestützte Formularbearbeitung
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gebäudeformulare
            <span className="block text-blue-600">neu gedacht</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Zwei innovative Ansätze für effiziente Gebäudedatenerfassung mit Large Language Models.
          </p>
        </div>

        {/* Varianten Grid - Cleaner Design */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {/* Variante A */}
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">A</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">Sichtbares Formular</CardTitle>
                    <p className="text-sm text-gray-500">Traditioneller Ansatz</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-6">
                KI generiert ein traditionelles Formular mit sichtbaren Feldern. 
                Ideal für strukturierte Erfassung mit Übersicht aller Felder.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Vollständige Übersicht
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  KI-Hilfe per Chat
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Fortschrittsanzeige
                </div>
              </div>

              <Link href="/form-a" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Variante A starten
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                  </svg>
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Variante B */}
          <Card className="bg-white border border-gray-200 hover:shadow-lg transition-all duration-300 group">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">B</span>
                  </div>
                  <div>
                    <CardTitle className="text-xl text-gray-900">Dialog-basiert</CardTitle>
                    <p className="text-sm text-gray-500">Innovativer Ansatz</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-gray-600 mb-6">
                Konversationelle Formularerfassung durch natürlichen Dialog. 
                Die KI führt Schritt für Schritt durch den Prozess.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Geführter Dialog
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Natürliche Konversation
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Rückfragen möglich
                </div>
              </div>

              <Link href="/form-b" className="block">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Variante B starten
                  <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"/>
                  </svg>
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Forschungsinfo - Reduziert */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z"/>
            </svg>
          </div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-3">
            Forschungsprojekt: Interaktionsformen bei der Formularbearbeitung
          </h3>
          <p className="text-gray-600 max-w-3xl mx-auto">
            Diese Anwendung untersucht verschiedene Ansätze der Mensch-KI-Interaktion bei komplexen Formularen. 
            Beide Varianten werden hinsichtlich Benutzerfreundlichkeit und Effizienz wissenschaftlich evaluiert.
          </p>
        </div>
      </main>
    </div>
  )
}