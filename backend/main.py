# backend/main.py
import os
import json
import uuid
from datetime import datetime
from typing import Dict, List, Optional, Any
import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import httpx

# === LOGGING SETUP ===
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# === ENVIRONMENT DETECTION ===
IS_PRODUCTION = os.getenv('ENVIRONMENT', 'development') == 'production'
GROQ_API_KEY = os.getenv('GROQ_API_KEY', '')
OLLAMA_BASE_URL = os.getenv('OLLAMA_BASE_URL', 'http://localhost:11434')

# === FASTAPI APP ===
app = FastAPI(
    title="FormularIQ Backend - Complete Study Edition",
    description="LLM-gestützte Formularbearbeitung - Vollständige Studiensoftware",
    version="2.0.0",
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url="/redoc" if not IS_PRODUCTION else None
)

# === CORS MIDDLEWARE ===
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://*.vercel.app",
    "https://*.netlify.app",
    "https://*.railway.app"
]

if not IS_PRODUCTION:
    ALLOWED_ORIGINS.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=86400
)

logger.info(f"✅ CORS configured for {len(ALLOWED_ORIGINS)} origins")

# === PYDANTIC MODELS ===
class ContextRequest(BaseModel):
    context: str = ""

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""

class FormSaveRequest(BaseModel):
    instructions: Any = {}
    values: Dict[str, str] = {}
    variant: str = "A"
    metadata: Optional[Dict[str, Any]] = {}

class DialogStartRequest(BaseModel):
    context: Optional[str] = ""

class DialogMessageRequest(BaseModel):
    session_id: Optional[str] = ""
    message: str
    currentQuestion: Optional[Dict[str, Any]] = None
    questionIndex: Optional[int] = 0

class DialogSaveRequest(BaseModel):
    session_id: Optional[str] = ""
    questions: List[Dict[str, Any]] = []
    answers: Dict[str, str] = {}
    chatHistory: List[Dict[str, str]] = []
    variant: str = "B"
    metadata: Optional[Dict[str, Any]] = {}

class StudySaveRequest(BaseModel):
    participantId: str
    demographics: Optional[Dict[str, str]] = None
    variantAData: Optional[Dict[str, Any]] = None
    variantBData: Optional[Dict[str, Any]] = None
    surveys: Optional[Dict[str, Any]] = None
    comparison: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = {}

# === STORAGE SETUP ===
def ensure_output_directory():
    """Ensure LLM Output directory exists for local storage"""
    output_dir = "LLM Output"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        logger.info(f"✅ Created output directory: {output_dir}")
    return output_dir

def save_to_local_file(data: Dict[str, Any], filename_prefix: str) -> str:
    """Save data to local JSON file"""
    output_dir = ensure_output_directory()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{filename_prefix}_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)
    
    # Add metadata
    data.update({
        "timestamp": datetime.now().isoformat(),
        "study_metadata": {
            "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
            "institution": "HAW Hamburg",
            "researcher": "Moritz Treu",
            "version": "2.0.0"
        }
    })
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    logger.info(f"💾 Data saved to: {filepath}")
    return filepath

