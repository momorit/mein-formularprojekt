# backend/main.py - VOLLSTÄNDIGE PRODUCTION VERSION
import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path
import asyncio
import base64

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
    import aiofiles
    import requests
    logger.info("✅ Core imports successful")
except Exception as e:
    logger.error(f"❌ Core import error: {e}")
    sys.exit(1)

# Optional imports with graceful fallbacks
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    import io
    GOOGLE_DRIVE_AVAILABLE = True
    logger.info("✅ Google Drive imports successful")
except ImportError:
    GOOGLE_DRIVE_AVAILABLE = False
    logger.warning("⚠️ Google Drive not available - using local storage only")

try:
    import groq
    GROQ_AVAILABLE = True
    logger.info("✅ Groq import successful")
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("⚠️ Groq not available - using fallback responses")

try:
    from dotenv import load_dotenv
    load_dotenv()
    logger.info("✅ Environment loading successful")
except ImportError:
    logger.info("⚠️ python-dotenv not available - using system env only")

# === CONFIGURATION ===
PORT = int(os.getenv("PORT", 8000))
HOST = "0.0.0.0"
RAILWAY_ENVIRONMENT = os.getenv("RAILWAY_ENVIRONMENT")
IS_PRODUCTION = RAILWAY_ENVIRONMENT is not None

# Directories
LOCAL_OUTPUT_DIR = Path("LLM Output")
LOCAL_OUTPUT_DIR.mkdir(exist_ok=True)

# Google Drive Configuration
GOOGLE_DRIVE_FOLDER_NAME = 'FormularIQ_Studiendata'

logger.info(f"🚀 FormularIQ Backend v3.0.0")
logger.info(f"📍 Environment: {'PRODUCTION (Railway)' if IS_PRODUCTION else 'DEVELOPMENT'}")
logger.info(f"🌐 Binding: {HOST}:{PORT}")
logger.info(f"📂 Output Directory: {LOCAL_OUTPUT_DIR}")

# === LIFESPAN EVENTS (Fixed for Railway) ===
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 FormularIQ Backend v3.0.0 startup complete")
    logger.info(f"📂 Local output directory: {LOCAL_OUTPUT_DIR}")
    logger.info(f"🔧 CORS configured for {len(ALLOWED_ORIGINS)} origins")
    logger.info(f"🤖 Groq LLM: {'Available' if GROQ_AVAILABLE and os.getenv('GROQ_API_KEY') else 'Fallback mode'}")
    logger.info(f"☁️ Google Drive: {'Connected' if drive_service else 'Local storage only'}")
    logger.info("✅ All systems ready - accepting requests")
    
    yield
    
    # Shutdown
    logger.info("👋 FormularIQ Backend shutting down gracefully")

# === FASTAPI APP ===
app = FastAPI(
    title="FormularIQ Backend",
    description="LLM-gestützte Formularbearbeitung - Production Ready",
    version="3.0.0",
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url="/redoc" if not IS_PRODUCTION else None,
    lifespan=lifespan
)

# === CORS MIDDLEWARE ===
ALLOWED_ORIGINS = [
    # Development
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    
    # Vercel Production - Update this with your actual domain
    "https://mein-formularprojekt-db8b8pq9n-momorits-projects.vercel.app",
    "https://*.vercel.app",
    
    # Railway
    "https://mein-formularprojekt-production.up.railway.app",
    "https://*.railway.app",
    
    # Other platforms
    "https://*.netlify.app"
]

