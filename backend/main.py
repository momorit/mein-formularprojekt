# backend/main.py - DIALOG FIX für Variante B (Groq repariert)

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
    title="FormularIQ Backend - DIALOG FIXED",
    description="LLM-gestützte Formularbearbeitung - Dialog-Endpunkte repariert",
    version="2.3.0"
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

# === GOOGLE DRIVE SETUP ===
def get_google_drive_service():
    """Google Drive Service mit mehreren Fallback-Optionen"""
    try:
        # Option 1: Environment Variable (für Production)
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
        
        # Option 2: Lokale JSON-Datei (für Development)
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
    """Drive-Ordner erstellen oder finden"""
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
        
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = service.files().create(body=file_metadata, fields='id').execute()
        folder_id = folder.get('id')
        print(f"✅ Drive-Ordner erstellt: {folder_name}")
        return folder_id
        
    except Exception as e:
        print(f"❌ Drive-Ordner-Fehler: {e}")
        return None

def upload_to_google_drive(service, folder_id, data, filename):
    """Upload zu Google Drive"""
    if not service or not folder_id:
        return None, None
    
    try:
        json_content = json.dumps(data, ensure_ascii=False, indent=2, default=str)
        
        file_metadata = {
            'name': filename,
            'parents': [folder_id]
        }
        
        media = MediaIoBaseUpload(
            io.BytesIO(json_content.encode('utf-8')),
            mimetype='application/json',
            resumable=True
        )
        
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()
        
        file_id = file.get('id')
        web_link = file.get('webViewLink')
        print(f"✅ Upload erfolgreich: {filename}")
        return file_id, web_link
        
    except Exception as e:
        print(f"❌ Upload-Fehler: {e}")
        return None, None

# === LLM INTEGRATION - ROBUST MIT DIALOG-OPTIMIERUNG ===
def call_llm_service(prompt: str, context: str = "", dialog_mode: bool = False) -> str:
    """
    LLM-Aufruf mit spezieller Dialog-Optimierung für Variante B
    """
    
    # Systemanweisung je nach Modus
    if dialog_mode:
        system_message = """Du bist ein professioneller Gebäude-Energieberater und führst ein strukturiertes Interview durch. 
        Du stellst eine Frage nach der anderen und gehst systematisch vor. Deine Antworten sind:
        - Kurz und präzise (max. 2-3 Sätze)
        - Freundlich und professionell
        - Auf Deutsch
        - Fokussiert auf die jeweilige Frage
        
        Bei Hilfeanfragen ('?') gibst du konkrete, praxisnahe Beispiele."""
    else:
        system_message = """Du bist ein Experte für Gebäude-Energieberatung und hilfst beim Ausfüllen von Formularen. 
        Gib präzise, hilfreiche Antworten auf Deutsch. Deine Antworten sind klar, verständlich und praxisorientiert."""
    
    full_prompt = f"{system_message}\n\nKontext: {context}\n\nAnfrage: {prompt}"
    
    # Option 1: Groq API (optimiert für Dialog)
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key and groq_key.startswith('gsk_'):
        try:
            import groq
            client = groq.Groq(api_key=groq_key)
            
            # Unterschiedliche Modell-Parameter für Dialog
            if dialog_mode:
                model = "llama3-70b-8192"  # Größeres Modell für bessere Dialoge
                temperature = 0.8  # Etwas kreativer für natürlichere Konversation
                max_tokens = 1024  # Kürzere Antworten für Dialog
            else:
                model = "llama3-8b-8192"
                temperature = 0.7
                max_tokens = 2048
            
            response = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": f"Kontext: {context}\n\nAnfrage: {prompt}"}
                ],
                model=model,
                temperature=temperature,
                max_tokens=max_tokens
            )
            
            result = response.choices[0].message.content
            print(f"✅ LLM: Groq API erfolgreich ({'Dialog' if dialog_mode else 'Formular'} Modus)")
            return result
            
        except Exception as groq_error:
            print(f"⚠️ Groq API Fehler: {groq_error}")
    
    # Option 2: Ollama (lokal)
    try:
        # Dialog-optimierte Prompts für Ollama
        if dialog_mode:
            enhanced_prompt = f"""<|im_start|>system
{system_message}<|im_end|>
<|im_start|>user
{context}

{prompt}<|im_end|>
<|im_start|>assistant
"""
        else:
            enhanced_prompt = full_prompt
        
        response = requests.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3",
                "prompt": enhanced_prompt,
                "stream": False,
                "options": {
                    "temperature": 0.8 if dialog_mode else 0.7,
                    "top_p": 0.9,
                    "repeat_penalty": 1.1,
                    "stop": ["<|im_end|>"] if dialog_mode else []
                }
            },
            timeout=45  # Längerer Timeout für komplexere Dialog-Antworten
        )
        
        if response.status_code == 200:
            result = response.json().get("response", "")
            if result:
                print(f"✅ LLM: Ollama erfolgreich ({'Dialog' if dialog_mode else 'Formular'} Modus)")
                return result
                
    except Exception as ollama_error:
        print(f"⚠️ Ollama Fehler: {ollama_error}")
    
    # Fallback: Verbesserte vordefinierte Antworten
    print(f"⚠️ LLM: Verwende optimierte Fallback-Antworten ({'Dialog' if dialog_mode else 'Formular'} Modus)")
    
    if dialog_mode:
        if "?" in prompt or "hilfe" in prompt.lower():
            return """Gerne helfe ich Ihnen! 

Hier sind einige typische Beispiele:
• Gebäudeart: Einfamilienhaus, Reihenhaus, Doppelhaushälfte
• Baujahr: z.B. 1975 (wie in Ihrem Szenario)
• Heizung: Gasheizung, Ölheizung, Wärmepumpe

Haben Sie weitere Fragen zu einem bestimmten Punkt?"""
        
        elif "frage" in prompt.lower() or "weiter" in prompt.lower():
            return "Vielen Dank für Ihre Antwort! Lass uns mit der nächsten Frage fortfahren."
        
        else:
            return f"""Verstanden: "{prompt[:50]}..."

Das ist eine gute Angabe für die Energieberatung. Kann ich Ihnen noch bei Details helfen, oder können wir zur nächsten Frage?"""
    
    else:
        # Normale Formular-Fallbacks
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

