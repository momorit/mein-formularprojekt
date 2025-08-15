// src/app/api/debug/llm/route.ts - Debug-Endpoint
import { NextRequest, NextResponse } from 'next/server'
import { callLLM } from '@/lib/llm'

export async function GET() {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    environment: {
      groq_api_key_exists: !!process.env.GROQ_API_KEY,
      groq_api_key_length: process.env.GROQ_API_KEY?.length || 0,
      groq_api_key_prefix: process.env.GROQ_API_KEY?.slice(0, 10) + '...' || 'undefined',
      node_env: process.env.NODE_ENV
    },
    tests: [] as Array<{test: string, status: string, result?: any, error?: string}>
  }

  // Test 1: Environment Check
  if (!process.env.GROQ_API_KEY) {
    debugInfo.tests.push({
      test: 'groq_api_key',
      status: 'FAIL',
      error: 'GROQ_API_KEY environment variable not set'
    })
    return NextResponse.json(debugInfo)
  }

  debugInfo.tests.push({
    test: 'groq_api_key',
    status: 'PASS',
    result: 'API key is present'
  })

  // Test 2: Simple LLM Call
  try {
    const simpleResponse = await callLLM(
      'Antworte nur mit "TEST_SUCCESSFUL" wenn du mich verstehst.',
      '',
      false
    )
    
    debugInfo.tests.push({
      test: 'simple_llm_call',
      status: 'PASS',
      result: simpleResponse
    })
  } catch (error) {
    debugInfo.tests.push({
      test: 'simple_llm_call',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Test 3: Dialog Mode Call
  try {
    const dialogResponse = await callLLM(
      'Du hilfst bei einer Gebäude-Energieberatung. Stelle eine kurze Testfrage.',
      'Kontext: Mehrfamilienhaus, Baujahr 1965',
      true
    )
    
    debugInfo.tests.push({
      test: 'dialog_mode_call',
      status: 'PASS',
      result: dialogResponse
    })
  } catch (error) {
    debugInfo.tests.push({
      test: 'dialog_mode_call',
      status: 'FAIL',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return NextResponse.json(debugInfo)
}