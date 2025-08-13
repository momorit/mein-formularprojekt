# backend/main.py - RAILWAY SIMPLIFIED
import os
import json
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import aiofiles

# Configuration
PORT = int(os.getenv("PORT", 8000))
RAILWAY_ENVIRONMENT = os.getenv("RAILWAY_ENVIRONMENT")
IS_PRODUCTION = RAILWAY_ENVIRONMENT is not None

print(f"🚀 FormularIQ Backend - Railway Optimized")
print(f"📍 Environment: {'PRODUCTION' if IS_PRODUCTION else 'DEVELOPMENT'}")
print(f"🌐 Port: {PORT}")

app = FastAPI(
    title="FormularIQ Backend",
    description="LLM-gestützte Formularbearbeitung",
    version="2.7.0"
)

# CORS Configuration - SIMPLIFIED
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Simplified for Railway
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("✅ CORS configured")

# Storage
LOCAL_OUTPUT_DIR = Path("output")
LOCAL_OUTPUT_DIR.mkdir(exist_ok=True)

# Models
class ContextRequest(BaseModel):
    context: str = ""

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""

class SaveRequest(BaseModel):
    instructions: List[str] = []
    values: Dict[str, str] = {}

class DialogStartRequest(BaseModel):
    context: Optional[str] = ""

class DialogMessageRequest(BaseModel):
    session_id: Optional[str] = ""
    message: str
    currentQuestion: Optional[Dict[str, Any]] = None

class DialogSaveRequest(BaseModel):
    questions: List[Dict[str, str]] = []
    answers: Dict[str, str] = {}
    chatHistory: List[Dict[str, str]] = []

# Simple LLM Response Function
def get_simple_response(prompt: str, context: str = "", dialog_mode: bool = False) -> str:
    """Simple response generator"""
    
    if dialog_mode:
        if "hilfe" in prompt.lower() or "?" in prompt:
            return "Gerne helfe ich! Beispiele: Einfamilienhaus (Gebäudeart), 1975 (Baujahr), Gasheizung (Heizungsart)"
        elif "weiter" in prompt.lower():
            return "Vielen Dank! Lassen Sie uns fortfahren."
        else:
            return f"Verstanden: '{prompt[:30]}...' - Das ist eine gute Angabe."
    else:
        return """Wichtige Formularfelder:
• GEBÄUDEART: Art des Gebäudes
• BAUJAHR: Errichtungsjahr  
• WOHNFLÄCHE: Größe in m²
• HEIZUNGSART: Gas, Öl, Wärmepumpe, etc."""

# Global storage
dialog_sessions: Dict[str, Dict] = {}

# === ENDPOINTS ===

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "FormularIQ Backend",
        "status": "healthy",
        "version": "2.7.0",
        "environment": "production" if IS_PRODUCTION else "development",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Simple health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.7.0",
        "services": {
            "api": "online",
            "storage": "available"
        }
    }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Generate form instructions"""
    instructions = [
        "Geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Reihenhaus)",
        "In welchem Jahr wurde das Gebäude errichtet?",
        "Wie groß ist die Wohnfläche in Quadratmetern?",
        "Welche Art der Heizung ist installiert?",
        "Beschreiben Sie den Dämmzustand des Gebäudes",
        "Welcher Fenstertyp ist installiert?",
        "Welche Renovierungsmaßnahmen sind geplant?",
        "Wie hoch ist Ihr Budget für die Sanierung?"
    ]
    
    return {"instructions": instructions}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat endpoint"""
    try:
        response = get_simple_response(request.message, request.context or "")
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Save form data"""
    try:
        save_data = {
            "variant": "A_sichtbares_formular",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values,
            "metadata": {
                "total_fields": len(request.instructions),
                "filled_fields": len([v for v in request.values.values() if v.strip()]),
            }
        }
        
        filename = f"formular_a_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        local_path = LOCAL_OUTPUT_DIR / filename
        
        async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
        
        return {
            "message": "Daten erfolgreich gespeichert",
            "filename": filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dialog/start")
async def start_dialog(request: DialogStartRequest):
    """Start dialog session"""
    try:
        questions = [
            {"question": "Welche Art von Gebäude möchten Sie beraten lassen?", "field": "GEBÄUDEART"},
            {"question": "In welchem Jahr wurde das Gebäude errichtet?", "field": "BAUJAHR"},
            {"question": "Wie groß ist die Wohnfläche in Quadratmetern?", "field": "WOHNFLÄCHE"},
            {"question": "Welche Art der Heizung ist installiert?", "field": "HEIZUNGSART"},
            {"question": "Beschreiben Sie den aktuellen Dämmzustand.", "field": "DÄMMZUSTAND"},
            {"question": "Welcher Fenstertyp ist vorhanden?", "field": "FENSTERTYP"}
        ]
        
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        dialog_sessions[session_id] = {
            "questions": questions,
            "answers": {},
            "current_index": 0
        }
        
        return {
            "session_id": session_id,
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0,
            "currentQuestion": questions[0]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Process dialog message"""
    try:
        # Handle help request
        if request.message.strip() == "?":
            help_text = "Geben Sie Informationen zu Ihrem Gebäude ein. Beispiele: 'Einfamilienhaus', '1975', '120 m²'"
            return {
                "response": f"💡 Hilfe: {help_text}",
                "nextQuestion": False,
                "helpProvided": True
            }
        
        # Normal response
        response = get_simple_response(request.message, "", dialog_mode=True)
        
        return {
            "response": response,
            "nextQuestion": True,
            "helpProvided": False
        }
        
    except Exception as e:
        return {
            "response": "Entschuldigung, es gab einen Fehler. Versuchen Sie es erneut.",
            "nextQuestion": False,
            "helpProvided": False
        }

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Save dialog data"""
    try:
        save_data = {
            "variant": "B_dialog_system",
            "timestamp": datetime.now().isoformat(),
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory,
            "metadata": {
                "total_questions": len(request.questions),
                "answered_questions": len([v for v in request.answers.values() if v.strip()]),
            }
        }
        
        filename = f"dialog_b_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        local_path = LOCAL_OUTPUT_DIR / filename
        
        async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
        
        return {
            "message": "Dialog-Daten erfolgreich gespeichert",
            "filename": filename
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Main
if __name__ == "__main__":
    print(f"🚀 Starting server on 0.0.0.0:{PORT}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=PORT,
        reload=False
    )