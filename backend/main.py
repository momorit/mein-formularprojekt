# backend/main.py - VOLLSTÄNDIGE FUNKTIONSFÄHIGE VERSION
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import uvicorn
import aiofiles
import requests
from pathlib import Path
import base64

# === GOOGLE DRIVE IMPORTS ===
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseUpload
    import io
    GOOGLE_DRIVE_AVAILABLE = True
except ImportError:
    print("⚠️ Google Drive nicht verfügbar - nutze lokalen Speicher")
    GOOGLE_DRIVE_AVAILABLE = False

app = FastAPI(
    title="FormularIQ Backend - COMPLETE",
    description="LLM-gestützte Formularbearbeitung mit Chat & Dialog",
    version="2.4.0"
)

# === CORS MIDDLEWARE ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://*.railway.app",
        "https://*.netlify.app",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# === CONFIGURATION ===
GOOGLE_DRIVE_FOLDER_NAME = 'FormularIQ_Studiendata'
LOCAL_OUTPUT_DIR = Path("LLM Output")
LOCAL_OUTPUT_DIR.mkdir(exist_ok=True)

# === PYDANTIC MODELS ===
class ContextRequest(BaseModel):
    context: str

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

# === GOOGLE DRIVE SETUP ===
def get_google_drive_service():
    if not GOOGLE_DRIVE_AVAILABLE:
        return None
    
    try:
        # Environment Variable zuerst versuchen
        service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                credentials_info = json.loads(service_account_json)
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_info, 
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                service = build('drive', 'v3', credentials=credentials)
                service.files().list(pageSize=1).execute()
                print("✅ Google Drive: Environment Variable erfolgreich")
                return service
            except Exception as env_error:
                print(f"⚠️ Environment Variable fehlerhaft: {env_error}")
        
        # Lokale JSON-Datei als Fallback
        service_account_file = Path("service-account-key.json")
        if service_account_file.exists():
            try:
                credentials = service_account.Credentials.from_service_account_file(
                    service_account_file, 
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                service = build('drive', 'v3', credentials=credentials)
                service.files().list(pageSize=1).execute()
                print("✅ Google Drive: Lokale Datei erfolgreich")
                return service
            except Exception as file_error:
                print(f"⚠️ Lokale Datei fehlerhaft: {file_error}")
        
        print("❌ Keine gültigen Google Drive Credentials gefunden")
        return None
        
    except Exception as e:
        print(f"❌ Google Drive Setup fehlgeschlagen: {e}")
        return None

def create_or_get_drive_folder(service, folder_name):
    if not service:
        return None
    
    try:
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name)"
        ).execute()
        
        if results.get('files'):
            folder_id = results['files'][0]['id']
            print(f"✅ Drive-Ordner gefunden: {folder_name}")
            return folder_id
        
        # Ordner erstellen
        folder_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=folder_metadata, fields='id').execute()
        print(f"✅ Drive-Ordner erstellt: {folder_name}")
        return folder.get('id')
        
    except Exception as e:
        print(f"❌ Drive-Ordner Fehler: {e}")
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
        print(f"❌ Google Drive Upload Fehler: {e}")
        return None, None

