from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import os
import uvicorn
from datetime import datetime
import aiofiles
import asyncio
from pathlib import Path

# === GOOGLE DRIVE IMPORTS ===
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

app = FastAPI(title="FormularIQ Backend mit Google Drive", version="2.0.0")

# === CORS MIDDLEWARE ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === GOOGLE DRIVE SETUP ===
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = 'service-account-key.json'
DRIVE_FOLDER_NAME = 'FormularIQ_Daten'

def get_drive_service():
    """Google Drive Service initialisieren"""
    try:
        credentials = service_account.Credentials.from_service_account_file(
            SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        service = build('drive', 'v3', credentials=credentials)
        return service
    except Exception as e:
        print(f"❌ Google Drive Setup Fehler: {e}")
        return None

def create_or_get_folder(service, folder_name):
    """Ordner erstellen oder finden"""
    try:
        # Suche existierenden Ordner
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'",
            fields="files(id, name)"
        ).execute()
        
        if results['files']:
            return results['files'][0]['id']
        
        # Neuen Ordner erstellen
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=file_metadata, fields='id').execute()
        print(f"✅ Ordner '{folder_name}' erstellt: {folder.get('id')}")
        return folder.get('id')
        
    except Exception as e:
        print(f"❌ Ordner-Fehler: {e}")
        return None

def upload_to_drive(service, data, filename, folder_id):
    """Datei zu Google Drive hochladen"""
    try:
        # JSON-Daten in String konvertieren
        json_content = json.dumps(data, ensure_ascii=False, indent=2)
        
        # Upload vorbereiten
        file_metadata = {
            'name': filename,
            'parents': [folder_id] if folder_id else []
        }
        
        # Media Upload
        media = MediaIoBaseUpload(
            io.BytesIO(json_content.encode('utf-8')),
            mimetype='application/json'
        )
        
        # Upload durchführen
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()
        
        print(f"✅ Datei hochgeladen: {file.get('name')} (ID: {file.get('id')})")
        return file.get('id'), file.get('webViewLink')
        
    except Exception as e:
        print(f"❌ Upload-Fehler: {e}")
        return None, None

# === PYDANTIC MODELS ===
class GenerateRequest(BaseModel):
    context: str

class SaveRequest(BaseModel):
    instructions: Dict[str, Any]
    values: Dict[str, str]
    filename: str

class ChatRequest(BaseModel):
    message: str
    context: str

class DialogStartRequest(BaseModel):
    context: str = ""

class DialogQuestion(BaseModel):
    question: str
    field: str

class DialogMessageRequest(BaseModel):
    message: str
    currentQuestion: DialogQuestion
    questionIndex: int
    totalQuestions: int

class DialogSaveRequest(BaseModel):
    questions: List[DialogQuestion]
    answers: Dict[str, str]
    chatHistory: List[Dict[str, Any]]
    filename: str

# === LLM INTEGRATION ===
def call_llm(prompt: str, max_retries: int = 3) -> str:
    """LLM-Aufruf mit Ollama"""
    import subprocess
    
    for attempt in range(max_retries):
        try:
            result = subprocess.run([
                'ollama', 'run', 'llama3',
                prompt
            ], capture_output=True, text=True, timeout=30)
            
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
            else:
                print(f"⚠️ LLM Versuch {attempt + 1} fehlgeschlagen")
                
        except subprocess.TimeoutExpired:
            print(f"⚠️ LLM Timeout bei Versuch {attempt + 1}")
        except Exception as e:
            print(f"⚠️ LLM Fehler bei Versuch {attempt + 1}: {e}")
    
    return "Entschuldigung, der LLM-Service ist momentan nicht verfügbar."

# === API ENDPOINTS ===