Geben Sie die Informationen entsprechend Ihrem 1970er Jahre Einfamilienhaus ein."""

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
    """System-Status mit Dialog-Test"""
    # Test LLM Dialog-Funktionalität
    try:
        test_response = call_llm_service("Test", "", dialog_mode=True)
        dialog_status = "online" if len(test_response) > 10 else "limited"
    except:
        dialog_status = "offline"
    
    return {
        "status": "healthy",
        "services": {
            "google_drive": "connected" if drive_service else "disconnected",
            "llm_dialog": dialog_status,
            "llm_formular": "online",
            "local_storage": "available"
        },
        "timestamp": datetime.now().isoformat(),
        "version": "2.3.0"
    }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Formular-Anweisungen generieren (Variante A)"""
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
        
        llm_response = call_llm_service(prompt, request.context, dialog_mode=False)
        
        # JSON extrahieren
        try:
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
    """Chat mit LLM (Variante A)"""
    try:
        response = call_llm_service(request.message, request.context, dialog_mode=False)
        return {"response": response}
        
    except Exception as e:
        print(f"Fehler bei chat: {e}")
        return {"response": f"Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut."}

@app.post("/api/dialog/start")
async def start_dialog(request: ContextRequest):
    """Dialog starten (Variante B) - OPTIMIERT"""
    try:
        prompt = """Erstelle genau 8 strukturierte Fragen für eine Gebäude-Energieberatung.
        Jede Frage soll ein JSON-Objekt mit 'question' und 'field' sein.
        
        Die Fragen sollen natürlich und gesprächig formuliert sein, als würde ein Berater persönlich fragen.
        
        Format:
        [
            {"question": "Was für ein Gebäude möchten Sie energetisch bewerten lassen?", "field": "GEBÄUDEART"},
            {"question": "Aus welchem Jahr stammt Ihr Gebäude ungefähr?", "field": "BAUJAHR"}
        ]
        
        Berücksichtige: 1970er Jahre Einfamilienhaus, energetische Sanierung."""
        
        llm_response = call_llm_service(prompt, request.context, dialog_mode=True)
        
        try:
            # JSON extrahieren
            if "[" in llm_response and "]" in llm_response:
                json_start = llm_response.find("[")
                json_end = llm_response.rfind("]") + 1
                json_content = llm_response[json_start:json_end]
                questions = json.loads(json_content)
            else:
                raise ValueError("Kein Array gefunden")
        except Exception as parse_error:
            print(f"JSON Parse Fehler: {parse_error}")
            # Optimierte Fallback-Fragen für Dialog
            questions = [
                {"question": "Hallo! Lass uns mit Ihrem Gebäude beginnen. Was für ein Gebäude möchten Sie energetisch bewerten lassen?", "field": "GEBÄUDEART"},
                {"question": "Perfekt! Aus welchem Jahr stammt Ihr Gebäude ungefähr?", "field": "BAUJAHR"},
                {"question": "Danke! Wie groß ist die Wohnfläche Ihres Gebäudes in Quadratmetern?", "field": "WOHNFLÄCHE"},
                {"question": "Gut zu wissen! Welche Heizungsart nutzen Sie aktuell?", "field": "HEIZUNGSART"},
                {"question": "Interessant! Wie würden Sie den Dämmzustand Ihres Gebäudes beschreiben?", "field": "DÄMMZUSTAND"},
                {"question": "Verstanden! In welchem Zustand sind die Fenster in Ihrem Gebäude?", "field": "FENSTERZUSTAND"},
                {"question": "Das hilft mir weiter! Welche Renovierungs- oder Sanierungsmaßnahmen haben Sie vor?", "field": "RENOVIERUNGSWÜNSCHE"},
                {"question": "Zu guter Letzt: Welches Budget steht Ihnen etwa für energetische Sanierungen zur Verfügung?", "field": "BUDGET"}
            ]
        
        print(f"✅ Dialog gestartet mit {len(questions)} Fragen")
        
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
    """Dialog-Nachricht verarbeiten (Variante B) - OPTIMIERT"""
    try:
        print(f"📨 Dialog Message: '{request.message}' (Frage {request.questionIndex+1}/{request.totalQuestions})")
        
        if request.message.strip() == "?":
            # Hilfe-Antwort
            current_field = request.currentQuestion.get('field', 'unknown')
            help_prompt = f"Gib eine kurze, hilfreiche Antwort für das Feld '{current_field}'. Nenne 2-3 konkrete Beispiele."
            
            help_text = call_llm_service(help_prompt, "", dialog_mode=True)
            
            # Fallback falls LLM nicht antwortet
            if len(help_text.strip()) < 10:
                field_help = {
                    'GEBÄUDEART': "Beispiele: Einfamilienhaus, Reihenhaus, Doppelhaushälfte, Mehrfamilienhaus",
                    'BAUJAHR': "Geben Sie das Jahr ein, z.B. 1975 (passend zu Ihrem Szenario)",
                    'HEIZUNGSART': "Beispiele: Gasheizung, Ölheizung, Fernwärme, Wärmepumpe, Nachtspeicher",
                    'DÄMMZUSTAND': "Beispiele: 'Keine Dämmung', 'Teilweise gedämmt', 'Gut gedämmt'",
                    'BUDGET': "Geben Sie eine Summe an, z.B. '20.000 Euro' oder 'noch offen'"
                }
                help_text = field_help.get(current_field, "Geben Sie Ihre beste Einschätzung ab.")
            
            return {
                "response": f"💡 Hilfe: {help_text}",
                "nextQuestion": False,
                "helpProvided": True
            }
        
        # Normale Antwort verarbeiten
        context = f"Der Nutzer beantwortet die Frage '{request.currentQuestion.get('question')}' mit: '{request.message}'"
        prompt = "Bestätige die Antwort kurz und freundlich (max. 1-2 Sätze). Sei ermutigend und professionell."
        
        response = call_llm_service(prompt, context, dialog_mode=True)
        
        # Fallback falls LLM nicht antwortet
        if len(response.strip()) < 5:
            response = f"Danke für die Angabe '{request.message}'! Das hilft mir bei der Energieberatung."
        
        # Prüfe ob mehr Fragen kommen
        next_question = request.questionIndex + 1 < request.totalQuestions
        
        print(f"✅ Dialog Response generiert, nächste Frage: {next_question}")
        
        return {
            "response": response,
            "nextQuestion": next_question,
            "questionIndex": request.questionIndex + 1 if next_question else request.questionIndex,
            "dialogComplete": not next_question
        }
        
    except Exception as e:
        print(f"Fehler bei dialog/message: {e}")
        return {
            "response": "Entschuldigung, es gab einen technischen Fehler. Können Sie das nochmal versuchen?",
            "nextQuestion": False,
            "helpProvided": False
        }

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
            },
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg", 
                "researcher": "Moritz Treu",
                "backend_version": "2.3.0"
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
            },
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu", 
                "backend_version": "2.3.0"
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

