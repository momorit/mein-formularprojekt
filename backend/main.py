from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import os
import uvicorn
from datetime import datetime
from pathlib import Path
import httpx
import base64

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️ python-dotenv nicht installiert. Umgebungsvariablen müssen manuell gesetzt werden.")
    pass

# === GOOGLE DRIVE IMPORTS ===
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io

app = FastAPI(
    title="FormularIQ - Wissenschaftliche Formularanalyse",
    description="Backend für LLM-gestützte Formularbearbeitung im Rahmen einer wissenschaftlichen Studie",
    version="1.0.0"
)

# === CORS MIDDLEWARE ===
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === GOOGLE DRIVE CONFIGURATION ===
SCOPES = ['https://www.googleapis.com/auth/drive.file']
SERVICE_ACCOUNT_FILE = 'service-account-key.json'
DRIVE_FOLDER_NAME = 'FormularIQ_Studiendata'

def get_drive_service():
    """Google Drive Service initialisieren"""
    try:
        # Production: Base64-encoded Service Account Key
        base64_key = os.getenv("GOOGLE_SERVICE_ACCOUNT_KEY_BASE64")
        if base64_key:
            decoded_key = base64.b64decode(base64_key).decode('utf-8')
            service_account_info = json.loads(decoded_key)
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info, scopes=SCOPES)
        # Development: JSON file
        elif os.path.exists(SERVICE_ACCOUNT_FILE):
            credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        else:
            print(f"⚠️ Keine Google Service Account Credentials gefunden")
            print(f"   Lokale Datei: {SERVICE_ACCOUNT_FILE}")
            print(f"   Umgebungsvariable: GOOGLE_SERVICE_ACCOUNT_KEY_BASE64")
            return None
            
        service = build('drive', 'v3', credentials=credentials)
        return service
    except Exception as e:
        print(f"❌ Google Drive Setup Fehler: {e}")
        return None

def create_or_get_folder(service, folder_name):
    """Studienordner erstellen oder finden"""
    try:
        # Suche existierenden Ordner
        results = service.files().list(
            q=f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'",
            fields="files(id, name)"
        ).execute()
        
        if results['files']:
            return results['files'][0]['id']
        
        # Neuen Studienordner erstellen
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=file_metadata, fields='id').execute()
        print(f"✅ Studienordner erstellt: {folder_name} (ID: {folder.get('id')})")
        return folder.get('id')
        
    except Exception as e:
        print(f"❌ Ordner-Fehler: {e}")
        return None

def upload_to_drive(service, data, filename, folder_id):
    """Studiendaten zu Google Drive hochladen"""
    try:
        # JSON-Daten mit Metadaten erweitern
        enhanced_data = {
            **data,
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu",
                "upload_timestamp": datetime.now().isoformat(),
                "backend_version": "1.0.0"
            }
        }
        
        json_content = json.dumps(enhanced_data, ensure_ascii=False, indent=2)
        
        # Upload vorbereiten
        file_metadata = {
            'name': filename,
            'parents': [folder_id] if folder_id else [],
            'description': f'Studiendaten - FormularIQ - {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
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
            fields='id, name, webViewLink, createdTime'
        ).execute()
        
        print(f"✅ Studiendaten hochgeladen: {file.get('name')} (ID: {file.get('id')})")
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

# === LLM INTEGRATION (GROQ) ===
import httpx
import json as json_module

