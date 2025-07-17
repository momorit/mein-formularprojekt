# backend/main.py - Optimiertes FastAPI Backend mit LLM-Integration

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import ollama
import json
import os
from datetime import datetime
from typing import Dict, Any, List, Optional
import uvicorn

app = FastAPI(
    title="FormularIQ Backend",
    description="LLM-gestützte Formularbearbeitung",
    version="1.0.0"
)

# CORS konfigurieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class ContextRequest(BaseModel):
    context: str

class ChatRequest(BaseModel):
    message: str

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

# Ausgabe-Verzeichnis erstellen
os.makedirs("LLM Output", exist_ok=True)

def call_llm(prompt: str, context: str = "") -> str:
    """
    Optimierte LLM-Anfrage mit besserem Prompt Engineering
    """
    try:
        # Erweiterte System-Nachricht für bessere Antworten
        system_prompt = """Du bist ein Experte für Gebäudeformulare und hilfst Nutzern beim Ausfüllen komplexer Formulare. 
        Du gibst präzise, hilfreiche und kontextbezogene Anweisungen auf Deutsch. 
        Deine Antworten sind klar, verständlich und praxisorientiert."""
        
        full_prompt = f"{system_prompt}\n\nKontext: {context}\n\nAufgabe: {prompt}"
        
        response = ollama.chat(
            model='llama3',
            messages=[
                {
                    'role': 'user',
                    'content': full_prompt
                }
            ],
            options={
                'temperature': 0.7,  # Ausgewogenheit zwischen Kreativität und Konsistenz
                'top_p': 0.9,
                'max_tokens': 2048
            }
        )
        return response['message']['content']
    except Exception as e:
        print(f"LLM-Fehler: {e}")
        return "Entschuldigung, ich konnte Ihre Anfrage nicht verarbeiten."

@app.get("/")
async def root():
    return {"message": "FormularIQ Backend läuft", "status": "OK"}

@app.post("/api/instructions")
async def generate_instructions(request: ContextRequest):
    """
    Generiert Formularfelder mit optimierten LLM-Prompts
    """
    try:
        # Verbesserter Prompt für Formularfeld-Generierung
        if request.context.strip():
            prompt = f"""
Erstelle ein Gebäudeformular basierend auf folgendem Kontext: {request.context}

Generiere 10-15 relevante Formularfelder im JSON-Format. Jedes Feld soll haben:
- Einen aussagekräftigen Feldnamen (kleinbuchstaben, unterstriche statt leerzeichen)
- Eine hilfreiche, spezifische Anweisung für den Nutzer
- Alle Anweisungen auf Deutsch

Berücksichtige den gegebenen Kontext und erstelle passende Felder.

Beispiel-Format:
{{
  "gebäude_typ": {{
    "instruction": "Geben Sie den Gebäudetyp ein (z.B. Einfamilienhaus, Mehrfamilienhaus, Bürogebäude)",
    "value": ""
  }}
}}
            """
        else:
            prompt = """
Erstelle ein Standard-Gebäudeformular mit 13 wichtigen Feldern im JSON-Format:

Felder: gebäude, energieträger, wohnungsbezeichnung, gebäudeseite, himmelsrichtung, 
bestand_wände, dicke_mm, material, modernisiert, modernisierungsmaßnahmen, 
maßnahme_art, u_wert, optik

Jedes Feld soll haben:
- instruction: Hilfreiche, spezifische deutsche Anweisung mit Beispielen
- value: ""

Mache die Anweisungen praxisnah und hilfreich für Gebäudeeigentümer.
            """

        llm_response = call_llm(prompt, request.context)
        
        # JSON aus LLM-Response extrahieren
        try:
            # Finde JSON-Block in der Antwort
            start = llm_response.find('{')
            end = llm_response.rfind('}') + 1
            if start != -1 and end != -1:
                json_str = llm_response[start:end]
                instructions = json.loads(json_str)
            else:
                raise ValueError("Kein JSON gefunden")
                
        except (json.JSONDecodeError, ValueError):
            # Fallback: Standard-Formular mit LLM-generierten Beschreibungen
            standard_fields = [
                "gebäude", "energieträger", "wohnungsbezeichnung", "gebäudeseite", 
                "himmelsrichtung", "bestand_wände", "dicke_mm", "material", 
                "modernisiert", "modernisierungsmaßnahmen", "maßnahme_art", "u_wert", "optik"
            ]
            
            instructions = {}
            for field in standard_fields:
                # Individuelle Anweisung für jedes Feld generieren
                field_prompt = f"Erstelle eine hilfreiche deutsche Anweisung für das Formularfeld '{field}' in einem Gebäudeformular. Maximal 1-2 Sätze mit Beispielen."
                field_instruction = call_llm(field_prompt, request.context)
                
                instructions[field] = {
                    "instruction": field_instruction.strip(),
                    "value": ""
                }

        return instructions

    except Exception as e:
        print(f"Fehler bei Anweisungsgenerierung: {e}")
        raise HTTPException(status_code=500, detail="Fehler bei der Verarbeitung")

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Verbesserte Chat-Funktionalität für Formularhilfe
    """
    try:
        prompt = f"""
