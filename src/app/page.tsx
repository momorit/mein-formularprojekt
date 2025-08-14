'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to study page immediately
    router.push('/study')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-6"></div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">FormularIQ Studie</h1>
        <p className="text-lg text-gray-600">Studie wird geladen...</p>
        <p className="text-sm text-gray-500 mt-2">Sie werden automatisch zur Studie weitergeleitet.</p>
      </div>
    </div>
  )
}