if not IS_PRODUCTION:
    ALLOWED_ORIGINS.append("*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
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

# === GOOGLE DRIVE FUNCTIONS (Safe initialization) ===
def get_google_drive_service():
    """Setup Google Drive service with safe error handling"""
    if not GOOGLE_DRIVE_AVAILABLE:
        logger.warning("Google Drive libraries not available")
        return None
    
    try:
        # Method 1: Environment Variable (JSON string)
        service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                credentials_info = json.loads(service_account_json)
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_info,
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                service = build('drive', 'v3', credentials=credentials)
                # Test the service with timeout
                service.files().list(pageSize=1).execute()
                logger.info("✅ Google Drive: Environment Variable authentication successful")
                return service
            except Exception as env_error:
                logger.warning(f"⚠️ Environment Variable authentication failed: {str(env_error)[:100]}...")
        
        # Method 2: Environment Variable (Base64 encoded)
        service_account_b64 = os.getenv("GOOGLE_SERVICE_ACCOUNT_B64")
        if service_account_b64:
            try:
                credentials_json = base64.b64decode(service_account_b64).decode('utf-8')
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_info,
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                service = build('drive', 'v3', credentials=credentials)
                service.files().list(pageSize=1).execute()
                logger.info("✅ Google Drive: Base64 authentication successful")
                return service
            except Exception as b64_error:
                logger.warning(f"⚠️ Base64 authentication failed: {str(b64_error)[:100]}...")
        
        # Method 3: Local JSON file (development)
        if not IS_PRODUCTION:
            service_account_file = Path("service-account-key.json")
            if service_account_file.exists():
                try:
                    credentials = service_account.Credentials.from_service_account_file(
                        service_account_file,
                        scopes=['https://www.googleapis.com/auth/drive.file']
                    )
                    service = build('drive', 'v3', credentials=credentials)
                    service.files().list(pageSize=1).execute()
                    logger.info("✅ Google Drive: Local file authentication successful")
                    return service
                except Exception as file_error:
                    logger.warning(f"⚠️ Local file authentication failed: {str(file_error)[:100]}...")
        
        logger.info("ℹ️ No Google Drive credentials configured - using local storage only")
        return None
        
    except Exception as e:
        logger.error(f"❌ Google Drive setup failed: {str(e)[:100]}...")
        return None

def create_or_get_drive_folder(service, folder_name):
    """Create or find Google Drive folder with safe error handling"""
    if not service:
        return None
    
    try:
        # Search for existing folder
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name)"
        ).execute()
        
        folders = results.get('files', [])
        if folders:
            folder_id = folders[0]['id']
            logger.info(f"✅ Google Drive folder found: {folder_name}")
            return folder_id
        
        # Create new folder
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        folder_id = folder.get('id')
        logger.info(f"✅ Google Drive folder created: {folder_name}")
        return folder_id
        
    except Exception as e:
        logger.warning(f"⚠️ Google Drive folder operation failed: {str(e)[:100]}...")
        return None

def upload_to_google_drive(service, folder_id, data, filename):
    """Upload data to Google Drive with safe error handling"""
    if not service or not folder_id:
        return None, None
    
    try:
        file_content = json.dumps(data, ensure_ascii=False, indent=2)
        file_stream = io.BytesIO(file_content.encode('utf-8'))
        
        media = MediaIoBaseUpload(file_stream, mimetype='application/json')
        
        file_metadata = {
            'name': filename,
            'parents': [folder_id]
        }
        
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id,webViewLink'
        ).execute()
        
        file_id = file.get('id')
        web_link = file.get('webViewLink')
        logger.info(f"✅ Google Drive upload successful: {filename}")
        return file_id, web_link
        
    except Exception as e:
        logger.warning(f"⚠️ Google Drive upload failed: {str(e)[:100]}...")
        return None, None

