# backend/main.py - RAILWAY OPTIMIZED VERSION
import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

# Logging setup
logging.basicConfig(level=logging.INFO, format='%(levelname)s:%(name)s:%(message)s')
logger = logging.getLogger(__name__)

# Railway-specific configuration FIRST
PORT = int(os.getenv("PORT", 8000))
HOST = "0.0.0.0"
RAILWAY_ENVIRONMENT = os.getenv("RAILWAY_ENVIRONMENT")
IS_PRODUCTION = RAILWAY_ENVIRONMENT is not None

print(f"🚀 FormularIQ Backend - Railway Optimized")
print(f"📍 Port: {PORT}")
print(f"🌐 Host: {HOST}")
print(f"🔧 Environment: {'PRODUCTION' if IS_PRODUCTION else 'DEVELOPMENT'}")

try:
    from fastapi import FastAPI, HTTPException, Request
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    import uvicorn
    import aiofiles
    import requests
    print("✅ Core imports successful")
except Exception as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

# Optional imports with safe fallbacks
GROQ_AVAILABLE = False
try:
    import groq
    GROQ_AVAILABLE = True
    print("✅ Groq available")
except ImportError:
    print("⚠️ Groq not available")

GOOGLE_DRIVE_AVAILABLE = False
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    import io
    GOOGLE_DRIVE_AVAILABLE = True
    print("✅ Google Drive available")
except ImportError:
    print("⚠️ Google Drive not available")

# Configuration
LOCAL_OUTPUT_DIR = Path("output")
LOCAL_OUTPUT_DIR.mkdir(exist_ok=True)
GOOGLE_DRIVE_FOLDER_NAME = 'FormularIQ_Studiendata'

# === FASTAPI APP (Simple initialization) ===
app = FastAPI(
    title="FormularIQ Backend",
    description="Railway-optimized backend",
    version="3.1.0"
)

# === CORS (Ultra-permissive for Railway) ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("✅ CORS configured")

# === MODELS ===
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

# === GOOGLE DRIVE FUNCTIONS (Safe) ===
def get_google_drive_service():
    if not GOOGLE_DRIVE_AVAILABLE:
        return None
    
    try:
        service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            credentials_info = json.loads(service_account_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info,
                scopes=['https://www.googleapis.com/auth/drive.file']
            )
            service = build('drive', 'v3', credentials=credentials)
            service.files().list(pageSize=1).execute()
            print("✅ Google Drive authenticated")
            return service
    except Exception as e:
        print(f"⚠️ Google Drive setup failed: {str(e)[:100]}...")
    
    return None

def create_or_get_drive_folder(service, folder_name):
    if not service:
        return None
    
    try:
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name)"
        ).execute()
        
        folders = results.get('files', [])
        if folders:
            return folders[0]['id']
        
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        return folder.get('id')
    except Exception as e:
        print(f"⚠️ Drive folder error: {str(e)[:100]}...")
        return None

def upload_to_google_drive(service, folder_id, data, filename):
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
        
        return file.get('id'), file.get('webViewLink')
    except Exception as e:
        print(f"⚠️ Drive upload error: {str(e)[:100]}...")
        return None, None

# === LLM SERVICE ===
def call_llm_service(prompt: str, context: str = "", dialog_mode: bool = False) -> str:
    # Try Groq first
    if GROQ_AVAILABLE:
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key.startswith("gsk_"):
            try:
                client = groq.Groq(api_key=groq_key)
                
                system_prompt = "Du bist ein hilfreicher Assistent für Gebäude-Energieberatung auf Deutsch."
                if dialog_mode:
                    system_prompt += " Du führst einen strukturierten Dialog."
                
                full_prompt = f"Kontext: {context}\n\nAnfrage: {prompt}" if context else prompt
                
                response = client.chat.completions.create(
                    model="llama3-8b-8192",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=300
                )
                
                result = response.choices[0].message.content.strip()
                if len(result) > 10:
                    return result
            except Exception as e:
                print(f"Groq error: {str(e)[:100]}...")
    
    # Fallback responses
    if dialog_mode:
        if "hilfe" in prompt.lower() or "?" in prompt:
            return "Gerne helfe ich! Beispiele: Einfamilienhaus (Gebäudeart), 1975 (Baujahr), Gasheizung"
        elif "weiter" in prompt.lower():
            return "Vielen Dank! Lassen Sie uns fortfahren."
        else:
            return f"Verstanden: '{prompt[:30]}...' - Das ist eine gute Angabe für die Energieberatung."
    else:
        return """Wichtige Formularfelder:
• GEBÄUDEART: Art des Gebäudes
• BAUJAHR: Errichtungsjahr
• WOHNFLÄCHE: Größe in m²
• HEIZUNGSART: Gas, Öl, Wärmepumpe"""

# === GLOBAL SERVICES ===
drive_service = None
drive_folder_id = None

try:
    drive_service = get_google_drive_service()
    drive_folder_id = create_or_get_drive_folder(drive_service, GOOGLE_DRIVE_FOLDER_NAME) if drive_service else None
except:
    pass

dialog_sessions = {}