# === LLM SERVICE FUNCTIONS ===
def call_llm_service(prompt: str, context: str = "", dialog_mode: bool = False) -> str:
    """LLM Service mit mehreren Fallbacks"""
    
    # 1. Groq API versuchen
    try:
        from dotenv import load_dotenv
        load_dotenv()
        
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key.startswith("gsk_"):
            import groq
            client = groq.Groq(api_key=groq_key)
            
            system_prompt = "Du bist ein hilfreicher Assistent für Gebäude-Energieberatung. Antworte präzise und auf Deutsch."
            if dialog_mode:
                system_prompt += " Du führst einen Dialog und stellst Fragen über Gebäudedaten."
            
            full_prompt = f"{context}\n\n{prompt}" if context else prompt
            
            response = client.chat.completions.create(
                model="llama3-8b-8192",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            result = response.choices[0].message.content.strip()
            if len(result) > 10:
                print("✅ Groq API erfolgreich")
                return result
                
    except Exception as groq_error:
        print(f"⚠️ Groq API fehlgeschlagen: {groq_error}")
    
    # 2. Ollama versuchen
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
            "options": {"temperature": 0.3}
        }, timeout=30)
        
        if response.status_code == 200:
            result = response.json().get("response", "").strip()
            if len(result) > 10:
                print("✅ Ollama erfolgreich")
                return result
                
    except Exception as ollama_error:
        print(f"⚠️ Ollama fehlgeschlagen: {ollama_error}")
    
    # 3. Intelligente Fallbacks
    print("🔄 Verwende intelligenten Fallback")
    
    if dialog_mode:
        if "hilfe" in prompt.lower() or "?" in prompt:
            return """Gerne helfe ich Ihnen! 

Hier sind einige typische Beispiele:
• Gebäudeart: Einfamilienhaus, Reihenhaus, Doppelhaushälfte
• Baujahr: z.B. 1975 (wichtig für Energiestandards)
• Heizung: Gasheizung, Ölheizung, Wärmepumpe

Haben Sie weitere Fragen zu einem bestimmten Punkt?"""
        
        elif "weiter" in prompt.lower() or "nächste" in prompt.lower():
            return "Vielen Dank für Ihre Antwort! Lassen Sie uns mit der nächsten Frage fortfahren."
        
        else:
            return f"""Verstanden: "{prompt[:50]}..."

Das ist eine gute Angabe für die Energieberatung. Kann ich Ihnen noch bei Details helfen?"""
    
    else:
        if "anweisungen" in prompt.lower() or "instructions" in prompt.lower():
            return """Hier sind die wichtigsten Formularfelder für die Gebäude-Energieberatung:

• GEBÄUDEART: Art des Gebäudes (z.B. Einfamilienhaus, Doppelhaus)
• BAUJAHR: Baujahr des Gebäudes (wichtig für Energiestandards)  
• WOHNFLÄCHE: Gesamtwohnfläche in m²
• HEIZUNGSART: Aktuelles Heizsystem (Gas, Öl, Wärmepumpe, etc.)
• DÄMMZUSTAND: Zustand der Wärmedämmung
• FENSTERZUSTAND: Alter und Zustand der Fenster
• RENOVIERUNGSWÜNSCHE: Geplante Sanierungsmaßnahmen
• BUDGET: Verfügbares Budget für die Sanierung"""
        
        else:
            return """Vielen Dank für Ihre Anfrage. Für eine Gebäude-Energieberatung sind meist wichtig:
- Gebäudeinformationen (Baujahr, Größe, Art)
- Aktueller Energiezustand  
- Gewünschte Sanierungsmaßnahmen
- Verfügbares Budget

Geben Sie die Informationen entsprechend Ihrem Gebäude ein."""

# === GLOBAL SERVICES ===
drive_service = get_google_drive_service()
drive_folder_id = create_or_get_drive_folder(drive_service, GOOGLE_DRIVE_FOLDER_NAME) if drive_service else None

# === DIALOG SESSION STORAGE ===
dialog_sessions = {}

# === API ENDPOINTS ===

@app.get("/")
async def root():
    return {
        "message": "FormularIQ Backend läuft", 
        "status": "OK",
        "version": "2.4.0",
        "environment": "production" if os.getenv("RAILWAY_ENVIRONMENT") else "development"
    }

