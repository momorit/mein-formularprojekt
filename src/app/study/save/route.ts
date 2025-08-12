// app/api/study/save/route.ts
// NextJS API Route die als Proxy zu deinem FastAPI Backend fungiert

import { NextRequest, NextResponse } from 'next/server';

// Backend URL - passe diese an deine FastAPI Deployment URL an
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: NextRequest) {
    try {
        console.log('📊 NextJS API: Proxying study save request to FastAPI backend...');
        
        // Request Body von Frontend lesen
        const requestBody = await request.json();
        
        console.log('📋 Request data:', {
            participantId: requestBody.participantId,
            hasVariantA: !!requestBody.variantAData,
            hasVariantB: !!requestBody.variantBData,
            hasDemographics: !!requestBody.demographics
        });
        
        // Request an FastAPI Backend weiterleiten
        const backendResponse = await fetch(`${BACKEND_URL}/api/study/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        
        if (!backendResponse.ok) {
            const errorText = await backendResponse.text();
            console.error('❌ Backend Error:', {
                status: backendResponse.status,
                statusText: backendResponse.statusText,
                error: errorText
            });
            
            return NextResponse.json(
                { 
                    error: 'Backend server error', 
                    details: errorText,
                    backendStatus: backendResponse.status 
                },
                { status: 502 }
            );
        }
        
        const responseData = await backendResponse.json();
        console.log('✅ Backend Response Success:', {
            filename: responseData.filename,
            storage: responseData.storage || 'unknown'
        });
        
        return NextResponse.json(responseData);
        
    } catch (error) {
        console.error('💥 NextJS API Error:', error);
        
        return NextResponse.json(
            { 
                error: 'Failed to proxy request to backend',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            },
            { status: 500 }
        );
    }
}

// Für Debugging - GET Request zeigt Status
export async function GET() {
    try {
        const healthCheck = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        if (healthCheck.ok) {
            const healthData = await healthCheck.json();
            return NextResponse.json({
                status: 'NextJS API Route active',
                backend_url: BACKEND_URL,
                backend_health: healthData.status || 'unknown',
                timestamp: new Date().toISOString()
            });
        } else {
            return NextResponse.json({
                status: 'NextJS API Route active',
                backend_url: BACKEND_URL,
                backend_health: 'unreachable',
                backend_status: healthCheck.status,
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        return NextResponse.json({
            status: 'NextJS API Route active',
            backend_url: BACKEND_URL,
            backend_health: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}