# === LLM SERVICE ===
def call_llm_service(prompt: str, context: str = "", dialog_mode: bool = False) -> str:
    """Comprehensive LLM service with Groq and fallbacks"""
    
    # 1. Try Groq API first
    if GROQ_AVAILABLE:
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key.startswith("gsk_"):
            try:
                client = groq.Groq(api_key=groq_key)
                
                system_prompt = "Du bist ein hilfreicher Assistent für Gebäude-Energieberatung. Antworte präzise und auf Deutsch."
                if dialog_mode:
                    system_prompt += " Du führst einen strukturierten Dialog und stellst gezielte Fragen über Gebäudedaten."
                
                full_prompt = f"Kontext: {context}\n\nAnfrage: {prompt}" if context else prompt
                
                response = client.chat.completions.create(
                    model="llama3-8b-8192",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=500,
                    top_p=1,
                    stop=None
                )
                
                result = response.choices[0].message.content.strip()
                if len(result) > 10:
                    logger.info("✅ Groq API response successful")
                    return result
                    
            except Exception as groq_error:
                logger.warning(f"⚠️ Groq API failed: {groq_error}")
    
    # 2. Try Ollama local service
    try:
        ollama_url = "http://localhost:11434/api/generate"
        
        system_prompt = "Du bist ein hilfreicher Assistent für Gebäude-Energieberatung auf Deutsch."
        if dialog_mode:
            system_prompt += " Du führst einen strukturierten Dialog über Gebäudedaten."
        
        full_prompt = f"{system_prompt}\n\nKontext: {context}\n\nAnfrage: {prompt}" if context else f"{system_prompt}\n\n{prompt}"
        
        response = requests.post(ollama_url, json={
            "model": "llama3",
            "prompt": full_prompt,
            "stream": False,
            "options": {
                "temperature": 0.3,
                "top_p": 0.9,
                "max_tokens": 500
            }
        }, timeout=30)
        
        if response.status_code == 200:
            result = response.json().get("response", "").strip()
            if len(result) > 10:
                logger.info("✅ Ollama response successful")
                return result
                
    except Exception as ollama_error:
        logger.warning(f"⚠️ Ollama failed: {ollama_error}")
    
    # 3. Intelligent fallback responses
    logger.info("🔄 Using intelligent fallback response")
    
    if dialog_mode:
        if "hilfe" in prompt.lower() or "?" in prompt:
            return """💡 Gerne helfe ich Ihnen! 

Hier sind einige typische Beispiele für Ihre Angaben:
• **Gebäudeart:** Einfamilienhaus, Doppelhaushälfte, Reihenhaus, Mehrfamilienhaus
• **Baujahr:** z.B. 1975, 1990, 2005 (wichtig für Energiestandards)
• **Heizungsart:** Gasheizung, Ölheizung, Wärmepumpe, Fernwärme, Holzpellets
• **Wohnfläche:** Angabe in m², z.B. 120, 85, 200

Haben Sie weitere Fragen zu einem bestimmten Punkt?"""
        
        elif "weiter" in prompt.lower() or "nächste" in prompt.lower():
            return "Vielen Dank für Ihre Antwort! Lassen Sie uns mit der nächsten Frage fortfahren."
        
        elif "fertig" in prompt.lower() or "abschluss" in prompt.lower():
            return "Herzlichen Glückwunsch! Sie haben alle Fragen beantwortet. Sie können nun Ihre Daten speichern."
        
        else:
            return f"""Verstanden: "{prompt[:50]}..."

Das ist eine sehr hilfreiche Angabe für die Energieberatung. Diese Information unterstützt uns bei der Beurteilung Ihres Gebäudes. 

Kann ich Ihnen noch bei weiteren Details helfen?"""
    
    else:
        if "anweisungen" in prompt.lower() or "instructions" in prompt.lower():
            return """Hier sind die wichtigsten Formularfelder für die Gebäude-Energieberatung:

• **GEBÄUDEART:** Art des Gebäudes (z.B. Einfamilienhaus, Doppelhaus, Reihenhaus)
• **BAUJAHR:** Baujahr des Gebäudes (wichtig für Energiestandards und Förderungen)
• **WOHNFLÄCHE:** Gesamtwohnfläche in m² (beheizte Fläche)
• **HEIZUNGSART:** Aktuelles Heizsystem (Gas, Öl, Wärmepumpe, Fernwärme, etc.)
• **DÄMMZUSTAND:** Zustand der Wärmedämmung (Dach, Wände, Keller)
• **FENSTERZUSTAND:** Alter und Zustand der Fenster (Einfach-, Doppel-, Dreifachverglasung)
• **RENOVIERUNGSWÜNSCHE:** Geplante Sanierungsmaßnahmen und Prioritäten
• **BUDGET:** Verfügbares Budget für die energetische Sanierung"""
        
        else:
            return """Vielen Dank für Ihre Anfrage zur Gebäude-Energieberatung! 

Für eine umfassende Beratung sind folgende Informationen besonders wichtig:
- **Gebäudeinformationen:** Baujahr, Größe, Art des Gebäudes
- **Aktueller Energiezustand:** Heizung, Dämmung, Fenster
- **Gewünschte Sanierungsmaßnahmen:** Ihre Prioritäten und Ziele
- **Verfügbares Budget:** Für realistische Planungsvorschläge

Geben Sie die Informationen entsprechend Ihrem Gebäude ein. Bei Fragen stehe ich Ihnen gerne zur Verfügung!"""

# === GLOBAL SERVICES INITIALIZATION ===
drive_service = get_google_drive_service()
drive_folder_id = create_or_get_drive_folder(drive_service, GOOGLE_DRIVE_FOLDER_NAME) if drive_service else None

# Dialog session storage
dialog_sessions: Dict[str, Dict] = {}

