'use client'

import { Suspense } from 'react'
import VariantA from '@/components/VariantA'

function FormAContent() {
  return (
    <VariantA 
      startTime={new Date()}
      onComplete={(data) => {
        console.log('Form A completed:', data)
      }}
    />
  )
}

export default function FormAPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Formular wird geladen...</p>
        </div>
      </div>
    }>
      <FormAContent />
    </Suspense>
  )
}