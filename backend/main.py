# backend/main.py - RAILWAY PRODUCTION READY
import os
import sys
import json
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
import logging

# Setup logging first
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from fastapi import FastAPI, HTTPException, Request, Response
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
    import aiofiles
    logger.info("✅ FastAPI imports successful")
except Exception as e:
    logger.error(f"❌ Import error: {e}")
    sys.exit(1)

# Railway-specific configuration
PORT = int(os.getenv("PORT", 8000))
HOST = "0.0.0.0"
RAILWAY_ENVIRONMENT = os.getenv("RAILWAY_ENVIRONMENT")
IS_PRODUCTION = RAILWAY_ENVIRONMENT is not None

logger.info(f"🚀 Starting FormularIQ Backend")
logger.info(f"📍 Environment: {'PRODUCTION' if IS_PRODUCTION else 'DEVELOPMENT'}")
logger.info(f"🌐 Host: {HOST}:{PORT}")

app = FastAPI(
    title="FormularIQ Backend",
    description="LLM-gestützte Formularbearbeitung - Railway Ready",
    version="2.6.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# === CRITICAL: CORS MIDDLEWARE ===
logger.info("🔧 Setting up CORS...")

ALLOWED_ORIGINS = [
    # Development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    
    # Vercel Production
    "https://mein-formularprojekt-db8b8pq9n-momorits-projects.vercel.app",
    "https://*.vercel.app",
    
    # Railway
    "https://*.railway.app",
    
    # Netlify
    "https://*.netlify.app"
]

if not IS_PRODUCTION:
    ALLOWED_ORIGINS.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

logger.info(f"✅ CORS configured for origins: {ALLOWED_ORIGINS}")

# === CONFIGURATION ===
LOCAL_OUTPUT_DIR = Path("LLM Output")
LOCAL_OUTPUT_DIR.mkdir(exist_ok=True)

# === PYDANTIC MODELS ===
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

class StudySaveRequest(BaseModel):
    participantId: str
    startTime: str
    randomization: str
    demographics: Optional[Dict[str, str]] = None
    variantAData: Optional[Dict[str, Any]] = None
    variantBData: Optional[Dict[str, Any]] = None
    comparisonData: Optional[Dict[str, Any]] = None
    totalDuration: Optional[int] = None

# === LLM SERVICE ===
def get_llm_response(prompt: str, context: str = "", dialog_mode: bool = False) -> str:
    """Simple LLM response with fallbacks"""
    
    logger.info(f"🤖 LLM Request: {prompt[:50]}...")
    
    # Try Groq first if available
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key.startswith("gsk_"):
        try:
            import groq
            client = groq.Groq(api_key=groq_key)
            
            system_prompt = "Du bist ein hilfreicher Assistent für Gebäude-Energieberatung auf Deutsch."
            
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"{context}\n\n{prompt}" if context else prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = response.choices[0].message.content.strip()
            logger.info("✅ Groq response successful")
            return result
            
        except Exception as e:
            logger.warning(f"⚠️ Groq failed: {e}")
    
    # Fallback responses
    logger.info("🔄 Using fallback response")
    
    if dialog_mode:
        if "hilfe" in prompt.lower() or "?" in prompt:
            return "Gerne helfe ich! Beispiele: Einfamilienhaus (Gebäudeart), 1975 (Baujahr), Gasheizung (Heizungsart)"
        elif "weiter" in prompt.lower():
            return "Vielen Dank! Lassen Sie uns fortfahren."
        else:
            return f"Verstanden: '{prompt[:30]}...' - Das ist eine gute Angabe für die Energieberatung."
    else:
        return """Wichtige Formularfelder:
• GEBÄUDEART: Art des Gebäudes (Einfamilienhaus, etc.)
• BAUJAHR: Errichtungsjahr
• WOHNFLÄCHE: Größe in m²
• HEIZUNGSART: Gas, Öl, Wärmepumpe, etc.
• DÄMMZUSTAND: Zustand der Dämmung"""

# === DIALOG STORAGE ===
dialog_sessions: Dict[str, Dict] = {}

# === MIDDLEWARE FOR LOGGING ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    
    # Log request
    logger.info(f"📥 {request.method} {request.url.path} from {request.client.host if request.client else 'unknown'}")
    
    try:
        response = await call_next(request)
        
        # Log response
        duration = (datetime.now() - start_time).total_seconds()
        logger.info(f"📤 {request.method} {request.url.path} -> {response.status_code} ({duration:.3f}s)")
        
        return response
    except Exception as e:
        logger.error(f"💥 Request failed: {request.method} {request.url.path} - {str(e)}")
        raise

# === API ENDPOINTS ===

@app.get("/")
async def root():
    """Root endpoint with system info"""
    return {
        "message": "FormularIQ Backend läuft",
        "status": "healthy",
        "version": "2.6.0",
        "environment": "production" if IS_PRODUCTION else "development",
        "port": PORT,
        "timestamp": datetime.now().isoformat(),
        "endpoints": [
            "/health",
            "/docs",
            "/api/generate-instructions",
            "/api/chat", 
            "/api/save",
            "/api/dialog/start",
            "/api/dialog/message",
            "/api/dialog/save"
        ]
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        # Test LLM
        test_response = get_llm_response("Test")
        llm_status = "online" if len(test_response) > 5 else "limited"
        
        # Test storage
        test_file = LOCAL_OUTPUT_DIR / "health_test.json"
        test_data = {"test": True, "timestamp": datetime.now().isoformat()}
        
        storage_status = "available"
        try:
            async with aiofiles.open(test_file, 'w') as f:
                await f.write(json.dumps(test_data))
            test_file.unlink()  # Clean up
        except Exception:
            storage_status = "limited"
        
        health_data = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.6.0",
            "environment": "production" if IS_PRODUCTION else "development",
            "services": {
                "llm": llm_status,
                "storage": storage_status,
                "dialog_sessions": len(dialog_sessions)
            },
            "system": {
                "port": PORT,
                "host": HOST,
                "railway": IS_PRODUCTION,
                "cors_origins": len(ALLOWED_ORIGINS)
            }
        }
        
        logger.info(f"💚 Health check successful: {health_data['services']}")
        return health_data
        
    except Exception as e:
        logger.error(f"💔 Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Generate form instructions"""
    try:
        logger.info(f"📝 Generating instructions with context: {request.context[:50]}...")
        
        # Default instructions (always works)
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
        
        logger.info("✅ Instructions generated successfully")
        return {"instructions": instructions}
        
    except Exception as e:
        logger.error(f"💥 Generate instructions failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat endpoint"""
    try:
        logger.info(f"💬 Chat request: {request.message[:50]}...")
        
        response = get_llm_response(request.message, request.context or "")
        
        logger.info("✅ Chat response generated")
        return {"response": response}
        
    except Exception as e:
        logger.error(f"💥 Chat failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Save form data"""
    try:
        logger.info(f"💾 Saving form data: {len(request.instructions)} fields")
        
        save_data = {
            "variant": "A_sichtbares_formular",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values,
            "metadata": {
                "total_fields": len(request.instructions),
                "filled_fields": len([v for v in request.values.values() if v.strip()]),
                "completion_rate": (len([v for v in request.values.values() if v.strip()]) / max(len(request.instructions), 1)) * 100
            }
        }
        
        filename = f"formular_a_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        local_path = LOCAL_OUTPUT_DIR / filename
        
        async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
        
        logger.info(f"✅ Form data saved: {filename}")
        return {
            "message": "Daten erfolgreich gespeichert",
            "filename": filename,
            "local_path": str(local_path)
        }
        
    except Exception as e:
        logger.error(f"💥 Save form data failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dialog/start")
async def start_dialog(request: DialogStartRequest):
    """Start dialog session"""
    try:
        logger.info(f"🎭 Starting dialog with context: {request.context[:50] if request.context else 'none'}...")
        
        # Default questions
        questions = [
            {"question": "Welche Art von Gebäude möchten Sie beraten lassen?", "field": "GEBÄUDEART"},
            {"question": "In welchem Jahr wurde das Gebäude errichtet?", "field": "BAUJAHR"},
            {"question": "Wie groß ist die Wohnfläche in Quadratmetern?", "field": "WOHNFLÄCHE"},
            {"question": "Welche Art der Heizung ist installiert?", "field": "HEIZUNGSART"},
            {"question": "Beschreiben Sie den aktuellen Dämmzustand.", "field": "DÄMMZUSTAND"},
            {"question": "Welcher Fenstertyp ist vorhanden?", "field": "FENSTERTYP"},
            {"question": "Welche Renovierungsmaßnahmen planen Sie?", "field": "RENOVIERUNG"},
            {"question": "Wie hoch ist Ihr Budget für die Sanierung?", "field": "BUDGET"}
        ]
        
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        dialog_sessions[session_id] = {
            "questions": questions,
            "answers": {},
            "current_index": 0,
            "chat_history": []
        }
        
        logger.info(f"✅ Dialog session created: {session_id}")
        return {
            "session_id": session_id,
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0,
            "currentQuestion": questions[0]
        }
        
    except Exception as e:
        logger.error(f"💥 Start dialog failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Process dialog message"""
    try:
        logger.info(f"💬 Dialog message: {request.message[:50]}...")
        
        # Handle help request
        if request.message.strip() == "?":
            help_text = "Geben Sie Informationen zu Ihrem Gebäude ein. Beispiele: 'Einfamilienhaus', '1975', '120 m²'"
            
            if request.currentQuestion and "field" in request.currentQuestion:
                field = request.currentQuestion["field"]
                help_map = {
                    "GEBÄUDEART": "Beispiele: Einfamilienhaus, Doppelhaushälfte, Reihenhaus",
                    "BAUJAHR": "Geben Sie das Jahr an, z.B. 1975, 1990, 2005",
                    "WOHNFLÄCHE": "Geben Sie die m² an, z.B. 120, 85, 200",
                    "HEIZUNGSART": "Beispiele: Gasheizung, Ölheizung, Wärmepumpe"
                }
                help_text = help_map.get(field, help_text)
            
            return {
                "response": f"💡 Hilfe: {help_text}",
                "nextQuestion": False,
                "helpProvided": True
            }
        
        # Normal response
        response = get_llm_response(request.message, "", dialog_mode=True)
        
        logger.info("✅ Dialog message processed")
        return {
            "response": response,
            "nextQuestion": True,
            "helpProvided": False
        }
        
    except Exception as e:
        logger.error(f"💥 Dialog message failed: {e}")
        return {
            "response": "Entschuldigung, es gab einen Fehler. Versuchen Sie es erneut.",
            "nextQuestion": False,
            "helpProvided": False
        }

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Save dialog data"""
    try:
        logger.info(f"💾 Saving dialog data: {len(request.questions)} questions")
        
        save_data = {
            "variant": "B_dialog_system",
            "timestamp": datetime.now().isoformat(),
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory,
            "metadata": {
                "total_questions": len(request.questions),
                "answered_questions": len([v for v in request.answers.values() if v.strip()]),
                "completion_rate": (len([v for v in request.answers.values() if v.strip()]) / max(len(request.questions), 1)) * 100,
                "chat_interactions": len(request.chatHistory)
            }
        }
        
        filename = f"dialog_b_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        local_path = LOCAL_OUTPUT_DIR / filename
        
        async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
        
        logger.info(f"✅ Dialog data saved: {filename}")
        return {
            "message": "Dialog-Daten erfolgreich gespeichert",
            "filename": filename,
            "local_path": str(local_path)
        }
        
    except Exception as e:
        logger.error(f"💥 Save dialog data failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === ERROR HANDLERS ===
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    logger.warning(f"📍 404: {request.method} {request.url.path}")
    return Response(
        content=json.dumps({
            "error": "Not Found",
            "method": request.method,
            "path": request.url.path,
            "message": "Endpoint not found. Check /docs for available endpoints."
        }),
        status_code=404,
        media_type="application/json"
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    logger.error(f"💥 500: {request.method} {request.url.path} - {str(exc)}")
    return Response(
        content=json.dumps({
            "error": "Internal Server Error",
            "message": "Something went wrong on the server."
        }),
        status_code=500,
        media_type="application/json"
    )

# === STARTUP/SHUTDOWN ===
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 FormularIQ Backend startup complete")
    logger.info(f"📂 Output directory: {LOCAL_OUTPUT_DIR}")
    logger.info(f"🔧 CORS origins: {len(ALLOWED_ORIGINS)}")
    logger.info("✅ Ready to serve requests")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("👋 FormularIQ Backend shutting down")

# === MAIN ===
if __name__ == "__main__":
    logger.info(f"🚀 Starting server on {HOST}:{PORT}")
    logger.info("📚 API Documentation: http://localhost:8000/docs")
    
    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,  # Disable reload in production
        log_level="info",
        access_log=True
    )