# backend/main.py - Online-Ready FastAPI Backend

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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

# CORS für Online-Deployment konfigurieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Local development
        "https://*.vercel.app",   # Vercel domains
        "https://*.railway.app",  # Railway domains
    ],
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
    LLM-Aufruf mit Fallback für Online-Deployment
    """
    try:
        # 1. Versuche Groq (für Online-Deployment)
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key and groq_key.startswith('gsk_'):
            try:
                from groq import Groq
                client = Groq(api_key=groq_key)
                
                system_prompt = """Du bist ein Experte für Gebäudeformulare und hilfst Nutzern beim Ausfüllen komplexer Formulare. 
                Du gibst präzise, hilfreiche und kontextbezogene Anweisungen auf Deutsch. 
                Deine Antworten sind klar, verständlich und praxisorientiert."""
                
                response = client.chat.completions.create(
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Kontext: {context}\n\nAufgabe: {prompt}"}
                    ],
                    model="llama3-8b-8192",
                    temperature=0.7,
                    max_tokens=2048
                )
                return response.choices[0].message.content
            except Exception as groq_error:
                print(f"Groq-Fehler: {groq_error}")
        
        # 2. Fallback zu Ollama (für Local Development)
        try:
            import ollama
            response = ollama.chat(
                model='llama3',
                messages=[
                    {
                        'role': 'user',
                        'content': f"Du bist ein Experte für Gebäudeformulare. Kontext: {context}\n\nAufgabe: {prompt}"
                    }
                ],
                options={
                    'temperature': 0.7,
                    'top_p': 0.9,
                    'max_tokens': 2048
                }
            )
            return response['message']['content']
        except Exception as ollama_error:
            print(f"Ollama-Fehler: {ollama_error}")
        
        # 3. Demo-Fallback für Testing/Demo
        if "formular" in prompt.lower() or "anweisungen" in prompt.lower():
            return json.dumps({
                "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Mehrfamilienhaus)",
                "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?",
                "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern?",
                "HEIZUNGSART": "Welche Art der Heizung ist installiert? (z.B. Gas, Öl, Wärmepumpe)",
                "DACHTYP": "Beschreiben Sie die Art des Daches (z.B. Satteldach, Flachdach)",
                "ANZAHL_STOCKWERKE": "Wie viele Stockwerke hat das Gebäude?",
                "KELLER_VORHANDEN": "Ist ein Keller vorhanden? (Ja/Nein)",
                "ISOLIERUNG": "Welche Art der Dämmung ist vorhanden?",
                "FENSTERTYP": "Welche Art von Fenstern sind installiert?",
                "ENERGIEAUSWEIS": "Liegt ein Energieausweis vor? Wenn ja, welche Energieklasse?"
            }, ensure_ascii=False, indent=2)
        
        return "Demo-Antwort: LLM temporär nicht verfügbar. Bitte versuchen Sie es später erneut."
        
    except Exception as e:
        print(f"Allgemeiner LLM-Fehler: {e}")
        return "Entschuldigung, es gab einen technischen Fehler. Bitte versuchen Sie es erneut."

@app.get("/")
async def root():
    return {
        "message": "FormularIQ Backend läuft", 
        "status": "OK",
        "environment": "production" if os.getenv("RAILWAY_ENVIRONMENT") else "development"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/instructions")
async def generate_instructions(request: ContextRequest):
    """
    Generiert Formularfelder basierend auf Kontext
    """
    try:
        if request.context.strip():
            prompt = f"""
Erstelle ein Gebäudeformular basierend auf folgendem Kontext: {request.context}

Generiere 8-12 relevante Formularfelder im JSON-Format.
Jeder Feldname sollte in GROSSBUCHSTABEN sein.
Jeder Wert sollte eine hilfreiche Eingabeanweisung auf Deutsch sein.

Beispiel-Format:
{{
    "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an",
    "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?"
}}

Kontext: {request.context}
"""
        else:
            prompt = """
