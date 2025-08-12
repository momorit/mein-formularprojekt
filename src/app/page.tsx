// src/app/page.tsx - OPTIMIERTE STARTSEITE (REDIRECT zu /study)

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Automatische Weiterleitung zur Studie
    router.push('/study')
  }, [router])

  // Loading-Anzeige während der Weiterleitung
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">FormularIQ wird gestartet...</h2>
        <p className="text-gray-600">Sie werden zur Studie weitergeleitet</p>
      </div>
    </div>
  )
}