Du hilfst beim Ausfüllen eines Gebäudeformulars. 
Beantworte die folgende Frage hilfsreich und präzise auf Deutsch:

Frage: {request.message}

Gib praktische Tipps und Beispiele. Halte die Antwort knapp aber informativ.
        """
        
        response = call_llm(prompt)
        return {"response": response}
        
    except Exception as e:
        print(f"Chat-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler bei der Chatverarbeitung")

@app.post("/api/dialog/start")
async def start_dialog(extraInfo: str = Form(""), pdf: UploadFile = File(None)):
    """
    Startet einen Dialog mit optimierten Fragen
    """
    try:
        context = extraInfo if extraInfo else "Allgemeines Gebäudeformular"
        
        prompt = f"""
Erstelle 8-12 Dialog-Fragen für ein Gebäudeformular basierend auf: {context}

Jede Frage soll:
- Natürlich und freundlich formuliert sein
- Ein spezifisches Formularfeld abfragen
- Auf Deutsch sein

Format: JSON-Array mit Objekten:
[
  {{"feld": "gebäude", "frage": "Was für ein Gebäude möchten Sie erfassen?"}},
  {{"feld": "energieträger", "frage": "Welche Art von Energieversorgung nutzt das Gebäude?"}}
]

Erstelle realistische, hilfreiche Fragen für: gebäude, energieträger, wohnungsbezeichnung, 
himmelsrichtung, material, modernisiert, modernisierungsmaßnahmen, u_wert, optik, gebäudeseite
        """
        
        llm_response = call_llm(prompt, context)
        
        try:
            # JSON extrahieren
            start = llm_response.find('[')
            end = llm_response.rfind(']') + 1
            if start != -1 and end != -1:
                json_str = llm_response[start:end]
                questions = json.loads(json_str)
            else:
                raise ValueError("Kein JSON-Array gefunden")
        
        except (json.JSONDecodeError, ValueError):
            # Fallback: Standard-Fragen
            questions = [
                {"feld": "gebäude", "frage": "Was für ein Gebäude möchten Sie erfassen? (z.B. Einfamilienhaus, Mehrfamilienhaus)"},
                {"feld": "energieträger", "frage": "Welche Art von Energieversorgung nutzt das Gebäude?"},
                {"feld": "wohnungsbezeichnung", "frage": "Wie lautet die Bezeichnung der Wohnung oder des Gebäudeteils?"},
                {"feld": "himmelsrichtung", "frage": "In welche Himmelsrichtung ist das Gebäude ausgerichtet?"},
                {"feld": "material", "frage": "Aus welchem Material sind die Außenwände hauptsächlich?"},
                {"feld": "modernisiert", "frage": "Wurde das Gebäude in den letzten Jahren modernisiert?"},
                {"feld": "modernisierungsmaßnahmen", "frage": "Welche Modernisierungsmaßnahmen wurden durchgeführt?"},
                {"feld": "u_wert", "frage": "Kennen Sie den U-Wert der Außenwände? (falls nicht bekannt, lassen Sie leer)"},
                {"feld": "optik", "frage": "Wie würden Sie das äußere Erscheinungsbild beschreiben?"}
            ]
        
        return {"questions": questions}
        
    except Exception as e:
        print(f"Dialog-Start-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Starten des Dialogs")

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """
    Verbesserte Dialog-Nachrichtenverwaltung mit Nachfrage-Support
    """
    try:
        # Check ob Nutzer eine Frage stellt (endet mit ?)
        is_question = request.message.strip().endswith('?')
        
        if is_question:
            # Nutzer stellt Nachfrage - beantworten ohne weiterzugehen
            prompt = f"""