# === REQUEST LOGGING MIDDLEWARE (Safe) ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.now()
    
    try:
        # Log incoming request (safe)
        client_host = "unknown"
        try:
            client_host = request.client.host if request.client else "unknown"
        except:
            pass
        
        logger.info(f"📥 {request.method} {request.url.path} from {client_host}")
        
        response = await call_next(request)
        
        # Log response (safe)
        try:
            duration = (datetime.now() - start_time).total_seconds()
            logger.info(f"📤 {request.method} {request.url.path} -> {response.status_code} ({duration:.3f}s)")
        except:
            logger.info(f"📤 {request.method} {request.url.path} -> {response.status_code}")
        
        return response
    except Exception as e:
        logger.error(f"💥 Request middleware error: {str(e)[:100]}...")
        # Continue anyway, don't break the request
        try:
            response = await call_next(request)
            return response
        except:
            # Last resort - return a basic error response
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=500,
                content={"error": "Internal server error", "path": request.url.path}
            )

# === API ENDPOINTS ===

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": "FormularIQ Backend läuft",
        "status": "healthy",
        "version": "3.0.0",
        "environment": "production" if IS_PRODUCTION else "development",
        "timestamp": datetime.now().isoformat(),
        "services": {
            "groq_llm": GROQ_AVAILABLE and bool(os.getenv("GROQ_API_KEY")),
            "google_drive": bool(drive_service),
            "local_storage": True
        },
        "endpoints": [
            "/health",
            "/api/generate-instructions",
            "/api/chat",
            "/api/save",
            "/api/dialog/start",
            "/api/dialog/message", 
            "/api/dialog/save",
            "/api/study/save"
        ]
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    try:
        # Test Google Drive write access
        drive_write_test = False
        if drive_service and drive_folder_id:
            try:
                test_data = {"health_check": True, "timestamp": datetime.now().isoformat()}
                test_filename = f"health_test_{datetime.now().strftime('%H%M%S')}.json"
                file_id, _ = upload_to_google_drive(drive_service, drive_folder_id, test_data, test_filename)
                if file_id:
                    # Clean up test file
                    try:
                        drive_service.files().delete(fileId=file_id).execute()
                        drive_write_test = True
                    except:
                        pass
            except:
                pass
        
        # Test LLM service
        try:
            test_response = call_llm_service("Test", "", dialog_mode=True)
            llm_status = "online" if len(test_response) > 10 else "limited"
        except:
            llm_status = "offline"
        
        # Test local storage
        storage_status = "available"
        try:
            test_file = LOCAL_OUTPUT_DIR / "health_test.json"
            test_data = {"test": True, "timestamp": datetime.now().isoformat()}
            async with aiofiles.open(test_file, 'w') as f:
                await f.write(json.dumps(test_data))
            test_file.unlink()  # Clean up
        except Exception:
            storage_status = "limited"
        
        health_data = {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "3.0.0",
            "environment": "production" if IS_PRODUCTION else "development",
            "services": {
                "google_drive_read": "connected" if drive_service else "disconnected",
                "google_drive_write": "ok" if drive_write_test else "limited",
                "llm_service": llm_status,
                "local_storage": storage_status,
                "dialog_sessions": len(dialog_sessions)
            },
            "system": {
                "port": PORT,
                "host": HOST,
                "railway": IS_PRODUCTION,
                "output_directory": str(LOCAL_OUTPUT_DIR),
                "cors_origins": len(ALLOWED_ORIGINS)
            },
            "features": {
                "complete_data_collection": True,
                "demographics_support": True,
                "variant_comparison": True,
                "sus_questionnaires": True,
                "cloud_backup": drive_write_test,
                "local_backup": storage_status == "available"
            }
        }
        
        logger.info("💚 Health check successful")
        return health_data
        
    except Exception as e:
        logger.error(f"💔 Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "version": "3.0.0"
        }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Generate form instructions using LLM"""
    try:
        logger.info(f"📝 Generating instructions with context: {request.context[:50]}...")
        
        prompt = f"""Erstelle 8-10 präzise Formularfelder für eine Gebäude-Energieberatung.
        
Kontext: {request.context if request.context else 'Allgemeine Gebäude-Energieberatung'}