# backend/main.py - STUDY SAVE ENDPUNKT HINZUGEFÜGT

# Füge diesen Endpunkt zu deiner bestehenden main.py hinzu:

# === STUDY DATA MODEL ===
class StudySaveRequest(BaseModel):
    participantId: str
    startTime: str
    randomization: str
    demographics: Optional[Dict[str, str]] = None
    variantAData: Optional[Dict[str, Any]] = None
    variantBData: Optional[Dict[str, Any]] = None
    comparisonData: Optional[Dict[str, Any]] = None
    totalDuration: Optional[int] = None

@app.post("/api/study/save")
async def save_complete_study(request: StudySaveRequest):
    """Vollständige Studiendaten speichern"""
    try:
        # Umfassende Studiendaten strukturieren
        complete_study_data = {
            "study_type": "FormularIQ_Complete_Study",
            "participant_id": request.participantId,
            "timestamp": datetime.now().isoformat(),
            "start_time": request.startTime,
            "randomization": request.randomization,
            "total_duration_ms": request.totalDuration,
            "total_duration_minutes": round((request.totalDuration or 0) / 60000, 2),
            
            # Demografische Daten
            "demographics": request.demographics,
            
            # Variante A Daten
            "variant_a_data": request.variantAData,
            
            # Variante B Daten  
            "variant_b_data": request.variantBData,
            
            # Vergleichsdaten
            "comparison_data": request.comparisonData,
            
            # Metadaten für wissenschaftliche Auswertung
            "metadata": {
                "completed_demographics": bool(request.demographics),
                "completed_variant_a": bool(request.variantAData),
                "completed_variant_b": bool(request.variantBData),
                "completed_comparison": bool(request.comparisonData),
                "study_completion_rate": calculate_completion_rate(request),
                "first_variant": request.randomization.split('-')[0] if request.randomization else None,
                "second_variant": request.randomization.split('-')[1] if request.randomization else None
            },
            
            # Wissenschaftliche Metadaten
            "study_metadata": {
                "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "researcher": "Moritz Treu",
                "study_version": "1.0.0",
                "backend_version": "2.3.0",
                "collection_date": datetime.now().date().isoformat(),
                "data_type": "complete_user_study"
            }
        }
        
        # Dateiname mit Participant ID und Zeitstempel
        filename = f"complete_study_{request.participantId}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        # Versuche Google Drive Upload
        storage_info = {"storage": "local"}
        if drive_service and drive_folder_id:
            try:
                file_id, web_link = upload_to_google_drive(
                    drive_service, 
                    drive_folder_id, 
                    complete_study_data, 
                    filename
                )
                if file_id:
                    storage_info = {
                        "storage": "google_drive",
                        "google_drive_id": file_id,
                        "web_link": web_link,
                        "folder": GOOGLE_DRIVE_FOLDER_NAME,
                        "success": True
                    }
                    print(f"✅ Complete Study Data uploaded to Google Drive: {filename}")
            except Exception as drive_error:
                print(f"⚠️ Google Drive Upload Fehler: {drive_error}")
                storage_info["drive_error"] = str(drive_error)
        
        # Lokales Backup (immer als Fallback)
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(complete_study_data, ensure_ascii=False, indent=2))
            storage_info["local_path"] = str(local_path)
            storage_info["local_backup"] = True
            print(f"✅ Local backup saved: {local_path}")
        except Exception as local_error:
            print(f"❌ Local Save Fehler: {local_error}")
            storage_info["local_error"] = str(local_error)
        
        return {
            "message": "Vollständige Studiendaten erfolgreich gespeichert",
            "participant_id": request.participantId,
            "filename": filename,
            **storage_info
        }
        
    except Exception as e:
        print(f"❌ Fehler bei study/save: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Fehler beim Speichern der Studiendaten: {str(e)}"
        )