@app.get("/health")
async def health_check():
    """Health Check"""
    drive_service = get_drive_service()
    return {
        "status": "healthy",
        "google_drive": "connected" if drive_service else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/generate")
async def generate_instructions(request: GenerateRequest):
    """Formular-Anweisungen generieren"""
    try:
        prompt = f"""
Erstelle ein JSON-Objekt mit Formularfeldern basierend auf diesem Kontext: {request.context}

Das JSON sollte folgende Struktur haben:
{{
  "FELDNAME": {{
    "label": "Benutzerfreundliche Bezeichnung",
    "type": "text|number|email|tel|date|select",
    "required": true/false,
    "placeholder": "Hilfstext",
    "options": ["Option1", "Option2"] // nur bei type: "select"
  }}
}}

Erstelle 5-10 relevante Felder. Antworte nur mit dem JSON, keine Erklärungen.
"""
        
        llm_response = call_llm(prompt)
        
        try:
            instructions = json.loads(llm_response)
            return {"instructions": instructions}
        except json.JSONDecodeError:
            print(f"⚠️ JSON-Parse-Fehler: {llm_response}")
            
            # Fallback-Formular
            return {"instructions": {
                "NAME": {
                    "label": "Name",
                    "type": "text",
                    "required": True,
                    "placeholder": "Ihr vollständiger Name"
                },
                "EMAIL": {
                    "label": "E-Mail",
                    "type": "email",
                    "required": True,
                    "placeholder": "ihre@email.de"
                },
                "NACHRICHT": {
                    "label": "Nachricht",
                    "type": "text",
                    "required": False,
                    "placeholder": "Ihre Nachricht oder Anmerkungen"
                }
            }}
            
    except Exception as e:
        print(f"❌ Generate-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Generieren")

@app.post("/api/chat")
async def chat_help(request: ChatRequest):
    """Chat-Hilfe"""
    try:
        prompt = f"""
Kontext: {request.context}

Nutzerfrage: {request.message}

Gib eine hilfreiche, kurze Antwort auf Deutsch (2-3 Sätze).
"""
        
        response = call_llm(prompt)
        return {"response": response}
        
    except Exception as e:
        print(f"❌ Chat-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Chat-Service nicht verfügbar")

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Formulardaten in Google Drive speichern"""
    try:
        # Google Drive Service
        drive_service = get_drive_service()
        if not drive_service:
            raise HTTPException(status_code=500, detail="Google Drive nicht verfügbar")
        
        # Ordner erstellen/finden
        folder_id = create_or_get_folder(drive_service, DRIVE_FOLDER_NAME)
        
        # Daten vorbereiten
        save_data = {
            "type": "form_data",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values,
            "metadata": {
                "total_fields": len(request.instructions),
                "filled_fields": len([v for v in request.values.values() if v.strip()]),
                "completion_rate": f"{len([v for v in request.values.values() if v.strip()]) / len(request.instructions) * 100:.1f}%"
            }
        }
        
        # Filename mit Zeitstempel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"formular_data_{timestamp}.json"
        
        # Upload zu Google Drive
        file_id, web_link = upload_to_drive(drive_service, save_data, filename, folder_id)
        
        if file_id:
            return {
                "message": "✅ Daten erfolgreich in Google Drive gespeichert!",
                "filename": filename,
                "google_drive_id": file_id,
                "web_link": web_link,
                "folder": DRIVE_FOLDER_NAME
            }
        else:
            raise HTTPException(status_code=500, detail="Upload zu Google Drive fehlgeschlagen")
            
    except Exception as e:
        print(f"❌ Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern in Google Drive")

@app.post("/api/dialog/start")
async def start_dialog(request: DialogStartRequest):
    """Dialog starten"""
    try:
        if request.context:
            prompt = f"""
Basierend auf diesem Kontext: {request.context}

Erstelle 5-7 präzise Fragen für einen strukturierten Dialog. 

Antworte mit einem JSON-Array:
[
  {{"question": "Frage 1?", "field": "FELDNAME1"}},
  {{"question": "Frage 2?", "field": "FELDNAME2"}}
]

Nur JSON, keine Erklärungen.
"""
            
            llm_response = call_llm(prompt)
            
            try:
                questions = json.loads(llm_response)
            except json.JSONDecodeError:
                print(f"⚠️ Dialog-JSON-Fehler: {llm_response}")
                questions = [
                    {"question": "Welche Art von Gebäude möchten Sie erfassen?", "field": "GEBÄUDEART"},
                    {"question": "In welchem Jahr wurde das Gebäude errichtet?", "field": "BAUJAHR"},
                    {"question": "Wie groß ist die Wohnfläche in Quadratmetern?", "field": "WOHNFLÄCHE"},
                    {"question": "Welche Art der Heizung ist installiert?", "field": "HEIZUNGSART"},
                    {"question": "Welche Art von Dach hat das Gebäude?", "field": "DACHTYP"}
                ]
        else:
            questions = [
                {"question": "Welche Art von Gebäude möchten Sie erfassen?", "field": "GEBÄUDEART"},
                {"question": "In welchem Jahr wurde das Gebäude errichtet?", "field": "BAUJAHR"},
                {"question": "Wie groß ist die Wohnfläche in Quadratmetern?", "field": "WOHNFLÄCHE"},
                {"question": "Welche Art der Heizung ist installiert?", "field": "HEIZUNGSART"},
                {"question": "Welche Art von Dach hat das Gebäude?", "field": "DACHTYP"}
            ]
        
        return {
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0
        }
        
    except Exception as e:
        print(f"❌ Dialog-Start-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Dialog-Start fehlgeschlagen")

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Dialog-Nachricht verarbeiten"""
    try:
        user_message = request.message.strip()
        
        if user_message == "?":
            # Hilfe-Anfrage
            current_field = request.currentQuestion.field
            current_question = request.currentQuestion.question
            
            prompt = f"""
Der Nutzer braucht Hilfe bei der Frage: "{current_question}"
Feld: {current_field}

Gib eine hilfreiche Erklärung in 2-3 Sätzen auf Deutsch.
Sei spezifisch und hilfreich, keine allgemeinen Phrasen.
"""
            help_response = call_llm(prompt)
            
            return {
                "response": help_response,
                "nextQuestion": False,
                "questionIndex": request.questionIndex,
                "helpProvided": True
            }
        else:
            # Normale Antwort verarbeiten
            if request.questionIndex < request.totalQuestions - 1:
                return {
                    "response": f"✅ Ihre Antwort '{user_message}' wurde gespeichert. Nächste Frage:",
                    "nextQuestion": True,
                    "questionIndex": request.questionIndex + 1,
                    "helpProvided": False
                }
            else:
                return {
                    "response": "🎉 Herzlichen Glückwunsch! Sie haben alle Fragen beantwortet. Ihre Daten werden automatisch gespeichert.",
                    "nextQuestion": False,
                    "questionIndex": request.questionIndex,
                    "dialogComplete": True,
                    "helpProvided": False
                }
        
    except Exception as e:
        print(f"❌ Dialog-Message-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Dialog-Verarbeitung fehlgeschlagen")

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Dialog-Daten in Google Drive speichern"""
    try:
        # Google Drive Service
        drive_service = get_drive_service()
        if not drive_service:
            raise HTTPException(status_code=500, detail="Google Drive nicht verfügbar")
        
        # Ordner erstellen/finden
        folder_id = create_or_get_folder(drive_service, DRIVE_FOLDER_NAME)
        
        # Daten strukturieren
        save_data = {
            "type": "dialog_data",
            "timestamp": datetime.now().isoformat(),
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory,
            "metadata": {
                "total_questions": len(request.questions),
                "answered_questions": len(request.answers),
                "completion_rate": f"{len(request.answers) / len(request.questions) * 100:.1f}%",
                "chat_interactions": len(request.chatHistory)
            }
        }
        
        # Filename mit Zeitstempel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"dialog_data_{timestamp}.json"
        
        # Upload zu Google Drive
        file_id, web_link = upload_to_drive(drive_service, save_data, filename, folder_id)
        
        if file_id:
            return {
                "message": "✅ Dialog-Daten erfolgreich in Google Drive gespeichert!",
                "filename": filename,
                "google_drive_id": file_id,
                "web_link": web_link,
                "folder": DRIVE_FOLDER_NAME
            }
        else:
            raise HTTPException(status_code=500, detail="Upload zu Google Drive fehlgeschlagen")
            
    except Exception as e:
        print(f"❌ Dialog-Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Dialog-Speicher-Fehler")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 FormularIQ Backend mit Google Drive Integration")
    print(f"📁 Google Drive Ordner: {DRIVE_FOLDER_NAME}")
    print(f"🌐 Server läuft auf Port {port}")
    
    # Google Drive Test
    drive_service = get_drive_service()
    if drive_service:
        print("✅ Google Drive Service erfolgreich initialisiert")
    else:
        print("❌ Google Drive Service nicht verfügbar - prüfe service-account-key.json")
    
    uvicorn.run(app, host="0.0.0.0", port=port)