Der Nutzer hat eine Nachfrage zum Formularfeld '{request.currentQuestion['feld']}':

Aktuelle Frage: {request.currentQuestion['frage']}
Nutzer-Nachfrage: {request.message}

Beantworte die Nachfrage hilfreich auf Deutsch und stelle dann die ursprüngliche Frage erneut.
            """
            
            response_text = call_llm(prompt)
            return {
                "response": response_text,
                "nextQuestion": False  # Nicht zur nächsten Frage
            }
        
        else:
            # Normale Antwort - zur nächsten Frage
            next_index = request.questionIndex + 1
            
            if next_index < request.totalQuestions:
                response_text = f"Vielen Dank! Ihre Antwort wurde gespeichert."
                return {
                    "response": response_text,
                    "nextQuestion": True
                }
            else:
                return {
                    "response": "Herzlichen Glückwunsch! Sie haben alle Fragen beantwortet. Sie können nun Ihre Daten speichern.",
                    "nextQuestion": False
                }
        
    except Exception as e:
        print(f"Dialog-Message-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Verarbeiten der Nachricht")

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Speichert Formulardaten"""
    try:
        output_path = f"LLM Output/{request.filename}"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "instructions": request.instructions,
                "values": request.values
            }, f, ensure_ascii=False, indent=2)
        
        return {"message": "Daten erfolgreich gespeichert", "filename": request.filename}
    
    except Exception as e:
        print(f"Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern")

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Speichert Dialog-Daten"""
    try:
        output_path = f"LLM Output/{request.filename}"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "questions": request.questions,
                "answers": request.answers,
                "chatHistory": request.chatHistory
            }, f, ensure_ascii=False, indent=2)
        
        return {"message": "Dialog-Daten erfolgreich gespeichert", "filename": request.filename}
    
    except Exception as e:
        print(f"Dialog-Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern der Dialog-Daten")

if __name__ == "__main__":
    print("🚀 Starte FormularIQ Backend mit optimierter LLM-Integration")
    print("="*60)
    print("Backend: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("="*60)
    
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)

# Füge diesen Endpoint zu deiner backend/main.py Datei hinzu:

from pydantic import BaseModel
from typing import List, Dict, Any
import json
import os
from datetime import datetime

class DialogSaveRequest(BaseModel):
    questions: List[Dict[str, str]]  # [{"feld": "...", "frage": "..."}]
    answers: Dict[str, str]          # {"feld1": "antwort1", ...}
    chatHistory: List[Dict[str, str]] # [{"role": "user", "content": "..."}, ...]
    filename: str

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Speichert Dialog-Daten als JSON-Datei - analog zu Variante A"""
    try:
        # Ausgabe-Ordner erstellen (gleich wie bei Variante A)
        output_dir = "LLM Output"
        os.makedirs(output_dir, exist_ok=True)
        
        # Vollständigen Pfad erstellen
        file_path = os.path.join(output_dir, request.filename)
        
        # Dialog-Daten strukturieren (analog zu Variante A)
        dialog_data = {
            "metadata": {
                "variant": "B - Dialog-basiert",
                "timestamp": datetime.now().isoformat(),
                "total_questions": len(request.questions),
                "answered_questions": len(request.answers)
            },
            "questions": request.questions,
            "answers": request.answers,
            "chat_history": request.chatHistory,
            # Zusätzlich: Formular-Format wie bei Variante A für Vergleichbarkeit
            "form_format": {
                field_data["feld"]: {
                    "question": field_data["frage"],
                    "answer": request.answers.get(field_data["feld"], ""),
                    "answered": field_data["feld"] in request.answers
                }
                for field_data in request.questions
            }
        }
        
        # JSON-Datei speichern
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(dialog_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Dialog-Daten gespeichert: {file_path}")
        
        return {
            "success": True,
            "filename": request.filename,
            "path": file_path,
            "message": f"Dialog-Daten erfolgreich gespeichert: {request.filename}"
        }
        
    except Exception as e:
        print(f"❌ Fehler beim Speichern der Dialog-Daten: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern: {str(e)}")

# Optional: Endpoint um alle gespeicherten Dialog-Dateien aufzulisten
@app.get("/api/dialog/files")
async def list_dialog_files():
    """Listet alle gespeicherten Dialog-JSON-Dateien auf"""
    try:
        output_dir = "LLM Output"
        if not os.path.exists(output_dir):
            return {"files": []}
        
        # Nur Dialog-Dateien (die mit "dialog_output_" beginnen)
        dialog_files = [
            f for f in os.listdir(output_dir) 
            if f.startswith("dialog_output_") and f.endswith(".json")
        ]
        
        # Dateien mit Metadaten
        files_with_info = []
        for filename in sorted(dialog_files, reverse=True):  # Neueste zuerst
            file_path = os.path.join(output_dir, filename)
            stat = os.stat(file_path)
            files_with_info.append({
                "filename": filename,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "size": stat.st_size
            })
        
        return {
            "files": files_with_info,
            "total": len(files_with_info)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Auflisten: {str(e)}")
    
# Füge diesen Endpoint zu deiner backend/main.py hinzu:

from pydantic import BaseModel
from typing import List, Dict
import json
import os
from datetime import datetime

class QuestionsSaveRequest(BaseModel):
    questions: List[Dict[str, str]]  # [{"feld": "...", "frage": "..."}]
    context: str = ""                # Ursprünglicher Kontext
    filename: str

@app.post("/api/dialog/save-questions")
async def save_questions_only(request: QuestionsSaveRequest):
    """Speichert nur die generierten Fragen als JSON-Datei (vor Dialog-Start)"""
    try:
        # Separaten Ausgabe-Ordner für Fragen erstellen
        output_dir = "Dialog Questions"  # Separater Ordner!
        os.makedirs(output_dir, exist_ok=True)
        
        # Vollständigen Pfad erstellen
        file_path = os.path.join(output_dir, request.filename)
        
        # Fragen-Daten strukturieren
        questions_data = {
            "metadata": {
                "variant": "B - Fragen generiert",
                "timestamp": datetime.now().isoformat(),
                "total_questions": len(request.questions),
                "context_provided": bool(request.context.strip()),
                "status": "questions_generated"
            },
            "context": request.context,
            "generated_questions": request.questions,
            # Für einfachen Überblick - Liste der Feldnamen
            "field_names": [q["feld"] for q in request.questions],
            # Zum Vergleich mit Variante A - vereinfachtes Format
            "questions_overview": {
                q["feld"]: {
                    "question": q["frage"],
                    "generated": True,
                    "answered": False,
                    "answer": ""
                }
                for q in request.questions
            }
        }
        
        # JSON-Datei speichern
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(questions_data, f, ensure_ascii=False, indent=2)
        
        print(f"✅ Dialog-Fragen gespeichert: {file_path}")
        
        return {
            "success": True,
            "filename": request.filename,
            "path": file_path,
            "folder": output_dir,
            "message": f"Fragen erfolgreich gespeichert: {request.filename}",
            "questions_count": len(request.questions)
        }
        
    except Exception as e:
        print(f"❌ Fehler beim Speichern der Fragen: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern der Fragen: {str(e)}")

# Optional: Endpoint zum Auflisten der Fragen-Dateien
@app.get("/api/dialog/questions-files")
async def list_questions_files():
    """Listet alle gespeicherten Fragen-JSON-Dateien auf"""
    try:
        output_dir = "Dialog Questions"
        if not os.path.exists(output_dir):
            return {"files": [], "folder": output_dir}
        
        # Alle JSON-Dateien im Questions-Ordner
        question_files = [
            f for f in os.listdir(output_dir) 
            if f.endswith(".json")
        ]
        
        # Dateien mit Metadaten
        files_with_info = []
        for filename in sorted(question_files, reverse=True):  # Neueste zuerst
            file_path = os.path.join(output_dir, filename)
            stat = os.stat(file_path)
            files_with_info.append({
                "filename": filename,
                "created": datetime.fromtimestamp(stat.st_ctime).isoformat(),
                "size": stat.st_size
            })
        
        return {
            "files": files_with_info,
            "total": len(files_with_info),
            "folder": output_dir
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Auflisten: {str(e)}")