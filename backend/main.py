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

app = FastAPI(title="FormularIQ Backend - Vereinfachte Version", version="2.1.0")

# === CORS MIDDLEWARE - ERWEITERT FÜR PRODUCTION ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://*.vercel.app",
        "https://*.railway.app", 
        "*"  # Erlaubt alle Origins - für Development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === GOOGLE DRIVE SETUP ===
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = 'service-account-key.json'
DRIVE_FOLDER_NAME = 'FormularIQ_Daten'

def get_drive_service():
    """Google Drive Service initialisieren - Railway kompatibel"""
    try:
        # Für Railway Production: Service Account JSON aus Environment Variable
        service_account_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
        
        if service_account_json:
            credentials_info = json.loads(service_account_json)
            credentials = service_account.Credentials.from_service_account_info(
                credentials_info, scopes=SCOPES)
            print("✅ Google Drive Credentials aus Environment Variable geladen")
        else:
            # Fallback: Lokale Entwicklung mit JSON-Datei
            if os.path.exists(SERVICE_ACCOUNT_FILE):
                credentials = service_account.Credentials.from_service_account_file(
                    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
                print("✅ Google Drive Credentials aus lokaler Datei geladen")
            else:
                print("❌ Keine Google Drive Credentials gefunden")
                return None
        
        service = build('drive', 'v3', credentials=credentials)
        
        # Test: Versuche Drive zu verwenden
        service.files().list(pageSize=1).execute()
        print("✅ Google Drive API Test erfolgreich")
        
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
class ContextRequest(BaseModel):
    context: str

class SaveRequest(BaseModel):
    instructions: Dict[str, Any]
    values: Dict[str, str]
    filename: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""

class DialogQuestion(BaseModel):
    question: str
    field: str
    difficulty: Optional[str] = None

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
    
    # Fallback wenn LLM nicht verfügbar
    if "Formularfelder" in prompt or "JSON-Format" in prompt:
        return json.dumps({
            "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Mehrfamilienhaus)",
            "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?",
            "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern?",
            "HEIZUNGSART": "Welche Art der Heizung ist installiert? (z.B. Gas, Öl, Wärmepumpe)",
            "ENERGIEAUSWEIS": "Liegt ein Energieausweis vor? Welche Energieklasse (A+ bis H)?",
            "DÄMMUNG": "Welche Art der Dämmung ist vorhanden?"
        }, ensure_ascii=False, indent=2)
    
    return "Entschuldigung, der LLM-Service ist momentan nicht verfügbar."

# === API ENDPOINTS ===

@app.get("/")
async def root():
    return {
        "message": "FormularIQ Backend läuft", 
        "status": "online",
        "version": "2.1.0",
        "environment": "production" if os.getenv("RAILWAY_ENVIRONMENT") else "development"
    }

@app.get("/health")
async def health_check():
    """Health Check"""
    drive_service = get_drive_service()
    return {
        "status": "healthy",
        "google_drive": "connected" if drive_service else "disconnected",
        "timestamp": datetime.now().isoformat(),
        "version": "2.1.0"
    }

@app.post("/api/instructions")
async def generate_instructions(request: ContextRequest):
    """Generiert Formularfelder basierend auf Kontext"""
    try:
        context = request.context.strip() if request.context else ""
        
        if context:
            prompt = f"""
Erstelle ein Gebäudeformular basierend auf folgendem Kontext: {context}

Generiere 6-8 relevante Formularfelder im JSON-Format.
Jeder Feldname sollte in GROSSBUCHSTABEN sein.
Jeder Wert sollte eine hilfreiche Eingabeanweisung auf Deutsch sein.

Beispiel-Format:
{{
    "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an",
    "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?"
}}

Kontext: {context}
"""
        else:
            prompt = """
Erstelle ein allgemeines Gebäudeformular mit wichtigen Feldern im JSON-Format.
Jeder Feldname sollte in GROSSBUCHSTABEN sein.
Jeder Wert sollte eine hilfreiche Eingabeanweisung auf Deutsch sein.
"""
        
        response = call_llm(prompt)
        
        # Versuche JSON zu parsen
        try:
            # Extrahiere JSON aus der Antwort
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                instructions = json.loads(json_str)
                return instructions
            else:
                raise ValueError("Kein JSON gefunden")
        except Exception as parse_error:
            print(f"⚠️ JSON Parse Fehler: {parse_error}")
            # Fallback bei JSON-Parse-Fehlern
            return {
                "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an",
                "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?",
                "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern?",
                "HEIZUNGSART": "Welche Art der Heizung ist installiert?",
                "ENERGIEAUSWEIS": "Liegt ein Energieausweis vor? Welche Energieklasse?",
                "DÄMMUNG": "Welche Art der Dämmung ist vorhanden?"
            }
        
    except Exception as e:
        print(f"❌ Instructions-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Generieren der Anweisungen")

@app.post("/api/chat")
async def chat_help(request: ChatRequest):
    """Chat-Hilfe für Gebäudeformulare"""
    try:
        # Spezifische Prompts je nach Kontext
        if "Variante A" in request.context:
            prompt = f"""
Ein Nutzer braucht Hilfe beim Ausfüllen eines Gebäudeformulars (Variante A - Sichtbares Formular).

Die Formularfelder sind:
- Gebäudeart (leicht): Verschiedene Haustypen
- Baujahr (leicht): Jahr der Errichtung  
- Energieausweis (schwer): Energieklassen A+ bis H mit kWh/m²a Werten
- Sanierungsmaßnahmen (schwer): Detaillierte Planung von energetischen Sanierungen

Nutzerfrage: {request.message}

Gib eine hilfreiche, konkrete Antwort auf Deutsch in 2-3 Sätzen.
Sei freundlich und praxisorientiert. Fokussiere auf die oben genannten Themen.
"""
        else:
            prompt = f"""
Ein Nutzer braucht Hilfe beim Ausfüllen eines Gebäudeformulars (Variante B - Dialog-System).

Die Fragen sind:
- Wohnfläche (leicht): Quadratmeter-Angaben
- Heizungsart (leicht): Verschiedene Heizungssysteme  
- Dachtyp (schwer): Detaillierte Dachkonstruktionen und Materialien
- Dämmung (schwer): Komplexe Dämmstoffe und U-Werte

Nutzerfrage: {request.message}

Gib eine hilfreiche, konkrete Antwort auf Deutsch in 2-3 Sätzen.
Sei freundlich und praxisorientiert. Fokussiere auf die oben genannten Themen.
"""
        
        response = call_llm(prompt)
        return {"response": response}
        
    except Exception as e:
        print(f"❌ Chat-Fehler: {e}")
        return {"response": "Entschuldigung, ich konnte Ihre Frage nicht beantworten."}

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
            "type": "form_data_simplified",
            "variant": "A_sichtbares_formular",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values,
            "metadata": {
                "total_fields": len(request.instructions),
                "filled_fields": len([v for v in request.values.values() if v.strip()]),
                "completion_rate": f"{len([v for v in request.values.values() if v.strip()]) / len(request.instructions) * 100:.1f}%",
                "field_difficulties": {
                    field: details.get("difficulty", "unknown") 
                    for field, details in request.instructions.items() 
                    if isinstance(details, dict)
                }
            }
        }
        
        # Filename mit Zeitstempel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"variante_a_formular_{timestamp}.json"
        
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
async def start_dialog(request: ContextRequest):
    """Dialog starten mit Fragen"""
    try:
        # Feste Fragen für Variante B
        questions = [
            {"question": "Wie groß ist die Wohnfläche Ihres Gebäudes in Quadratmetern?", "field": "WOHNFLÄCHE", "difficulty": "leicht"},
            {"question": "Welche Art der Heizung ist in Ihrem Gebäude installiert?", "field": "HEIZUNGSART", "difficulty": "leicht"},
            {"question": "Welche Art von Dach hat Ihr Gebäude und aus welchen Materialien besteht es?", "field": "DACHTYP", "difficulty": "schwer"},
            {"question": "Welche Art der Dämmung ist in Ihrem Gebäude vorhanden und kennen Sie die U-Werte?", "field": "DÄMMUNG", "difficulty": "schwer"}
        ]
        
        return {
            "questions": questions,
            "totalQuestions": len(questions),
            "currentQuestionIndex": 0
        }
        
    except Exception as e:
        print(f"❌ Dialog-Start-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Starten des Dialogs")

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Dialog-Nachricht verarbeiten"""
    try:
        user_message = request.message.strip()
        
        if user_message == "?":
            # Hilfe angefordert
            help_text = f"Sie beantworten gerade die Frage: '{request.currentQuestion.question}'. Brauchen Sie spezifische Hilfe zu diesem Thema?"
            return {
                "response": help_text,
                "nextQuestion": False,
                "questionIndex": request.questionIndex,
                "helpProvided": True
            }
        else:
            # Antwort gegeben - zur nächsten Frage
            if request.questionIndex < request.totalQuestions - 1:
                return {
                    "response": "Danke für Ihre Antwort! Weiter zur nächsten Frage:",
                    "nextQuestion": True,
                    "questionIndex": request.questionIndex + 1,
                    "helpProvided": False
                }
            else:
                return {
                    "response": "🎉 Alle Fragen beantwortet! Sie können nun die Umfrage beenden.",
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
            "type": "dialog_data_simplified",
            "variant": "B_dialog_system",
            "timestamp": datetime.now().isoformat(),
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory,
            "metadata": {
                "total_questions": len(request.questions),
                "answered_questions": len(request.answers),
                "completion_rate": f"{len(request.answers) / len(request.questions) * 100:.1f}%",
                "chat_interactions": len(request.chatHistory),
                "question_difficulties": {
                    q.field: q.difficulty for q in request.questions if hasattr(q, 'difficulty')
                }
            }
        }
        
        # Filename mit Zeitstempel
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"variante_b_dialog_{timestamp}.json"
        
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
    print(f"🚀 FormularIQ Backend - Vereinfachte Version")
    print(f"📁 Google Drive Ordner: {DRIVE_FOLDER_NAME}")
    print(f"🌐 Server läuft auf Port {port}")
    print(f"📝 Variante A: 4 Felder (Gebäudeart, Baujahr, Energieausweis, Sanierung)")
    print(f"💬 Variante B: 4 Fragen (Wohnfläche, Heizung, Dach, Dämmung)")
    
    # Google Drive Test
    drive_service = get_drive_service()
    if drive_service:
        print("✅ Google Drive Service erfolgreich initialisiert")
    else:
        print("❌ Google Drive Service nicht verfügbar - prüfe service-account-key.json")
    
    uvicorn.run(app, host="0.0.0.0", port=port)