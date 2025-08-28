import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function VariantsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Varianten testen</h1>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/form-a">Variante A</Link>
          </Button>
          <Button asChild>
            <Link href="/form-b">Variante B</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
