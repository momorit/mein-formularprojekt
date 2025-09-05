import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-3">FormularIQ Übersicht</h1>
          <p className="text-lg text-gray-600">
            Wählen Sie, wie Sie starten möchten: gesamte Studie oder direkt eine Variante.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Studie starten */}
          <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">🔬 Studie</h2>
              <p className="text-gray-600 text-sm mb-4">
                Vollständiger Ablauf mit Demografie, beiden Varianten (randomisierte Reihenfolge) und Fragebögen.
              </p>
            </div>
            <Link
              href="/study"
              className="inline-block text-center w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg"
            >
              Studie starten →
            </Link>
          </div>

          {/* Variante A */}
          <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-green-800 mb-2">📋 Variante A</h2>
              <p className="text-gray-600 text-sm mb-4">
                Sichtbares Formular mit KI-Hilfestellung bei Bedarf. Start außerhalb des Studienablaufs.
              </p>
            </div>
            <Link
              href="/form-a"
              className="inline-block text-center w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg"
            >
              Variante A starten →
            </Link>
          </div>

          {/* Variante B */}
          <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-purple-800 mb-2">💬 Variante B</h2>
              <p className="text-gray-600 text-sm mb-4">
                Dialog-basiertes System mit konversationeller Datenerfassung. Start außerhalb des Studienablaufs.
              </p>
            </div>
            <Link
              href="/form-b"
              className="inline-block text-center w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-lg"
            >
              Variante B starten →
            </Link>
          </div>
        </div>

        <div className="text-center text-xs text-gray-500 mt-8">
          HAW Hamburg · Forschungsprojekt „LLM‑gestützte Formularbearbeitung“
        </div>
      </div>
    </div>
  )
}
