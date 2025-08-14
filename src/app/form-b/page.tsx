'use client'

import { Suspense } from 'react'
import VariantB from '@/components/VariantB'

function FormBContent() {
  return (
    <VariantB 
      startTime={new Date()}
      onComplete={(data) => {
        console.log('Form B completed:', data)
      }}
    />
  )
}

export default function FormBPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Dialog wird geladen...</p>
        </div>
      </div>
    }>
      <FormBContent />
    </Suspense>
  )
}