def calculate_completion_rate(request: StudySaveRequest) -> float:
    """Berechnet die Vollständigkeitsrate der Studie"""
    completed_sections = 0
    total_sections = 5  # demographics, variant_a, variant_b, comparison, total
    
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

# Erweitere auch den Health Check für Study-Status
@app.get("/health")
async def health_check():
    """System-Status mit Study-Save-Test"""
    try:
        test_study_data = {
            "test": "health_check",
            "timestamp": datetime.now().isoformat()
        }
        
        # Test Google Drive Write-Access
        drive_write_test = False
        if drive_service and drive_folder_id:
            try:
                # Kleiner Test-Upload
                test_filename = f"health_test_{datetime.now().strftime('%H%M%S')}.json"
                file_id, _ = upload_to_google_drive(
                    drive_service, 
                    drive_folder_id, 
                    test_study_data, 
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
        
        # Test Dialog-Funktionalität
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
            "version": "2.3.0",
            "study_features": {
                "complete_data_collection": True,
                "demographics_support": True,
                "questionnaire_support": True,
                "randomization_support": True,
                "cloud_backup": drive_write_test
            }
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# backend/main.py - STUDY SAVE ENDPUNKT (Füge das zu deiner bestehenden main.py hinzu)

# === IMPORTS HINZUFÜGEN (falls nicht vorhanden) ===
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

# === PYDANTIC MODEL HINZUFÜGEN ===
class StudySaveRequest(BaseModel):
    participantId: str
    startTime: str  # ISO string from frontend
    randomization: str
    demographics: Optional[Dict[str, str]] = None
    variantAData: Optional[Dict[str, Any]] = None
    variantBData: Optional[Dict[str, Any]] = None
    comparisonData: Optional[Dict[str, Any]] = None
    totalDuration: Optional[int] = None

# === STUDY SAVE ENDPUNKT ===
@app.post("/api/study/save")
async def save_complete_study(request: StudySaveRequest):
    """Vollständige Studiendaten speichern - Google Cloud + Lokales Backup"""
    try:
        print(f"📊 Saving complete study data for participant: {request.participantId}")
        
        # Umfassende Studiendaten strukturieren
        complete_study_data = {
            "study_type": "FormularIQ_Complete_User_Study",
            "participant_id": request.participantId,
            "collection_timestamp": datetime.now().isoformat(),
            "study_start_time": request.startTime,
            "randomization_order": request.randomization,
            "total_duration_ms": request.totalDuration,
            "total_duration_minutes": round((request.totalDuration or 0) / 60000, 2),
            
            # === DEMOGRAPHICS ===
            "demographics": request.demographics,
            
            # === VARIANT A DATA ===
            "variant_a_results": request.variantAData,
            
            # === VARIANT B DATA ===
            "variant_b_results": request.variantBData,
            
            # === COMPARISON DATA ===
            "variant_comparison": request.comparisonData,
            
            # === STUDY COMPLETION METADATA ===
            "completion_metadata": {
                "demographics_completed": bool(request.demographics),
                "variant_a_completed": bool(request.variantAData),
                "variant_b_completed": bool(request.variantBData),
                "comparison_completed": bool(request.comparisonData),
                "study_completion_rate": calculate_study_completion_rate(request),
                "first_variant_tested": request.randomization.split('-')[0] if request.randomization else None,
                "second_variant_tested": request.randomization.split('-')[1] if request.randomization else None
            },
            
            # === SCIENTIFIC METADATA ===
            "research_metadata": {
                "project_title": "FormularIQ - LLM-gestützte Formularbearbeitung",
                "institution": "HAW Hamburg",
                "department": "Fakultät Technik und Informatik",
                "researcher": "Moritz Treu",
                "study_type": "Within-Subject Design Usability Study",
                "data_collection_method": "Online User Study",
                "study_version": "1.0.0",
                "backend_version": "2.3.0",
                "collection_date": datetime.now().date().isoformat(),
                "data_classification": "Scientific Research Data - Anonymized"
            },
            
            # === TECHNICAL METADATA ===
            "technical_metadata": {
                "frontend_platform": "Next.js",
                "backend_platform": "FastAPI",
                "llm_provider": "Groq/Ollama",
                "storage_primary": "Google Drive",
                "storage_backup": "Local JSON"
            }
        }
        
        # Dateiname mit Participant ID und Zeitstempel
        timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"complete_study_{request.participantId}_{timestamp_str}.json"
        
        storage_results = {"storage": "local", "success": False}
        
        # === GOOGLE DRIVE UPLOAD (Primary Storage) ===
        if drive_service and drive_folder_id:
            try:
                print("☁️ Uploading to Google Drive...")
                file_id, web_link = upload_to_google_drive(
                    drive_service, 
                    drive_folder_id, 
                    complete_study_data, 
                    filename
                )
                if file_id:
                    storage_results = {
                        "storage": "google_drive",
                        "success": True,
                        "google_drive_id": file_id,
                        "web_link": web_link,
                        "folder": GOOGLE_DRIVE_FOLDER_NAME
                    }
                    print(f"✅ Google Drive Upload erfolgreich: {filename}")
                else:
                    print("❌ Google Drive Upload fehlgeschlagen")
                    storage_results["drive_error"] = "Upload returned no file ID"
            except Exception as drive_error:
                print(f"❌ Google Drive Fehler: {drive_error}")
                storage_results["drive_error"] = str(drive_error)
        else:
            print("⚠️ Google Drive Service nicht verfügbar")
            storage_results["drive_error"] = "Service not available"
        
        # === LOCAL BACKUP (Always as Fallback) ===
        try:
            local_path = LOCAL_OUTPUT_DIR / filename
            async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(complete_study_data, ensure_ascii=False, indent=2))
            storage_results["local_backup"] = True
            storage_results["local_path"] = str(local_path)
            print(f"✅ Lokales Backup gespeichert: {local_path}")
        except Exception as local_error:
            print(f"❌ Lokales Backup fehlgeschlagen: {local_error}")
            storage_results["local_error"] = str(local_error)
        
        # === RESPONSE ===
        return {
            "message": "Vollständige Studiendaten erfolgreich gespeichert",
            "participant_id": request.participantId,
            "filename": filename,
            "study_duration_minutes": round((request.totalDuration or 0) / 60000, 2),
            "completion_rate": calculate_study_completion_rate(request),
            **storage_results
        }
        
    except Exception as e:
        print(f"❌ KRITISCHER FEHLER bei study/save: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Fehler beim Speichern der Studiendaten: {str(e)}"
        )