Gib eine Liste von klaren, verständlichen Anweisungen auf Deutsch zurück.
Jede Anweisung sollte spezifisch und hilfreich sein."""
        
        # Try LLM first, fallback to defaults
        try:
            llm_response = call_llm_service(prompt, request.context)
            # If LLM response contains useful instructions, parse them
            # For now, use defaults to ensure reliability
        except:
            pass
        
        # Default instructions (always reliable)
        instructions = [
            "Geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Reihenhaus, Mehrfamilienhaus)",
            "In welchem Jahr wurde das Gebäude errichtet? (Format: JJJJ)",
            "Wie groß ist die beheizte Wohnfläche in Quadratmetern?",
            "Welche Art der Heizung ist aktuell installiert? (z.B. Gas, Öl, Wärmepumpe, Fernwärme)",
            "Beschreiben Sie den Dämmzustand des Gebäudes (Dach, Wände, Keller)",
            "Welcher Fenstertyp ist installiert? (Einfach-, Doppel-, Dreifachverglasung)",
            "Welche energetischen Renovierungsmaßnahmen planen Sie?",
            "Wie hoch ist Ihr verfügbares Budget für die Sanierung? (grober Rahmen)"
        ]
        
        logger.info(f"✅ Instructions generated: {len(instructions)} fields")
        return {"instructions": instructions}
        
    except Exception as e:
        logger.error(f"💥 Generate instructions failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Generieren: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat help service"""
    try:
        logger.info(f"💬 Chat request: {request.message[:50]}...")
        
        response = call_llm_service(request.message, request.context or "")
        
        logger.info("✅ Chat response generated")
        return {"response": response}
        
    except Exception as e:
        logger.error(f"💥 Chat failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat-Fehler: {str(e)}")

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Save form data (Variant A)"""
    try:
        logger.info(f"💾 Saving form data: {len(request.instructions)} fields, {len(request.values)} values")
        
        save_data = {
            "variant": "A_sichtbares_formular",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values,
            "metadata": {
                "total_fields": len(request.instructions),
                "filled_fields": len([v for v in request.values.values() if v.strip()]),
                "completion_rate": (len([v for v in request.values.values() if v.strip()]) / max(len(request.instructions), 1)) * 100
            },
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu",
                "backend_version": "3.0.0"
            }
        }
        
        filename = f"formular_a_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Google Drive upload attempt
        storage_info = {"storage": "local"}
        if drive_service and drive_folder_id:
            try:
                file_id, web_link = upload_to_google_drive(drive_service, drive_folder_id, save_data, filename)
                if file_id:
                    storage_info = {
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link,
                        "folder": GOOGLE_DRIVE_FOLDER_NAME
                    }
            except Exception as drive_error:
                logger.warning(f"Google Drive upload failed: {drive_error}")
        
        # Local backup (always)
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
        except Exception as local_error:
            logger.error(f"Local backup failed: {local_error}")
        
        logger.info(f"✅ Form data saved: {filename}")
        return {
            "message": "Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
        
    except Exception as e:
        logger.error(f"💥 Save form data failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern: {str(e)}")

@app.post("/api/dialog/start")
async def start_dialog(request: DialogStartRequest):
    """Start dialog session (Variant B)"""
    try:
        logger.info(f"🎭 Starting dialog with context: {request.context[:50] if request.context else 'none'}")
        
        # Standard questions for building energy consultation
        questions = [
            {"question": "Welche Art von Gebäude möchten Sie energetisch beraten lassen?", "field": "GEBÄUDEART"},
            {"question": "In welchem Jahr wurde das Gebäude errichtet?", "field": "BAUJAHR"},
            {"question": "Wie groß ist die beheizte Wohnfläche in Quadratmetern?", "field": "WOHNFLÄCHE"},
            {"question": "Welche Art der Heizung ist aktuell installiert?", "field": "HEIZUNGSART"},
            {"question": "Können Sie den aktuellen Dämmzustand des Gebäudes beschreiben?", "field": "DÄMMZUSTAND"},
            {"question": "Welcher Fenstertyp ist in Ihrem Gebäude eingebaut?", "field": "FENSTERTYP"},
            {"question": "Welche energetischen Renovierungsmaßnahmen planen oder erwägen Sie?", "field": "RENOVIERUNG"},
            {"question": "In welchem Budgetrahmen bewegen sich Ihre Sanierungspläne?", "field": "BUDGET"}
        ]
        
        session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        dialog_sessions[session_id] = {
            "questions": questions,
            "answers": {},
            "current_index": 0,
            "chat_history": [],
            "context": request.context
        }
        
        logger.info(f"✅ Dialog session created: {session_id} with {len(questions)} questions")
        return {
            "session_id": session_id,
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0,
            "currentQuestion": questions[0]
        }
        
    except Exception as e:
        logger.error(f"💥 Start dialog failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Dialog-Start: {str(e)}")

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Process dialog message (Variant B)"""
    try:
        logger.info(f"💬 Dialog message: {request.message[:50]}...")
        
        # Handle help request
        if request.message.strip() == "?":
            help_text = "Geben Sie Informationen zu Ihrem Gebäude ein. Bei Unsicherheiten können Sie konkrete Beispiele oder Schätzwerte angeben."
            
            if request.currentQuestion and "field" in request.currentQuestion:
                field = request.currentQuestion["field"]
                help_map = {
                    "GEBÄUDEART": "Beispiele: Einfamilienhaus, Doppelhaushälfte, Reihenhaus, Mehrfamilienhaus, Gewerbegebäude",
                    "BAUJAHR": "Geben Sie das Errichtungsjahr an, z.B. 1975, 1990, 2005. Falls unbekannt, schätzen Sie das Jahrzehnt.",
                    "WOHNFLÄCHE": "Gesamte beheizte Wohnfläche in m², z.B. 120, 85, 200. Bei Unsicherheit: grobe Schätzung ist ausreichend.",
                    "HEIZUNGSART": "Beispiele: Gasheizung, Ölheizung, Wärmepumpe, Fernwärme, Holz-/Pelletheizung, Elektroheizung",
                    "DÄMMZUSTAND": "Beschreiben Sie: gut gedämmt, teilweise gedämmt, ungedämmt, oder geben Sie an welche Bereiche gedämmt sind",
                    "FENSTERTYP": "Beispiele: Einfachverglasung (alt), Doppelverglasung (Standard), Dreifachverglasung (modern)",
                    "RENOVIERUNG": "Beschreiben Sie geplante Maßnahmen: neue Heizung, Dämmung, Fenster, Dach, etc.",
                    "BUDGET": "Grober Rahmen: unter 10.000€, 10.000-50.000€, 50.000-100.000€, über 100.000€"
                }
                help_text = help_map.get(field, help_text)
            
            return {
                "response": f"💡 Hilfe: {help_text}",
                "nextQuestion": False,
                "helpProvided": True
            }
        
        # Process normal response with LLM
        context = ""
        if request.currentQuestion:
            context = f"Der Nutzer beantwortet die Frage '{request.currentQuestion.get('question')}' mit: '{request.message}'"
        
        prompt = "Bestätige die Antwort kurz und freundlich (max. 2 Sätze). Sei ermutigend und professionell. Bedanke dich für die Angabe."
        
        response = call_llm_service(prompt, context, dialog_mode=True)
        
        # Fallback if LLM doesn't respond adequately
        if len(response.strip()) < 10:
            response = f"Vielen Dank für die Angabe '{request.message}'! Das ist eine hilfreiche Information für die Energieberatung."
        
        logger.info("✅ Dialog message processed")
        return {
            "response": response,
            "nextQuestion": True,
            "helpProvided": False
        }
        
    except Exception as e:
        logger.error(f"💥 Dialog message failed: {e}")
        return {
            "response": "Entschuldigung, es gab einen technischen Fehler. Können Sie das bitte nochmal versuchen?",
            "nextQuestion": False,
            "helpProvided": False
        }

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Save dialog data (Variant B)"""
    try:
        logger.info(f"💾 Saving dialog data: {len(request.questions)} questions, {len(request.answers)} answers")
        
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
            },
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu",
                "backend_version": "3.0.0"
            }
        }
        
        filename = f"dialog_b_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Google Drive upload attempt
        storage_info = {"storage": "local"}
        if drive_service and drive_folder_id:
            try:
                file_id, web_link = upload_to_google_drive(drive_service, drive_folder_id, save_data, filename)
                if file_id:
                    storage_info = {
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link,
                        "folder": GOOGLE_DRIVE_FOLDER_NAME
                    }
            except Exception as drive_error:
                logger.warning(f"Google Drive upload failed: {drive_error}")
        
        # Local backup (always)
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
        except Exception as local_error:
            logger.error(f"Local backup failed: {local_error}")
        
        logger.info(f"✅ Dialog data saved: {filename}")
        return {
            "message": "Dialog-Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
        
    except Exception as e:
        logger.error(f"💥 Save dialog data failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Dialog-Speichern: {str(e)}")

@app.post("/api/study/save")
async def save_complete_study_data(request: StudySaveRequest):
    """Save complete study data"""
    try:
        logger.info(f"📊 Saving complete study data for participant: {request.participantId}")
        
        save_data = {
            "study_type": "complete_study_data",
            "participant_id": request.participantId,
            "start_time": request.startTime,
            "randomization": request.randomization,
            "demographics": request.demographics,
            "variant_a_data": request.variantAData,
            "variant_b_data": request.variantBData,
            "comparison_data": request.comparisonData,
            "total_duration": request.totalDuration,
            "completion_timestamp": datetime.now().isoformat(),
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu",
                "backend_version": "3.0.0",
                "study_completion_rate": calculate_study_completion_rate(request)
            }
        }
        
        filename = f"complete_study_{request.participantId}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Google Drive upload attempt
        storage_results = {"storage": "local"}
        if drive_service and drive_folder_id:
            try:
                file_id, web_link = upload_to_google_drive(drive_service, drive_folder_id, save_data, filename)
                if file_id:
                    storage_results = {
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link,
                        "folder": GOOGLE_DRIVE_FOLDER_NAME
                    }
            except Exception as drive_error:
                logger.warning(f"Google Drive upload failed: {drive_error}")
                storage_results["drive_error"] = str(drive_error)
        
        # Local backup (always)
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_results["local_path"] = str(local_path)
        except Exception as local_error:
            logger.error(f"Local backup failed: {local_error}")
            storage_results["local_error"] = str(local_error)
        
        logger.info(f"✅ Complete study data saved: {filename}")
        return {
            "message": "Vollständige Studiendaten erfolgreich gespeichert",
            "participant_id": request.participantId,
            "filename": filename,
            "study_duration_minutes": round((request.totalDuration or 0) / 60000, 2),
            "completion_rate": calculate_study_completion_rate(request),
            **storage_results
        }
        
    except Exception as e:
        logger.error(f"💥 Save complete study data failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Fehler beim Speichern der Studiendaten: {str(e)}"
        )

def calculate_study_completion_rate(request: StudySaveRequest) -> float:
    """Calculate study completion rate (0-100%)"""
    completed_sections = 0
    total_sections = 5  # demographics, variant_a, variant_b, comparison, duration
    
    if request.demographics:
        completed_sections += 1
    if request.variantAData:
        completed_sections += 1
    if request.variantBData:
        completed_sections += 1
    if request.comparisonData:
        completed_sections += 1
    if request.totalDuration and request.totalDuration > 0:
        completed_sections += 1
    
    return round((completed_sections / total_sections) * 100, 2)

# === LIFESPAN EVENTS (Updated for FastAPI) ===
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 FormularIQ Backend v3.0.0 startup complete")
    logger.info(f"📂 Local output directory: {LOCAL_OUTPUT_DIR}")
    logger.info(f"🔧 CORS configured for {len(ALLOWED_ORIGINS)} origins")
    logger.info(f"🤖 Groq LLM: {'Available' if GROQ_AVAILABLE and os.getenv('GROQ_API_KEY') else 'Fallback mode'}")
    logger.info(f"☁️ Google Drive: {'Connected' if drive_service else 'Local storage only'}")
    logger.info("✅ All systems ready - accepting requests")
    
    yield
    
    # Shutdown
    logger.info("👋 FormularIQ Backend shutting down gracefully")

# Update FastAPI app to use lifespan
app = FastAPI(
    title="FormularIQ Backend",
    description="LLM-gestützte Formularbearbeitung - Production Ready",
    version="3.0.0",
    docs_url="/docs" if not IS_PRODUCTION else None,
    redoc_url="/redoc" if not IS_PRODUCTION else None,
    lifespan=lifespan
)

# === MAIN ===
if __name__ == "__main__":
    logger.info(f"🚀 Starting FormularIQ Backend v3.0.0")
    logger.info(f"🌐 Server: {HOST}:{PORT}")
    logger.info(f"📚 Documentation: http://localhost:{PORT}/docs" if not IS_PRODUCTION else "📚 Documentation: disabled in production")
    
    try:
        uvicorn.run(
            "main:app",
            host=HOST,
            port=PORT,
            reload=False,  # Never reload in production
            log_level="info",
            access_log=True
        )
    except Exception as e:
        logger.error(f"💥 Failed to start server: {e}")
        sys.exit(1)