def call_llm(prompt: str, max_retries: int = 3) -> str:
    """LLM-Aufruf mit Groq API"""
    
    # Groq API Configuration
    GROQ_API_KEY = os.getenv("GROQ_API_KEY")
    if not GROQ_API_KEY:
        print("❌ GROQ_API_KEY nicht gefunden in Umgebungsvariablen")
        return "Der LLM-Service ist nicht konfiguriert. Bitte setzen Sie GROQ_API_KEY."
    
    GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
    
    for attempt in range(max_retries):
        try:
            # Groq API Request
            headers = {
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama3-8b-8192",  # Groq's LLaMA3 model
                "messages": [
                    {
                        "role": "system",
                        "content": "Du bist ein hilfreicher Assistent für Gebäudeformulare. Antworte präzise und auf Deutsch."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                "max_tokens": 1000,
                "temperature": 0.3,
                "top_p": 0.9
            }
            
            with httpx.Client(timeout=30.0) as client:
                response = client.post(GROQ_API_URL, headers=headers, json=payload)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get("choices") and len(data["choices"]) > 0:
                        content = data["choices"][0]["message"]["content"]
                        return content.strip()
                    else:
                        print(f"⚠️ Groq API: Keine Antwort in Response (Versuch {attempt + 1})")
                else:
                    print(f"⚠️ Groq API HTTP {response.status_code} (Versuch {attempt + 1}): {response.text}")
                    
        except httpx.TimeoutException:
            print(f"⚠️ Groq API Timeout (Versuch {attempt + 1})")
        except Exception as e:
            print(f"⚠️ Groq API Fehler (Versuch {attempt + 1}): {e}")
    
    return "Der LLM-Service ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut."

# === API ENDPOINTS ===

@app.get("/")
async def root():
    """Hauptendpunkt mit Systeminformationen"""
    drive_service = get_drive_service()
    return {
        "project": "FormularIQ - Wissenschaftliche Studie",
        "status": "online",
        "version": "1.0.0",
        "google_drive": "connected" if drive_service else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """System-Health-Check"""
    drive_service = get_drive_service()
    
    # Groq API Test
    groq_status = "online"
    groq_api_key = os.getenv("GROQ_API_KEY")
    if not groq_api_key:
        groq_status = "no_api_key"
    else:
        try:
            # Quick test call to Groq API
            headers = {"Authorization": f"Bearer {groq_api_key}"}
            test_payload = {
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": "test"}],
                "max_tokens": 1
            }
            with httpx.Client(timeout=5.0) as client:
                response = client.post("https://api.groq.com/openai/v1/chat/completions", 
                                     headers=headers, json=test_payload)
                if response.status_code not in [200, 429]:  # 429 = rate limit, aber API funktioniert
                    groq_status = "api_error"
        except:
            groq_status = "offline"
    
    return {
        "status": "healthy",
        "services": {
            "google_drive": "connected" if drive_service else "disconnected",
            "groq_llm": groq_status
        },
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/instructions")
async def generate_instructions(request: ContextRequest):
    """Generiert Formular-Anweisungen für Variante A (Sichtbares Formular)"""
    try:
        # Feste, wissenschaftlich validierte Formularfelder für Gebäudeerfassung
        base_instructions = {
            "GEBÄUDEART": "Geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Mehrfamilienhaus)",
            "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet? (Format: JJJJ)",
            "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern? (nur beheizte Räume)",
            "ANZAHL_STOCKWERKE": "Über wie viele Stockwerke erstreckt sich das Gebäude?",
            "HEIZUNGSART": "Welche Art der Heizung ist installiert? (z.B. Gas, Öl, Wärmepumpe)",
            "DACHTYP": "Welcher Dachtyp ist vorhanden? (z.B. Satteldach, Flachdach, Walmdach)",
            "KELLER_VORHANDEN": "Ist ein Keller vorhanden? (Ja/Nein/Teilunterkellert)",
            "ENERGIEAUSWEIS": "Liegt ein Energieausweis vor? Falls ja, welche Energieklasse?",
            "SANIERUNGSBEDARF": "Welche Sanierungsmaßnahmen sind geplant oder erforderlich?"
        }
        
        # Bei Kontext: LLM kann Anweisungen anpassen/erweitern
        if request.context.strip():
            prompt = f"""
Kontext: {request.context}

Basierend auf diesem Kontext, erweitere oder passe die folgenden Gebäudeformular-Felder an:
{json.dumps(base_instructions, ensure_ascii=False, indent=2)}

Gib ein JSON-Objekt zurück mit angepassten/erweiterten Anweisungen.
Behalte die GROSSBUCHSTABEN-Feldnamen bei.
Anweisungen sollten klar und hilfreich sein.

Nur JSON zurückgeben, keine Erklärungen.
"""
            
            llm_response = call_llm(prompt)
            
            try:
                # JSON extrahieren
                start = llm_response.find('{')
                end = llm_response.rfind('}') + 1
                if start != -1 and end != 0:
                    json_str = llm_response[start:end]
                    enhanced_instructions = json.loads(json_str)
                    return enhanced_instructions
                else:
                    print("⚠️ Kein JSON in LLM-Antwort gefunden, nutze Basis-Anweisungen")
                    return base_instructions
            except json.JSONDecodeError as e:
                print(f"⚠️ JSON-Parse-Fehler: {e}, nutze Basis-Anweisungen")
                return base_instructions
        else:
            return base_instructions
            
    except Exception as e:
        print(f"❌ Instructions-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Generieren der Anweisungen")

@app.post("/api/chat")
async def chat_help(request: ChatRequest):
    """Chat-Hilfe für beide Varianten"""
    try:
        prompt = f"""
Du hilfst Nutzern beim Ausfüllen eines Gebäudeformulars im Rahmen einer wissenschaftlichen Studie.

Kontext: {request.context}
Nutzerfrage: {request.message}

Gib eine hilfreiche, sachliche Antwort auf Deutsch in 2-3 Sätzen.
Fokussiere auf praktische Gebäude-Informationen:
- Gebäudearten und deren Merkmale
- Baujahre und Epochen
- Heizungssysteme
- Dachtypen und Materialien
- Energieeffizienz und Sanierung

Bleibe wissenschaftlich neutral und präzise.
"""
        
        response = call_llm(prompt)
        return {"response": response}
        
    except Exception as e:
        print(f"❌ Chat-Fehler: {e}")
        return {"response": "Der Chat-Service ist momentan nicht verfügbar. Bitte versuchen Sie es später erneut."}

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Speichert Formulardaten von Variante A in Google Drive"""
    try:
        # Lokale Sicherung (Fallback)
        os.makedirs("LLM Output", exist_ok=True)
        local_path = f"LLM Output/{request.filename}"
        
        # Datenstruktur vorbereiten
        save_data = {
            "variant": "A_sichtbares_formular",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values,
            "metadata": {
                "total_fields": len(request.instructions),
                "filled_fields": len([v for v in request.values.values() if v.strip()]),
                "completion_rate": round((len([v for v in request.values.values() if v.strip()]) / len(request.instructions)) * 100, 1) if request.instructions else 0
            }
        }
        
        # Lokale Speicherung
        with open(local_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        # Google Drive Upload
        drive_service = get_drive_service()
        if drive_service:
            folder_id = create_or_get_folder(drive_service, DRIVE_FOLDER_NAME)
            if folder_id:
                file_id, web_link = upload_to_drive(drive_service, save_data, request.filename, folder_id)
                
                if file_id:
                    return {
                        "message": "Daten erfolgreich gespeichert",
                        "filename": request.filename,
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link,
                        "folder": DRIVE_FOLDER_NAME
                    }
        
        # Fallback: Nur lokale Speicherung
        return {
            "message": "Daten lokal gespeichert (Google Drive nicht verfügbar)",
            "filename": request.filename,
            "storage": "local",
            "path": local_path
        }
        
    except Exception as e:
        print(f"❌ Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern der Daten")

@app.post("/api/dialog/start")
async def start_dialog(request: ContextRequest):
    """Startet Dialog für Variante B (Dialog-System)"""
    try:
        # Feste, wissenschaftlich validierte Dialog-Fragen
        base_questions = [
            {"question": "Welche Art von Gebäude möchten Sie erfassen?", "field": "GEBÄUDEART"},
            {"question": "In welchem Jahr wurde das Gebäude errichtet?", "field": "BAUJAHR"},
            {"question": "Wie groß ist die Wohnfläche des Gebäudes in Quadratmetern?", "field": "WOHNFLÄCHE"},
            {"question": "Über wie viele Stockwerke erstreckt sich das Gebäude?", "field": "ANZAHL_STOCKWERKE"},
            {"question": "Welche Art der Heizung ist installiert?", "field": "HEIZUNGSART"},
            {"question": "Welcher Dachtyp ist vorhanden?", "field": "DACHTYP"},
            {"question": "Ist ein Keller vorhanden?", "field": "KELLER_VORHANDEN"},
            {"question": "Liegt ein Energieausweis vor? Falls ja, welche Energieklasse?", "field": "ENERGIEAUSWEIS"}
        ]
        
        # Bei Kontext: LLM kann Fragen anpassen
        if request.context.strip():
            prompt = f"""
Kontext für Gebäudeerfassung: {request.context}

Erstelle basierend auf diesem Kontext 8-10 präzise Fragen für ein Gebäude-Interview.
Format: JSON-Array mit Objekten {"question": "Frage...", "field": "FELDNAME"}

Die Fragen sollen:
- Logisch aufeinander aufbauen
- Klar und verständlich sein
- Alle wichtigen Gebäudedaten abdecken
- Auf Deutsch formuliert sein

Beispiel-Start:
[
    {"question": "Welche Art von Gebäude möchten Sie erfassen?", "field": "GEBÄUDEART"},
    ...
]

Nur JSON-Array zurückgeben, keine Erklärungen.
"""
            
            llm_response = call_llm(prompt)
            
            try:
                # JSON Array extrahieren
                start = llm_response.find('[')
                end = llm_response.rfind(']') + 1
                if start != -1 and end != 0:
                    json_str = llm_response[start:end]
                    questions = json.loads(json_str)
                    
                    # Validierung der Fragen-Struktur
                    if all(isinstance(q, dict) and "question" in q and "field" in q for q in questions):
                        return {
                            "questions": questions,
                            "totalQuestions": len(questions),
                            "currentQuestionIndex": 0
                        }
                    else:
                        print("⚠️ Ungültige Fragen-Struktur, nutze Basis-Fragen")
                        
            except json.JSONDecodeError as e:
                print(f"⚠️ JSON-Parse-Fehler bei Dialog-Start: {e}")
        
        # Fallback: Basis-Fragen
        return {
            "questions": base_questions,
            "totalQuestions": len(base_questions),
            "currentQuestionIndex": 0
        }
        
    except Exception as e:
        print(f"❌ Dialog-Start-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Starten des Dialogs")

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Verarbeitet Dialog-Nachrichten für Variante B"""
    try:
        user_message = request.message.strip()
        
        if user_message == "?":
            # Hilfe-Anfrage
            current_field = request.currentQuestion.field
            current_question = request.currentQuestion.question
            
            prompt = f"""
Ein Teilnehmer der wissenschaftlichen Studie braucht Hilfe bei folgender Frage:
"{current_question}"

Feld: {current_field}

Gib eine präzise, hilfreiche Erklärung in 2-3 Sätzen auf Deutsch.
Fokussiere auf praktische Informationen zu Gebäuden.
Bleibe sachlich und wissenschaftlich neutral.
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
                    "response": "Ihre Antwort wurde erfasst. Nächste Frage:",
                    "nextQuestion": True,
                    "questionIndex": request.questionIndex + 1,
                    "helpProvided": False
                }
            else:
                return {
                    "response": "Alle Fragen beantwortet. Sie können nun Ihre Daten speichern.",
                    "nextQuestion": False,
                    "questionIndex": request.questionIndex,
                    "dialogComplete": True,
                    "helpProvided": False
                }
        
    except Exception as e:
        print(f"❌ Dialog-Message-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Verarbeiten der Nachricht")
    
@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Speichert Formulardaten"""
    try:
        output_path = f"LLM Output/{request.filename}"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "instructions": request.instructions,
                "values": request.values,
                "timestamp": datetime.now().isoformat(),
                "type": "form_data"
            }, f, ensure_ascii=False, indent=2)
        
        return {"message": "Daten erfolgreich gespeichert", "filename": request.filename}#d
    
    except Exception as e:
        print(f"❌ Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern")


@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Speichert Dialog-Daten von Variante B in Google Drive"""
    try:
        # Lokale Sicherung (Fallback)
        os.makedirs("LLM Output", exist_ok=True)
        local_path = f"LLM Output/{request.filename}"
        
        # Datenstruktur vorbereiten
        save_data = {
            "variant": "B_dialog_system",
            "timestamp": datetime.now().isoformat(),
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory,
            "metadata": {
                "total_questions": len(request.questions),
                "answered_questions": len(request.answers),
                "completion_rate": round((len(request.answers) / len(request.questions)) * 100, 1) if request.questions else 0,
                "chat_interactions": len(request.chatHistory)
            }
        }
        
        # Lokale Speicherung
        with open(local_path, 'w', encoding='utf-8') as f:
            json.dump(save_data, f, ensure_ascii=False, indent=2)
        
        # Google Drive Upload
        drive_service = get_drive_service()
        if drive_service:
            folder_id = create_or_get_folder(drive_service, DRIVE_FOLDER_NAME)
            if folder_id:
                file_id, web_link = upload_to_drive(drive_service, save_data, request.filename, folder_id)
                
                if file_id:
                    return {
                        "message": "Dialog-Daten erfolgreich gespeichert",
                        "filename": request.filename,
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link,
                        "folder": DRIVE_FOLDER_NAME
                    }
        
        # Fallback: Nur lokale Speicherung
        return {
            "message": "Dialog-Daten lokal gespeichert (Google Drive nicht verfügbar)",
            "filename": request.filename,
            "storage": "local",
            "path": local_path
        }
        
    except Exception as e:
        print(f"❌ Dialog-Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern der Dialog-Daten")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🔬 FormularIQ - Wissenschaftliche Studie")
    print(f"📊 Backend für LLM-gestützte Formularbearbeitung")
    print(f"🏛️ HAW Hamburg - Masterarbeit Moritz Treu")
    print(f"🌐 Server läuft auf Port {port}")
    print(f"📁 Google Drive Ordner: {DRIVE_FOLDER_NAME}")
    
    # System-Check
    drive_service = get_drive_service()
    if drive_service:
        print("✅ Google Drive Service initialisiert")
    else:
        print("⚠️ Google Drive Service nicht verfügbar (läuft mit lokaler Speicherung)")
    
    # Groq API Check
    groq_api_key = os.getenv("GROQ_API_KEY")
    if groq_api_key:
        print("✅ Groq API Key gefunden")
    else:
        print("⚠️ GROQ_API_KEY Umgebungsvariable nicht gesetzt")
        print("   Setzen Sie: export GROQ_API_KEY=your_api_key")
    
    uvicorn.run(app, host="0.0.0.0", port=port)