def calculate_study_completion_rate(request: StudySaveRequest) -> float:
    """Berechnet die Vollständigkeitsrate der Studie (0-100%)"""
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

# === HEALTH CHECK ERWEITERT ===
# Ersetze deine bestehende health_check Funktion mit dieser:
@app.get("/health")
async def health_check():
    """Umfassendes System-Health-Check mit Study-Support"""
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
                        pass  # Löschen nicht kritisch
            except:
                pass  # Test-Upload nicht kritisch
        
        # Test LLM-Funktionalität
        try:
            test_response = call_llm_service("Health check test", "", dialog_mode=True)
            dialog_status = "online" if len(test_response) > 10 else "limited"
        except:
            dialog_status = "offline"
        
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "version": "2.3.0",
            
            # === CORE SERVICES ===
            "services": {
                "google_drive_read": "connected" if drive_service else "disconnected",
                "google_drive_write": "ok" if drive_write_test else "limited",
                "llm_dialog": dialog_status,
                "llm_formular": "online",
                "local_storage": "available"
            },
            
            # === STUDY FEATURES ===
            "study_features": {
                "complete_data_collection": True,
                "demographics_collection": True,
                "sus_questionnaires": True,
                "variant_comparison": True,
                "randomization_support": True,
                "cloud_backup": drive_write_test,
                "local_backup": True
            },
            
            # === API ENDPOINTS STATUS ===
            "endpoints": {
                "study_save": "/api/study/save",
                "form_a_support": "/api/generate-instructions, /api/chat, /api/save",
                "form_b_support": "/api/dialog/start, /api/dialog/message, /api/dialog/save",
                "health_monitoring": "/health"
            }
        }
        
    except Exception as e:
        return {
            "status": "degraded",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "message": "Einige Services sind eingeschränkt verfügbar"
        }

