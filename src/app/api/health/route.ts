import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    services: {
      vercel_api_routes: 'online'
    },
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  })
}