# === LLM SERVICE ===
class LLMService:
    def __init__(self):
        self.groq_available = bool(GROQ_API_KEY)
        self.ollama_available = False
        self._check_ollama()
    
    def _check_ollama(self):
        """Check if Ollama is available"""
        try:
            response = httpx.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5.0)
            self.ollama_available = response.status_code == 200
            logger.info(f"🦙 Ollama availability: {self.ollama_available}")
        except Exception as e:
            logger.warning(f"⚠️ Ollama check failed: {e}")
    
    async def generate_form_instructions(self, context: str = "") -> Dict[str, Any]:
        """Generate form instructions for Variant A"""
        # For the study, we use predefined fields but can enhance with LLM
        base_fields = [
            {
                "id": "building_type",
                "label": "GEBÄUDEART",
                "type": "select",
                "options": ["Einfamilienhaus", "Mehrfamilienhaus", "Reihenhaus", "Doppelhaushälfte"],
                "required": True,
                "placeholder": "Bitte wählen Sie die Gebäudeart",
                "hint": "Wählen Sie die Gebäudeart aus der Liste aus. Bei Unsicherheit können Sie den Chat-Assistenten fragen."
            },
            {
                "id": "construction_year", 
                "label": "BAUJAHR",
                "type": "number",
                "required": True,
                "placeholder": "z.B. 1965",
                "hint": "Geben Sie das Jahr ein, in dem das Gebäude ursprünglich errichtet wurde (z.B. 1965)."
            },
            {
                "id": "facade_area",
                "label": "FASSADENFLÄCHE (m²)",
                "type": "number", 
                "required": True,
                "placeholder": "Gesamtfläche aller zu dämmenden Fassaden",
                "hint": "Berechnung: Länge × Höhe der Außenwände abzgl. Fenster/Türen. Für komplexe Berechnungen nutzen Sie den Chat-Assistenten."
            },
            {
                "id": "insulation_spec",
                "label": "GEPLANTE DÄMMSPEZIFIKATION", 
                "type": "textarea",
                "required": True,
                "placeholder": "z.B. 140mm Mineralwolle, WDVS-System, Eingangsfassade mit Spaltklinker...",
                "hint": "Beschreiben Sie detailliert: Dämmstoff, Dicke, Ausführung (z.B. \"140mm Mineralwolle WDVS mit Riemchen-Verkleidung\"). Bei Unklarheiten fragen Sie den Assistenten."
            }
        ]
        
        return {
            "fields": base_fields,
            "context_used": context,
            "instructions": [field["hint"] for field in base_fields]
        }
    
    async def get_chat_help(self, message: str, context: str = "") -> str:
        """Provide chat help for form fields"""
        # Simple rule-based responses for the study
        message_lower = message.lower()
        
        if "fassadenfläche" in message_lower or "fläche" in message_lower:
            return """Für die Fassadenfläche berechnen Sie: 

**Eingangsfassade (Ost):** 26,50m × 8,20m = 217,30 m² abzgl. Fenster/Türen = ca. 180 m²
**Giebelfassaden:** Etwa 227,40 m²
**Hoffassade (West):** Etwa 182 m²

Für Ihr Mehrfamilienhaus mit geplanter Eingangs- und Seitenfassadendämmung wären das ca. **345-400 m²**. Welche Fassaden möchten Sie genau dämmen?"""
        
        elif "dämmung" in message_lower or "wdvs" in message_lower:
            return """Für die Dämmspezifikation beschreiben Sie:

**Material:** Mineralwolle (empfohlen: 140mm Dicke)
**System:** WDVS (Wärmedämmverbundsystem) 
**Oberfläche:** 
- Eingangsfassade: Spaltklinker/Riemchen (Optik erhalten)
- Hoffassade: Weißer Putz

**Beispiel:** "140mm Mineralwolle WDVS, Eingangsfassade mit Spaltklinker-Verkleidung, Hoffassade weiß verputzt" """
        
        elif "baujahr" in message_lower:
            return "Ihr Gebäude wurde **1965** errichtet. Das ist wichtig für die Berechnung der energetischen Standards und möglicher Förderungen."
        
        else:
            return "Können Sie Ihre Frage spezifischer stellen? Ich kann Ihnen bei der Berechnung von Flächen, Dämmspezifikationen oder anderen technischen Details helfen."
    
    async def start_dialog(self, context: str = "") -> Dict[str, Any]:
        """Start dialog for Variant B"""
        questions = [
            {
                "id": "total_living_space",
                "question": "Wie groß ist die gesamte Wohnfläche Ihres Gebäudes in Quadratmetern?",
                "field": "WOHNFLÄCHE_GESAMT",
                "type": "number",
                "required": True
            },
            {
                "id": "num_units",
                "question": "Wie viele Wohneinheiten befinden sich in dem Gebäude?",
                "field": "ANZAHL_WOHNEINHEITEN",
                "type": "number", 
                "required": True
            },
            {
                "id": "insulation_measures",
                "question": "Beschreiben Sie detailliert die geplanten Dämmmaßnahmen. Welche Fassaden sollen gedämmt werden und mit welchem System?",
                "field": "DÄMMUNGSMASSNAHMEN_DETAIL",
                "type": "textarea",
                "required": True
            },
            {
                "id": "cost_calculation",
                "question": "Wie hoch schätzen Sie die Gesamtkosten der Sanierung ein und wie soll die Finanzierung erfolgen? Bitte geben Sie auch an, welcher Anteil auf die Mieter umgelegt werden soll.",
                "field": "KOSTEN_FINANZIERUNG", 
                "type": "textarea",
                "required": True
            }
        ]
        
        session_id = str(uuid.uuid4())
        
        return {
            "session_id": session_id,
            "questions": questions,
            "welcome_message": f"Hallo! Ich führe Sie durch {len(questions)} Fragen zur Gebäude-Energieberatung."
        }
    
    async def process_dialog_message(self, message: str, session_id: str, question_index: int = 0) -> str:
        """Process dialog message for Variant B"""
        # Simple processing - in real implementation would use LLM
        if message.strip() == "?" or "hilfe" in message.lower():
            return "Gerne helfe ich Ihnen! Können Sie spezifizieren, womit Sie Unterstützung benötigen?"
        
        return f"Vielen Dank für Ihre Antwort: \"{message}\". Ich habe das notiert."