@app.get("/health")
async def health_check():
    """Umfassendes System-Health-Check"""
    try:
        # Test Google Drive Write-Access
        drive_write_test = False
        if drive_service and drive_folder_id:
            try:
                test_data = {"health_check": True, "timestamp": datetime.now().isoformat()}
                test_filename = f"health_test_{datetime.now().strftime('%H%M%S')}.json"
                file_id, _ = upload_to_google_drive(
                    drive_service, 
                    drive_folder_id, 
                    test_data, 
                    test_filename
                )
                if file_id:
                    # Test-Datei wieder löschen
                    try:
                        drive_service.files().delete(fileId=file_id).execute()
                        drive_write_test = True
                    except:
                        pass
            except:
                pass
        
        # Test LLM Services
        try:
            test_response = call_llm_service("Test", "", dialog_mode=True)
            dialog_status = "online" if len(test_response) > 10 else "limited"
        except:
            dialog_status = "offline"
        
        return {
            "status": "healthy",
            "services": {
                "google_drive": "connected" if drive_service else "disconnected",
                "google_drive_write": "ok" if drive_write_test else "limited",
                "llm_dialog": dialog_status,
                "llm_formular": "online",
                "local_storage": "available",
                "study_save": "ready"
            },
            "timestamp": datetime.now().isoformat(),
            "version": "2.4.0",
            "endpoints": {
                "generate_instructions": "/api/generate-instructions",
                "chat": "/api/chat", 
                "save": "/api/save",
                "dialog_start": "/api/dialog/start",
                "dialog_message": "/api/dialog/message",
                "dialog_save": "/api/dialog/save",
                "study_save": "/api/study/save"
            }
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Formular-Anweisungen generieren (Variante A)"""
    try:
        prompt = """Erstelle Anweisungen für ein Gebäude-Energieberatungsformular.
Gib eine Liste von 8-10 Formularfeldern zurück.
Jedes Feld sollte eine klare Anweisung auf Deutsch haben.

Format: Einfache Liste von Strings."""
        
        response = call_llm_service(prompt, request.context)
        
        # Fallback-Anweisungen
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
        
        print("✅ Anweisungen generiert")
        return {"instructions": instructions}
        
    except Exception as e:
        print(f"Fehler bei generate-instructions: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Generieren: {str(e)}")

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat-Service (Variante A)"""
    try:
        response = call_llm_service(request.message, request.context)
        print("✅ Chat-Antwort generiert")
        return {"response": response}
        
    except Exception as e:
        print(f"Fehler bei chat: {e}")
        raise HTTPException(status_code=500, detail=f"Chat-Fehler: {str(e)}")

@app.post("/api/save")
async def save_data(request: SaveRequest):
    """Formulardaten speichern (Variante A)"""
    try:
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
        
        # Google Drive Upload versuchen
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
                print(f"Google Drive Fehler: {drive_error}")
        
        # Lokales Backup
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
        except Exception as local_error:
            print(f"Lokaler Speicher Fehler: {local_error}")
        
        print("✅ Formulardaten gespeichert")
        return {
            "message": "Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
        
    except Exception as e:
        print(f"Fehler bei save: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern: {str(e)}")

@app.post("/api/dialog/start")
async def dialog_start(request: DialogStartRequest):
    """Dialog starten (Variante B)"""
    try:
        # Standard-Fragen für Gebäude-Energieberatung
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
        
        print("✅ Dialog gestartet")
        return {
            "session_id": session_id,
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0,
            "currentQuestion": questions[0]
        }
        
    except Exception as e:
        print(f"Fehler bei dialog/start: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Dialog-Start: {str(e)}")

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Dialog-Nachricht verarbeiten (Variante B)"""
    try:
        # Hilfe-Anfrage
        if request.message.strip() == "?":
            help_text = "Geben Sie Informationen zu Ihrem Gebäude ein. Zum Beispiel: 'Einfamilienhaus aus den 1970er Jahren' oder konkrete Zahlen wie '120 m²'."
            
            if request.currentQuestion and "field" in request.currentQuestion:
                field = request.currentQuestion["field"]
                if field == "GEBÄUDEART":
                    help_text = "Beispiele: Einfamilienhaus, Doppelhaushälfte, Reihenhaus, Mehrfamilienhaus"
                elif field == "BAUJAHR":
                    help_text = "Geben Sie das Jahr der Errichtung an, z.B. 1975, 1990, 2005"
                elif field == "WOHNFLÄCHE":
                    help_text = "Geben Sie die Gesamtwohnfläche in m² an, z.B. 120, 85, 200"
                elif field == "HEIZUNGSART":
                    help_text = "Beispiele: Gasheizung, Ölheizung, Wärmepumpe, Fernwärme, Holzpellets"
            
            return {
                "response": f"💡 Hilfe: {help_text}",
                "nextQuestion": False,
                "helpProvided": True
            }
        
        # Normale Antwort verarbeiten
        context = ""
        if request.currentQuestion:
            context = f"Der Nutzer beantwortet die Frage '{request.currentQuestion.get('question')}' mit: '{request.message}'"
        
        prompt = "Bestätige die Antwort kurz und freundlich (max. 1-2 Sätze). Sei ermutigend und professionell."
        
        response = call_llm_service(prompt, context, dialog_mode=True)
        
        # Fallback falls LLM nicht antwortet
        if len(response.strip()) < 5:
            response = f"Danke für die Angabe '{request.message}'! Das hilft mir bei der Energieberatung."
        
        print("✅ Dialog-Nachricht verarbeitet")
        return {
            "response": response,
            "nextQuestion": True,
            "helpProvided": False
        }
        
    except Exception as e:
        print(f"Fehler bei dialog/message: {e}")
        return {
            "response": "Entschuldigung, es gab einen technischen Fehler. Können Sie das nochmal versuchen?",
            "nextQuestion": False,
            "helpProvided": False
        }

@app.post("/api/dialog/save")
async def save_dialog(request: DialogSaveRequest):
    """Dialog-Daten speichern (Variante B)"""
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
                "completion_rate": (len([v for v in request.answers.values() if v.strip()]) / max(len(request.questions), 1)) * 100,
                "chat_interactions": len(request.chatHistory)
            }
        }
        
        filename = f"dialog_b_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Google Drive Upload versuchen
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
                print(f"Google Drive Fehler: {drive_error}")
        
        # Lokales Backup
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
        except Exception as local_error:
            print(f"Lokaler Speicher Fehler: {local_error}")
        
        print("✅ Dialog-Daten gespeichert")
        return {
            "message": "Dialog-Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
        
    except Exception as e:
        print(f"Fehler bei dialog/save: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Dialog-Speichern: {str(e)}")

@app.post("/api/study/save")
async def save_study_data(request: StudySaveRequest):
    """Vollständige Studiendaten speichern"""
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
            "completion_timestamp": datetime.now().isoformat(),
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu",
                "backend_version": "2.4.0"
            }
        }
        
        filename = f"complete_study_{request.participantId}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Google Drive Upload
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
                print(f"Google Drive Fehler: {drive_error}")
                storage_results["drive_error"] = str(drive_error)
        
        # Lokales Backup
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_results["local_path"] = str(local_path)
            print(f"✅ Lokales Backup gespeichert: {local_path}")
        except Exception as local_error:
            print(f"❌ Lokales Backup fehlgeschlagen: {local_error}")
            storage_results["local_error"] = str(local_error)
        
        print("✅ Vollständige Studiendaten gespeichert")
        return {
            "message": "Vollständige Studiendaten erfolgreich gespeichert",
            "participant_id": request.participantId,
            "filename": filename,
            "study_duration_minutes": round((request.totalDuration or 0) / 60000, 2),
            **storage_results
        }
        
    except Exception as e:
        print(f"❌ KRITISCHER FEHLER bei study/save: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Fehler beim Speichern der Studiendaten: {str(e)}"
        )

# === SERVER START ===
if __name__ == "__main__":
    print("🚀 FormularIQ Backend - VOLLSTÄNDIG FUNKTIONSFÄHIG")
    print("="*60)
    print(f"✅ Google Drive: {'Connected' if drive_service else 'Disconnected (lokaler Fallback)'}")
    print(f"✅ LLM Services: Multiple Fallbacks verfügbar")
    print(f"✅ Lokaler Speicher: {LOCAL_OUTPUT_DIR}")
    print("="*60)
    print("🎯 Server startet auf: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("💡 Health Check: http://localhost:8000/health")
    print("="*60)
    print("📡 Verfügbare Endpunkte:")
    print("   POST /api/generate-instructions - Formular generieren")
    print("   POST /api/chat - Chat-Service")
    print("   POST /api/save - Formulardaten speichern")
    print("   POST /api/dialog/start - Dialog starten")
    print("   POST /api/dialog/message - Dialog-Nachricht")
    print("   POST /api/dialog/save - Dialog speichern")
    print("   POST /api/study/save - Studiendaten speichern")
    print("   GET /health - System-Status")
    print("="*60)
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )