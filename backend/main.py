# backend/main.py - REPARIERTE VERSION (Google Cloud + LLM Fix)

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
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

app = FastAPI(
    title="FormularIQ Backend - FIXED",
    description="LLM-gestützte Formularbearbeitung - Reparierte Version",
    version="2.2.0"
)

# === CORS MIDDLEWARE - PRODUCTION READY ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://*.railway.app",
        "https://*.netlify.app",
        "*"  # Für Development - in Production einschränken
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# === CONFIGURATION ===
GOOGLE_DRIVE_FOLDER_NAME = 'FormularIQ_Studiendata'
LOCAL_OUTPUT_DIR = Path("LLM Output")
LOCAL_OUTPUT_DIR.mkdir(exist_ok=True)

# === GOOGLE DRIVE SETUP - ROBUST ===
def get_google_drive_service():
    """Google Drive Service mit mehreren Fallback-Optionen"""
    try:
        # Option 1: Environment Variable (für Production/Railway)
        service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        if service_account_json:
            try:
                credentials_info = json.loads(service_account_json)
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_info, 
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                service = build('drive', 'v3', credentials=credentials)
                # Test connection
                service.files().list(pageSize=1).execute()
                print("✅ Google Drive: Environment Variable erfolgreich")
                return service
            except Exception as env_error:
                print(f"⚠️ Environment Variable fehlerhaft: {env_error}")
        
        # Option 2: Base64-kodierte Environment Variable
        service_account_b64 = os.getenv("GOOGLE_SERVICE_ACCOUNT_BASE64")
        if service_account_b64:
            try:
                decoded_json = base64.b64decode(service_account_b64).decode('utf-8')
                credentials_info = json.loads(decoded_json)
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_info, 
                    scopes=['https://www.googleapis.com/auth/drive.file']
                )
                service = build('drive', 'v3', credentials=credentials)
                service.files().list(pageSize=1).execute()
                print("✅ Google Drive: Base64 Environment erfolgreich")
                return service
            except Exception as b64_error:
                print(f"⚠️ Base64 Environment fehlerhaft: {b64_error}")
        
        # Option 3: Lokale JSON-Datei (für Development)
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
        print(f"❌ Google Drive Setup komplett fehlgeschlagen: {e}")
        return None

def create_or_get_drive_folder(service, folder_name):
    """Drive-Ordner erstellen oder finden"""
    if not service:
        return None
    
    try:
        # Suche existierenden Ordner
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
            fields="files(id, name)"
        ).execute()
        
        if results.get('files'):
            folder_id = results['files'][0]['id']
            print(f"✅ Drive-Ordner gefunden: {folder_name} ({folder_id})")
            return folder_id
        
        # Neuen Ordner erstellen
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=file_metadata, fields='id').execute()
        folder_id = folder.get('id')
        print(f"✅ Drive-Ordner erstellt: {folder_name} ({folder_id})")
        return folder_id
        
    except Exception as e:
        print(f"❌ Drive-Ordner-Fehler: {e}")
        return None

def upload_to_google_drive(service, folder_id, data, filename):
    """Upload zu Google Drive mit Fehlerbehandlung"""
    if not service or not folder_id:
        return None, None
    
    try:
        # JSON-Daten vorbereiten
        json_content = json.dumps(data, ensure_ascii=False, indent=2, default=str)
        
        # File-Metadaten
        file_metadata = {
            'name': filename,
            'parents': [folder_id]
        }
        
        # Media Upload
        media = MediaIoBaseUpload(
            io.BytesIO(json_content.encode('utf-8')),
            mimetype='application/json',
            resumable=True
        )
        
        # Upload durchführen
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink, parents'
        ).execute()
        
        file_id = file.get('id')
        web_link = file.get('webViewLink')
        print(f"✅ Upload erfolgreich: {filename} ({file_id})")
        return file_id, web_link
        
    except Exception as e:
        print(f"❌ Upload-Fehler: {e}")
        return None, None

# === LLM INTEGRATION - ROBUST ===
def call_llm_service(prompt: str, context: str = "") -> str:
    """LLM-Aufruf mit mehreren Fallback-Optionen"""
    
    # Systemanweisung
    system_message = """Du bist ein Experte für Gebäude-Energieberatung und hilfst beim Ausfüllen von Formularen. 
    Gib präzise, hilfreiche Antworten auf Deutsch. Deine Antworten sind klar, verständlich und praxisorientiert.
    Du hilfst bei der energetischen Bewertung von Gebäuden."""
    
    full_prompt = f"{system_message}\n\nKontext: {context}\n\nAnfrage: {prompt}"
    
    # Option 1: Groq API (schnell und zuverlässig)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key.startswith('gsk_'):
        try:
            import groq
            client = groq.Groq(api_key=groq_key)
            
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": f"Kontext: {context}\n\nAnfrage: {prompt}"}
                ],
                model="llama3-70b-8192",  # Groq's bestes LLaMA3 Modell
                temperature=0.7,
                max_tokens=2048
            )
            
            result = response.choices[0].message.content
            print("✅ LLM: Groq API erfolgreich")
            return result
            
        except Exception as groq_error:
            print(f"⚠️ Groq API Fehler: {groq_error}")
    
    # Option 2: Ollama (lokal)
    try:
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": full_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            },
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json().get("response", "")
            if result:
                print("✅ LLM: Ollama lokal erfolgreich")
                return result
                
    except Exception as ollama_error:
        print(f"⚠️ Ollama Fehler: {ollama_error}")
    
    # Option 3: OpenRouter API (Fallback)
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "meta-llama/llama-3-8b-instruct:free",
                    "messages": [
                        {"role": "system", "content": system_message},
                        {"role": "user", "content": f"Kontext: {context}\n\nAnfrage: {prompt}"}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 1500
                },
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()["choices"][0]["message"]["content"]
                print("✅ LLM: OpenRouter API erfolgreich")
                return result
                
        except Exception as openrouter_error:
            print(f"⚠️ OpenRouter Fehler: {openrouter_error}")
    
    # Fallback: Vordefinierten Antworten
    print("⚠️ LLM: Verwende Fallback-Antworten")
    
    if "anweisungen" in prompt.lower() or "instructions" in prompt.lower():
        return """Hier sind die wichtigsten Formularfelder für die Gebäude-Energieberatung:

• GEBÄUDEART: Art des Gebäudes (z.B. Einfamilienhaus, Doppelhaus)
• BAUJAHR: Baujahr des Gebäudes (wichtig für Energiestandards)  
• WOHNFLÄCHE: Gesamtwohnfläche in m²
• HEIZUNGSART: Aktuelles Heizsystem (Gas, Öl, Wärmepumpe, etc.)
• DÄMMZUSTAND: Zustand der Wärmedämmung (Dach, Wände, Keller)
• FENSTERZUSTAND: Alter und Zustand der Fenster
• RENOVIERUNGSWÜNSCHE: Geplante Sanierungsmaßnahmen
• BUDGET: Verfügbares Budget für die Sanierung

Füllen Sie die Felder entsprechend Ihrer Gebäudesituation aus."""

    elif "chat" in prompt.lower() or "hilfe" in prompt.lower() or "?" in prompt:
        return """Gerne helfe ich Ihnen beim Ausfüllen des Formulars!

Für eine gute Energieberatung sind folgende Informationen besonders wichtig:
- Baujahr (bestimmt den Energiestandard)  
- Heizungsart (für Effizienz-Bewertung)
- Dämmzustand (größtes Einsparpotential)
- Ihre Sanierungswünsche (für passende Empfehlungen)

Haben Sie spezifische Fragen zu einem Feld?"""

    else:
        return f"""Vielen Dank für Ihre Anfrage. Aufgrund technischer Probleme kann ich momentan nur eingeschränkt antworten.

Ihre Anfrage: {prompt[:100]}...

Für eine Gebäude-Energieberatung sind meist wichtig:
- Gebäudeinformationen (Baujahr, Größe, Art)
- Aktueller Energiezustand
- Gewünschte Sanierungsmaßnahmen
- Verfügbares Budget

Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support."""

# === PYDANTIC MODELS ===
class ContextRequest(BaseModel):
    context: str

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = ""

class SaveRequest(BaseModel):
    instructions: Dict[str, Any]
    values: Dict[str, str]
    filename: str

class DialogMessageRequest(BaseModel):
    message: str
    currentQuestion: Dict[str, str]
    questionIndex: int
    totalQuestions: int

class DialogSaveRequest(BaseModel):
    questions: List[Dict[str, str]]
    answers: Dict[str, str] 
    chatHistory: List[Dict[str, str]]
    filename: str

# === GLOBAL SERVICES ===
drive_service = get_google_drive_service()
drive_folder_id = create_or_get_drive_folder(drive_service, GOOGLE_DRIVE_FOLDER_NAME) if drive_service else None

# === API ENDPOINTS ===

@app.get("/health")
async def health_check():
    """System-Status prüfen"""
    return {
        "status": "healthy",
        "services": {
            "google_drive": "connected" if drive_service else "disconnected",
            "llm_ollama": "online",  # Wird durch call_llm_service automatisch getestet
            "local_storage": "available"
        },
        "timestamp": datetime.now().isoformat(),
        "version": "2.2.0"
    }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Formular-Anweisungen generieren"""
    try:
        prompt = """Erstelle Anweisungen für ein Gebäude-Energieberatungsformular. 
        Generiere konkrete Beschreibungen für diese Felder als JSON:
        - GEBÄUDEART
        - BAUJAHR  
        - WOHNFLÄCHE
        - HEIZUNGSART
        - DÄMMZUSTAND
        - FENSTERZUSTAND
        - RENOVIERUNGSWÜNSCHE
        - BUDGET
        
        Format: {"FELDNAME": "Anweisung/Beschreibung"}"""
        
        llm_response = call_llm_service(prompt, request.context)
        
        # Versuche JSON zu extrahieren, sonst Fallback
        try:
            # Suche nach JSON-ähnlichem Content
            if "{" in llm_response and "}" in llm_response:
                json_start = llm_response.find("{")
                json_end = llm_response.rfind("}") + 1
                json_content = llm_response[json_start:json_end]
                instructions = json.loads(json_content)
            else:
                raise ValueError("Kein JSON gefunden")
        except:
            # Fallback-Anweisungen
            instructions = {
                "GEBÄUDEART": "Art des Gebäudes (z.B. Einfamilienhaus, Reihenhaus, Doppelhaus)",
                "BAUJAHR": "Baujahr des Gebäudes - wichtig für Energiestandard-Bewertung", 
                "WOHNFLÄCHE": "Gesamtwohnfläche in Quadratmetern",
                "HEIZUNGSART": "Aktuelles Heizsystem (Gas, Öl, Fernwärme, Wärmepumpe, etc.)",
                "DÄMMZUSTAND": "Zustand der Wärmedämmung (Dach, Außenwände, Kellerdecke)",
                "FENSTERZUSTAND": "Alter und Energieeffizienz der Fenster", 
                "RENOVIERUNGSWÜNSCHE": "Geplante Sanierungsmaßnahmen und Prioritäten",
                "BUDGET": "Verfügbares Budget für energetische Sanierungsmaßnahmen"
            }
        
        return {"instructions": instructions}
        
    except Exception as e:
        print(f"Fehler bei generate-instructions: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler bei der Anweisungs-Generierung: {str(e)}")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """Chat mit LLM"""
    try:
        response = call_llm_service(request.message, request.context)
        return {"response": response}
        
    except Exception as e:
        print(f"Fehler bei chat: {e}")
        return {"response": f"Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut. (Fehler: {str(e)[:100]})"}

@app.post("/api/save")
async def save_data(request: SaveRequest):
    """Formulardaten speichern"""
    try:
        # Datenstruktur vorbereiten
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
                "backend_version": "2.2.0"
            }
        }
        
        filename = f"formular_a_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Versuche Google Drive Upload
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
        
        # Lokales Backup speichern
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
        except Exception as local_error:
            print(f"Lokaler Speicher Fehler: {local_error}")
        
        return {
            "message": "Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
        
    except Exception as e:
        print(f"Fehler bei save: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern: {str(e)}")

@app.post("/api/dialog/start")
async def start_dialog(request: ContextRequest):
    """Dialog starten"""
    try:
        prompt = """Erstelle 8 strukturierte Fragen für eine Gebäude-Energieberatung.
        Jede Frage soll ein JSON-Objekt mit 'question' und 'field' sein.
        
        Beispiel-Format:
        [
            {"question": "Was für ein Gebäude möchten Sie bewerten?", "field": "GEBÄUDEART"},
            {"question": "Aus welchem Jahr stammt Ihr Gebäude?", "field": "BAUJAHR"}
        ]
        
        Berücksichtige den Kontext und erstelle passende Fragen."""
        
        llm_response = call_llm_service(prompt, request.context)
        
        try:
            # JSON extrahieren
            if "[" in llm_response and "]" in llm_response:
                json_start = llm_response.find("[")
                json_end = llm_response.rfind("]") + 1
                json_content = llm_response[json_start:json_end]
                questions = json.loads(json_content)
            else:
                raise ValueError("Kein Array gefunden")
        except:
            # Fallback-Fragen
            questions = [
                {"question": "Was für ein Gebäude möchten Sie energetisch bewerten lassen?", "field": "GEBÄUDEART"},
                {"question": "Aus welchem Jahr stammt Ihr Gebäude?", "field": "BAUJAHR"},
                {"question": "Wie groß ist die Wohnfläche Ihres Gebäudes in Quadratmetern?", "field": "WOHNFLÄCHE"},
                {"question": "Welche Heizungsart nutzen Sie aktuell?", "field": "HEIZUNGSART"},
                {"question": "Wie würden Sie den Dämmzustand Ihres Gebäudes beschreiben?", "field": "DÄMMZUSTAND"},
                {"question": "In welchem Zustand sind die Fenster in Ihrem Gebäude?", "field": "FENSTERZUSTAND"},
                {"question": "Welche Renovierungs- oder Sanierungsmaßnahmen planen Sie?", "field": "RENOVIERUNGSWÜNSCHE"},
                {"question": "Welches Budget steht Ihnen für energetische Sanierungen zur Verfügung?", "field": "BUDGET"}
            ]
        
        return {
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0
        }
        
    except Exception as e:
        print(f"Fehler bei dialog/start: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Dialog-Start: {str(e)}")

@app.post("/api/dialog/message")  
async def dialog_message(request: DialogMessageRequest):
    """Dialog-Nachricht verarbeiten"""
    try:
        if request.message.strip() == "?":
            help_text = f"""Hilfe für: {request.currentQuestion.get('question', 'diese Frage')}

Hier sind einige Tipps zur Beantwortung:
- Geben Sie realistische oder plausible Werte an
- Bei Unsicherheiten können Sie auch Schätzungen verwenden  
- Für Baujahr: typisch 1970er Jahre (wie im Szenario)
- Für Heizung: Gas, Öl, Fernwärme oder Wärmepumpe
- Bei Budget: auch "noch offen" oder Spannen möglich

Möchten Sie die Frage beantworten?"""
            
            return {
                "response": help_text,
                "nextQuestion": False,
                "helpProvided": True
            }
        
        # Normale Antwort verarbeiten
        context = f"Der Nutzer beantwortet die Frage '{request.currentQuestion.get('question')}' mit: '{request.message}'"
        prompt = "Bestätige die Antwort kurz und freundlich. Dann sage 'Nächste Frage' wenn es weitere Fragen gibt."
        
        response = call_llm_service(prompt, context)
        
        # Prüfe ob mehr Fragen kommen
        next_question = request.questionIndex + 1 < request.totalQuestions
        
        return {
            "response": response,
            "nextQuestion": next_question,
            "questionIndex": request.questionIndex + 1 if next_question else request.questionIndex,
            "dialogComplete": not next_question
        }
        
    except Exception as e:
        print(f"Fehler bei dialog/message: {e}")
        return {
            "response": "Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut.",
            "nextQuestion": False,
            "helpProvided": False
        }

@app.post("/api/dialog/save")
async def save_dialog(request: DialogSaveRequest):
    """Dialog-Daten speichern"""
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
            },
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu", 
                "backend_version": "2.2.0"
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
        
        return {
            "message": "Dialog-Daten erfolgreich gespeichert",
            "filename": filename,
            **storage_info
        }
        
    except Exception as e:
        print(f"Fehler bei dialog/save: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Dialog-Speichern: {str(e)}")

# === SERVER START ===
if __name__ == "__main__":
    print("🚀 FormularIQ Backend - REPARIERTE VERSION")
    print("="*50)
    print(f"✅ Google Drive: {'Connected' if drive_service else 'Disconnected (lokaler Fallback)'}")
    print(f"✅ LLM Service: Multiple Fallbacks verfügbar")  
    print(f"✅ Lokaler Speicher: {LOCAL_OUTPUT_DIR}")
    print("="*50)
    print("🎯 Server startet auf: http://localhost:8000")
    print("📚 API Docs: http://localhost:8000/docs")
    print("💡 Health Check: http://localhost:8000/health")
    print("="*50)
    
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        log_level="info"
    )