# Initialize LLM service
llm_service = LLMService()

# === API ENDPOINTS ===

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "llm_ollama": "online" if llm_service.ollama_available else "offline",
            "groq": "available" if llm_service.groq_available else "unavailable"
        },
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0"
    }

# === VARIANT A ENDPOINTS ===

@app.post("/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Generate form instructions for Variant A"""
    try:
        result = await llm_service.generate_form_instructions(request.context)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error generating instructions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat_help(request: ChatRequest):
    """Provide chat help for form fields"""
    try:
        response = await llm_service.get_chat_help(request.message, request.context)
        return JSONResponse(content={"response": response})
    except Exception as e:
        logger.error(f"Error in chat help: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save")
async def save_form_data(request: FormSaveRequest):
    """Save form data for Variant A"""
    try:
        data = {
            "variant": "A_sichtbares_formular",
            "instructions": request.instructions,
            "values": request.values,
            "metadata": request.metadata
        }
        
        filepath = save_to_local_file(data, "variant_a_output")
        
        return JSONResponse(content={
            "success": True,
            "file_path": filepath,
            "storage_location": "local",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error saving form data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === VARIANT B ENDPOINTS ===

@app.post("/dialog/start")
async def start_dialog(request: DialogStartRequest):
    """Start dialog for Variant B"""
    try:
        result = await llm_service.start_dialog(request.context)
        return JSONResponse(content=result)
    except Exception as e:
        logger.error(f"Error starting dialog: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Process dialog message"""
    try:
        response = await llm_service.process_dialog_message(
            request.message, 
            request.session_id or "",
            request.questionIndex or 0
        )
        return JSONResponse(content={"response": response})
    except Exception as e:
        logger.error(f"Error processing dialog message: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Save dialog data for Variant B"""
    try:
        data = {
            "variant": "B_dialog_system",
            "session_id": request.session_id,
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory,
            "metadata": request.metadata
        }
        
        filepath = save_to_local_file(data, "variant_b_output")
        
        return JSONResponse(content={
            "success": True,
            "file_path": filepath,
            "storage_location": "local", 
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error saving dialog data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === STUDY ENDPOINTS ===

@app.post("/study/save")
async def save_study_data(request: StudySaveRequest):
    """Save complete study data"""
    try:
        data = {
            "study_type": "FormularIQ_Usability_Study",
            "participantId": request.participantId,
            "demographics": request.demographics,
            "variantAData": request.variantAData,
            "variantBData": request.variantBData,
            "surveys": request.surveys,
            "comparison": request.comparison,
            "metadata": request.metadata
        }
        
        filepath = save_to_local_file(data, f"study_complete_{request.participantId}")
        
        return JSONResponse(content={
            "success": True,
            "participant_id": request.participantId,
            "file_path": filepath,
            "storage_location": "local",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error saving study data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === ERROR HANDLERS ===

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if not IS_PRODUCTION else "An error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )

# === STARTUP ===

@app.on_event("startup")
async def startup_event():
    logger.info("🚀 FormularIQ Backend starting up...")
    ensure_output_directory()
    logger.info("✅ FormularIQ Backend ready!")

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0" if IS_PRODUCTION else "127.0.0.1")
    
    logger.info(f"🌐 Starting server on {host}:{port}")
    logger.info(f"📊 Environment: {'Production' if IS_PRODUCTION else 'Development'}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=not IS_PRODUCTION,
        log_level="info"
    )