# === MIDDLEWARE ===
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"📥 {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        print(f"📤 {request.method} {request.url.path} -> {response.status_code}")
        return response
    except Exception as e:
        print(f"💥 Request error: {str(e)[:100]}...")
        from fastapi.responses import JSONResponse
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error"}
        )

# === ROUTES ===
@app.get("/")
async def root():
    return {
        "message": "FormularIQ Backend - Railway Ready",
        "status": "healthy",
        "version": "3.1.0",
        "timestamp": datetime.now().isoformat(),
        "port": PORT,
        "host": HOST,
        "environment": "production" if IS_PRODUCTION else "development"
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "3.1.0",
        "services": {
            "groq": GROQ_AVAILABLE and bool(os.getenv("GROQ_API_KEY")),
            "google_drive": bool(drive_service),
            "local_storage": True
        },
        "railway": {
            "port": PORT,
            "environment": IS_PRODUCTION
        }
    }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    try:
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
        
        print(f"✅ Instructions generated: {len(instructions)} fields")
        return {"instructions": instructions}
    except Exception as e:
        print(f"Error in generate_instructions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        response = call_llm_service(request.message, request.context or "")
        print("✅ Chat response generated")
        return {"response": response}
    except Exception as e:
        print(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    try:
        save_data = {
            "variant": "A_sichtbares_formular",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values,
            "metadata": {
                "total_fields": len(request.instructions),
                "filled_fields": len([v for v in request.values.values() if v.strip()])
            }
        }
        
        filename = f"formular_a_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Try Google Drive
        storage_info = {"storage": "local"}
        if drive_service and drive_folder_id:
            try:
                file_id, web_link = upload_to_google_drive(drive_service, drive_folder_id, save_data, filename)
                if file_id:
                    storage_info = {
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link
                    }
            except:
                pass
        
        # Local backup
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
        except:
            pass
        
        print(f"✅ Form data saved: {filename}")
        return {
            "message": "Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
    except Exception as e:
        print(f"Error in save: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dialog/start")
async def start_dialog(request: DialogStartRequest):
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
        
        print(f"✅ Dialog session created: {session_id}")
        return {
            "session_id": session_id,
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0,
            "currentQuestion": questions[0]
        }
    except Exception as e:
        print(f"Error in dialog start: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    try:
        if request.message.strip() == "?":
            help_text = "Geben Sie Informationen zu Ihrem Gebäude ein. Beispiele: 'Einfamilienhaus', '1975', '120 m²'"
            return {
                "response": f"💡 Hilfe: {help_text}",
                "nextQuestion": False,
                "helpProvided": True
            }
        
        response = call_llm_service(request.message, "", dialog_mode=True)
        
        print("✅ Dialog message processed")
        return {
            "response": response,
            "nextQuestion": True,
            "helpProvided": False
        }
    except Exception as e:
        print(f"Error in dialog message: {e}")
        return {
            "response": "Entschuldigung, es gab einen Fehler. Versuchen Sie es erneut.",
            "nextQuestion": False,
            "helpProvided": False
        }

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    try:
        save_data = {
            "variant": "B_dialog_system",
            "timestamp": datetime.now().isoformat(),
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory,
            "metadata": {
                "total_questions": len(request.questions),
                "answered_questions": len([v for v in request.answers.values() if v.strip()])
            }
        }
        
        filename = f"dialog_b_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Try Google Drive
        storage_info = {"storage": "local"}
        if drive_service and drive_folder_id:
            try:
                file_id, web_link = upload_to_google_drive(drive_service, drive_folder_id, save_data, filename)
                if file_id:
                    storage_info = {
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link
                    }
            except:
                pass
        
        # Local backup
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
        except:
            pass
        
        print(f"✅ Dialog data saved: {filename}")
        return {
            "message": "Dialog-Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
    except Exception as e:
        print(f"Error in dialog save: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/study/save")
async def save_complete_study_data(request: StudySaveRequest):
    try:
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
            "completion_timestamp": datetime.now().isoformat()
        }
        
        filename = f"complete_study_{request.participantId}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Try Google Drive
        storage_results = {"storage": "local"}
        if drive_service and drive_folder_id:
            try:
                file_id, web_link = upload_to_google_drive(drive_service, drive_folder_id, save_data, filename)
                if file_id:
                    storage_results = {
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link
                    }
            except:
                pass
        
        # Local backup
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_results["local_path"] = str(local_path)
        except:
            pass
        
        print(f"✅ Complete study data saved: {filename}")
        return {
            "message": "Vollständige Studiendaten erfolgreich gespeichert",
            "participant_id": request.participantId,
            "filename": filename,
            **storage_results
        }
    except Exception as e:
        print(f"Error in study save: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# === STARTUP ===
print("🔧 App configured - ready to start")

# === MAIN ===
if __name__ == "__main__":
    print(f"🚀 Starting server")
    print(f"🌐 Binding to: {HOST}:{PORT}")
    
    try:
        uvicorn.run(
            app,  # Direct app reference instead of string
            host=HOST,
            port=PORT,
            reload=False,
            log_level="info"
        )
    except Exception as e:
        print(f"💥 Failed to start: {e}")
        sys.exit(1)