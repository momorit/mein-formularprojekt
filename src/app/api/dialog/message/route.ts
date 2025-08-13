// app/api/study/save/route.ts
// Verbesserte NextJS API Route für komplette Studiendaten

import { NextRequest, NextResponse } from 'next/server';

// Backend URL - deine Railway URL
const BACKEND_URL = process.env.BACKEND_URL || 'https://mein-formularprojekt-production.up.railway.app';

export async function POST(request: NextRequest) {
    try {
        console.log('📊 NextJS API: Saving complete study data...');
        
        // Request Body von Frontend lesen
        const requestBody = await request.json();
        
        console.log('📋 Study data overview:', {
            participantId: requestBody.participantId,
            hasVariantA: !!requestBody.variantAData,
            hasVariantB: !!requestBody.variantBData,
            hasDemographics: !!requestBody.demographics,
            hasComparison: !!requestBody.comparisonData,
            totalDuration: requestBody.totalDuration
        });
        
        // Versuche zuerst Backend mit Cloud-Speicherung
        try {
            const backendResponse = await fetch(`${BACKEND_URL}/api/study/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });
            
            if (backendResponse.ok) {
                const responseData = await backendResponse.json();
                console.log('✅ Backend Cloud Save Success:', {
                    filename: responseData.filename,
                    storage: responseData.storage
                });
                
                return NextResponse.json({
                    ...responseData,
                    message: 'Studie erfolgreich in der Cloud gespeichert!',
                    storage_type: 'cloud_backup'
                });
            } else {
                console.warn('⚠️ Backend save failed, trying local backup...');
                throw new Error(`Backend failed: ${backendResponse.status}`);
            }
        } catch (backendError) {
            console.warn('⚠️ Cloud save failed:', backendError);
            
            // Fallback: Lokales JSON für Download bereitstellen
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `study_${requestBody.participantId}_${timestamp}.json`;
            
            // Strukturiere Daten für wissenschaftliche Auswertung
            const scientificData = {
                // === STUDY METADATA ===
                study_info: {
                    project: "FormularIQ - LLM-gestützte Formularbearbeitung",
                    institution: "HAW Hamburg",
                    researcher: "Moritz Treu",
                    version: "1.0.0",
                    collection_date: new Date().toISOString(),
                    participant_id: requestBody.participantId,
                    randomization: requestBody.randomization,
                    total_duration_ms: requestBody.totalDuration,
                    total_duration_minutes: Math.round((requestBody.totalDuration || 0) / 60000)
                },
                
                // === RAW DATA ===
                demographics: requestBody.demographics,
                variant_a_data: requestBody.variantAData,
                variant_b_data: requestBody.variantBData,
                comparison_data: requestBody.comparisonData,
                
                // === ANALYSIS READY DATA ===
                analysis: {
                    completion_rate: {
                        demographics: requestBody.demographics ? 100 : 0,
                        variant_a: requestBody.variantAData?.completionRate || 0,
                        variant_b: requestBody.variantBData?.completionRate || 0,
                        comparison: requestBody.comparisonData ? 100 : 0
                    },
                    user_interactions: {
                        variant_a_help: requestBody.variantAData?.helpRequests || 0,
                        variant_a_errors: requestBody.variantAData?.errors || 0,
                        variant_b_help: requestBody.variantBData?.helpRequests || 0,
                        variant_b_errors: requestBody.variantBData?.errors || 0
                    },
                    preferences: requestBody.comparisonData ? {
                        speed_winner: requestBody.comparisonData.speed,
                        usability_winner: requestBody.comparisonData.understandability,
                        satisfaction_winner: requestBody.comparisonData.pleasantness,
                        helpfulness_winner: requestBody.comparisonData.helpfulness,
                        future_preference: requestBody.comparisonData.future_preference
                    } : null
                }
            };
            
            console.log('✅ Created local backup data structure');
            
            return NextResponse.json({
                message: 'Cloud-Speicherung nicht verfügbar - Daten für lokalen Download bereitgestellt',
                filename,
                storage_type: 'local_backup',
                download_data: scientificData,
                success: true,
                note: 'Bitte laden Sie die Datei herunter und senden Sie sie an den Studienleiter.'
            });
        }
        
    } catch (error) {
        console.error('💥 NextJS API Critical Error:', error);
        
        return NextResponse.json(
            { 
                error: 'Kritischer Fehler beim Speichern',
                details: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
                success: false
            },
            { status: 500 }
        );
    }
}

// Health Check für die Study Save Route
export async function GET() {
    try {
        const backendHealthCheck = await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        
        const backendStatus = backendHealthCheck.ok ? 'healthy' : 'unreachable';
        
        return NextResponse.json({
            status: 'NextJS Study Save API active',
            backend_url: BACKEND_URL,
            backend_health: backendStatus,
            cloud_save_available: backendHealthCheck.ok,
            local_backup_available: true,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        return NextResponse.json({
            status: 'NextJS Study Save API active',
            backend_url: BACKEND_URL,
            backend_health: 'error',
            cloud_save_available: false,
            local_backup_available: true,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        });
    }
}