Erstelle ein allgemeines Gebäudeformular mit 10 wichtigen Feldern im JSON-Format.
Jeder Feldname sollte in GROSSBUCHSTABEN sein.
Jeder Wert sollte eine hilfreiche Eingabeanweisung auf Deutsch sein.
"""
        
        response = call_llm(prompt, request.context)
        
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
        except:
            # Fallback bei JSON-Parse-Fehlern
            return {
                "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an",
                "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?",
                "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern?",
                "HEIZUNGSART": "Welche Art der Heizung ist installiert?",
                "DACHTYP": "Beschreiben Sie die Art des Daches"
            }
        
    except Exception as e:
        print(f"Instructions-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Generieren der Anweisungen")

@app.post("/api/chat")
async def chat_help(request: ChatRequest):
    """
    Chat-Hilfe für Formularfelder
    """
    try:
        prompt = f"""
Ein Nutzer braucht Hilfe beim Ausfüllen eines Gebäudeformulars.
Frage: {request.message}

Gib eine hilfreiche, konkrete Antwort auf Deutsch in 2-3 Sätzen.
Sei freundlich und praxisorientiert.
"""
        
        response = call_llm(prompt)
        return {"response": response}
        
    except Exception as e:
        print(f"Chat-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Verarbeiten der Chat-Anfrage")

@app.post("/api/dialog/start")
async def start_dialog(request: ContextRequest):
    """
    Startet einen Dialog für Formularbearbeitung
    """
    try:
        prompt = f"""
Erstelle eine Liste von 8-10 Fragen für ein Gebäude-Interview.
Kontext: {request.context}

Format: JSON-Array mit Objekten, jedes mit "question" und "field" Feldern.

Beispiel:
[
    {{"question": "Welche Art von Gebäude möchten Sie erfassen?", "field": "GEBÄUDEART"}},
    {{"question": "In welchem Jahr wurde das Gebäude errichtet?", "field": "BAUJAHR"}}
]

Die Fragen sollten logisch aufeinander aufbauen und auf Deutsch sein.
"""
        
        response = call_llm(prompt, request.context)
        
        # JSON parsen
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                questions = json.loads(json_str)
            else:
                raise ValueError("Kein JSON Array gefunden")
        except:
            # Fallback-Fragen
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
        print(f"Dialog-Start-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Starten des Dialogs")

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """
    Verarbeitet Dialog-Nachrichten
    """
    try:
        if request.message.strip() == "?":
            # Hilfe-Anfrage
            current_field = request.currentQuestion.get('field', '')
            prompt = f"""
Der Nutzer braucht Hilfe bei der Frage: {request.currentQuestion.get('question', '')}
Feld: {current_field}

Gib eine hilfreiche Erklärung in 2-3 Sätzen auf Deutsch.
"""
            help_response = call_llm(prompt)
            return {
                "response": help_response,
                "nextQuestion": False
            }
        else:
            # Normale Antwort verarbeiten
            if request.questionIndex < request.totalQuestions - 1:
                response_text = f"Ihre Antwort '{request.message}' wurde gespeichert. Nächste Frage:"
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
    """
    Speichert Formulardaten
    """
    try:
        output_path = f"LLM Output/{request.filename}"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "instructions": request.instructions,
                "values": request.values,
                "timestamp": datetime.now().isoformat(),
                "type": "form_data"
            }, f, ensure_ascii=False, indent=2)
        
        return {"message": "Daten erfolgreich gespeichert", "filename": request.filename}
    
    except Exception as e:
        print(f"Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern")

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """
    Speichert Dialog-Daten
    """
    try:
        output_path = f"LLM Output/{request.filename}"
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump({
                "questions": request.questions,
                "answers": request.answers,
                "chatHistory": request.chatHistory,
                "timestamp": datetime.now().isoformat(),
                "type": "dialog_data"
            }, f, ensure_ascii=False, indent=2)
        
        return {"message": "Dialog-Daten erfolgreich gespeichert", "filename": request.filename}
    
    except Exception as e:
        print(f"Dialog-Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern der Dialog-Daten")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)