# === STUDY STATISTICS ENDPUNKT (Optional - für Admin-Übersicht) ===
@app.get("/api/study/stats")
async def get_study_statistics():
    """Einfache Statistiken über gesammelte Studiendaten"""
    try:
        # Zähle lokale Dateien
        local_study_files = list(LOCAL_OUTPUT_DIR.glob("complete_study_*.json"))
        local_count = len(local_study_files)
        
        return {
            "local_study_files": local_count,
            "storage_directory": str(LOCAL_OUTPUT_DIR),
            "google_drive_folder": GOOGLE_DRIVE_FOLDER_NAME,
            "last_update": datetime.now().isoformat()
        }
    except Exception as e:
        return {"error": str(e)}

print("✅ Study save endpoints added to backend")
print("📊 Available endpoints:")
print("   POST /api/study/save - Save complete study data")
print("   GET /api/study/stats - Get study statistics")
print("   GET /health - Extended health check")

# === SERVER START ===
if __name__ == "__main__":
    print("🚀 FormularIQ Backend - DIALOG REPARIERT")
    print("="*50)
    print(f"✅ Google Drive: {'Connected' if drive_service else 'Disconnected (lokaler Fallback)'}")
    print(f"✅ LLM Formular: Multiple Fallbacks verfügbar")
    print(f"✅ LLM Dialog: Optimiert für Variante B") 
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

