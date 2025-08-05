# backend/main.py - BULLETPROOF CORS FIX (Konflikt gelöst)

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
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

# BULLETPROOF CORS - Erlaubt ALLE Vercel-Domains
@app.middleware("http")
async def cors_handler(request: Request, call_next):
    """Custom CORS Handler der garantiert funktioniert"""
    
    # Hole Origin aus Request
    origin = request.headers.get("origin")
    
    # Führe Request aus
    response = await call_next(request)
    
    # Wenn Origin eine Vercel-Domain ist oder localhost, erlaube es
    if origin and (
        "vercel.app" in origin or 
        "localhost" in origin or 
        "127.0.0.1" in origin or
        "railway.app" in origin
    ):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    
    return response

# OPTIONS Handler für Preflight-Requests
@app.options("/{path:path}")
async def options_handler(request: Request, path: str):
    """Behandelt alle OPTIONS-Requests für CORS"""
    origin = request.headers.get("origin", "")
    
    if "vercel.app" in origin or "localhost" in origin:
        headers = {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true", 
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
        return JSONResponse(content={}, headers=headers)
    
    return JSONResponse(content={"error": "CORS not allowed"}, status_code=403)

# Pydantic Models
class ContextRequest(BaseModel):
    context: str

class ChatRequest(BaseModel):
    message: str

class SaveRequest(BaseModel):
    instructions: Dict[str, Any]
    values: Dict[str, str]
    filename: str

class DialogStartRequest(BaseModel):
    context: Optional[str] = ""

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
    """LLM-Aufruf mit Groq (primär) und Fallbacks"""
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
        "cors": "bulletproof",
        "environment": "production" if os.getenv("RAILWAY_ENVIRONMENT") else "development"
    }

@app.get("/health")
async def health():
    return {"message": "FormularIQ Backend läuft", "status": "OK", "cors": "bulletproof"}

# Test-Endpoint für CORS
@app.get("/api/test")
async def test_cors():
    return {"message": "CORS funktioniert!", "status": "OK", "timestamp": datetime.now().isoformat()}

@app.post("/api/instructions")
async def generate_instructions(request: ContextRequest):
    """Generiert Formular-Anweisungen mit robustem Logging"""
    try:
        print(f"🔍 Instructions-Request empfangen: {request.context[:50]}...")
        
        if request.context.strip():
            prompt = f"""
Erstelle hilfreiche Anweisungen für ein Gebäudeformular basierend auf diesem Kontext: {request.context}

Erstelle ein JSON-Objekt mit Formularfeldern als Schlüssel und hilfreichen Anweisungen als Werte.
Beispiel-Felder: GEBÄUDEART, BAUJAHR, WOHNFLÄCHE, HEIZUNGSART, DACHTYP, ANZAHL_STOCKWERKE, SANIERUNGSBEDARF

Gib nur das JSON zurück, keine weiteren Erklärungen."""
        else:
            prompt = """
Erstelle Standard-Anweisungen für ein Gebäudeformular.

Erstelle ein JSON-Objekt mit typischen Gebäudeformular-Feldern als Schlüssel und hilfreichen Anweisungen als Werte.
Beispiel-Felder: GEBÄUDEART, BAUJAHR, WOHNFLÄCHE, HEIZUNGSART, DACHTYP, ANZAHL_STOCKWERKE, SANIERUNGSBEDARF

Gib nur das JSON zurück, keine weiteren Erklärungen."""
        
        response = call_llm(prompt, request.context)
        print(f"🤖 LLM-Response erhalten: {response[:100]}...")
        
        # Versuche JSON zu parsen
        try:
            # Extrahiere JSON aus der Antwort
            start = response.find('{')
            end = response.rfind('}') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                instructions = json.loads(json_str)
                print(f"✅ JSON erfolgreich geparst: {len(instructions)} Felder")
                return instructions
            else:
                raise ValueError("Kein JSON gefunden")
        except Exception as parse_error:
            print(f"⚠️ JSON-Parse-Fehler: {parse_error}, verwende Fallback")
            # Fallback bei JSON-Parse-Fehler
            return {
                "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an (z.B. Einfamilienhaus, Mehrfamilienhaus)",
                "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?",
                "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern?", 
                "HEIZUNGSART": "Welche Art der Heizung ist installiert? (z.B. Gas, Öl, Wärmepumpe)",
                "DACHTYP": "Beschreiben Sie die Art des Daches (z.B. Satteldach, Flachdach)",
                "ANZAHL_STOCKWERKE": "Wie viele Stockwerke hat das Gebäude?",
                "SANIERUNGSBEDARF": "Welche Sanierungsmaßnahmen sind geplant oder erforderlich?"
            }
        
    except Exception as e:
        print(f"❌ Instructions-Fehler: {e}")
        # Fallback-Instructions
        return {
            "GEBÄUDEART": "Bitte geben Sie die Art Ihres Gebäudes an",
            "BAUJAHR": "In welchem Jahr wurde das Gebäude errichtet?",
            "WOHNFLÄCHE": "Wie groß ist die Wohnfläche in Quadratmetern?",
            "HEIZUNGSART": "Welche Art der Heizung ist installiert?",
            "DACHTYP": "Beschreiben Sie die Art des Daches"
        }

@app.post("/api/chat")
async def chat_help(request: ChatRequest):
    """Chat-Hilfe für Formulare"""
    try:
        print(f"💬 Chat-Request: {request.message}")
        prompt = f"""
Ein Nutzer braucht Hilfe beim Ausfüllen eines Gebäudeformulars.
Frage: {request.message}

Gib eine hilfreiche, konkrete Antwort auf Deutsch in 2-3 Sätzen.
Sei freundlich und praxisorientiert.
"""
        
        response = call_llm(prompt)
        return {"response": response}
        
    except Exception as e:
        print(f"❌ Chat-Fehler: {e}")
        return {"response": "Entschuldigung, ich konnte Ihre Frage nicht beantworten."}

@app.post("/api/dialog/start")
async def start_dialog(request: DialogStartRequest):
    """Startet Dialog-Modus"""
    try:
        print(f"🎭 Dialog-Start mit Kontext: {request.context}")
        prompt = f"""
Erstelle 8-10 wichtige Fragen für ein Gebäudeformular-Interview basierend auf diesem Kontext: {request.context}

Erstelle ein JSON-Array mit Objekten im Format:
[
  {{"question": "Welche Art von Gebäude möchten Sie erfassen?", "field": "GEBÄUDEART"}},
  {{"question": "In welchem Jahr wurde das Gebäude erbaut?", "field": "BAUJAHR"}},
  {{"question": "Wie groß ist die Wohnfläche in Quadratmetern?", "field": "WOHNFLÄCHE"}}
]

Die Fragen sollten natürlich klingen und logisch aufeinander aufbauen.
Gib nur das JSON-Array zurück."""
        
        response = call_llm(prompt, request.context)
        
        try:
            # JSON Array parsen
            start = response.find('[')
            end = response.rfind(']') + 1
            if start != -1 and end != 0:
                json_str = response[start:end]
                questions = json.loads(json_str)
            else:
                raise ValueError("Kein JSON Array gefunden")
        except Exception as parse_error:
            print(f"⚠️ Dialog JSON-Parse-Fehler: {parse_error}")
            # Fallback-Fragen
            questions = [
                {"question": "Welche Art von Gebäude möchten Sie erfassen?", "field": "GEBÄUDEART"},
                {"question": "In welchem Jahr wurde das Gebäude erbaut?", "field": "BAUJAHR"},
                {"question": "Wie groß ist die Wohnfläche in Quadratmetern?", "field": "WOHNFLÄCHE"},
                {"question": "Welche Heizungsart ist installiert?", "field": "HEIZUNGSART"},
                {"question": "Welche Art von Dach hat das Gebäude?", "field": "DACHTYP"},
                {"question": "Wie viele Stockwerke hat das Gebäude?", "field": "ANZAHL_STOCKWERKE"}
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
    """Verarbeitet Dialog-Nachrichten"""
    try:
        current_q = request.currentQuestion
        user_message = request.message
        
        if user_message.strip() == "?":
            # Hilfe angefordert
            help_prompt = f"""
Der Nutzer fragt nach Hilfe bei der Frage: "{current_q.get('question', '')}"
Feld: {current_q.get('field', '')}

Gib eine hilfreiche, kurze Erklärung auf Deutsch was hier gemeint ist und wie man antworten könnte.
"""
            
            help_response = call_llm(help_prompt)
            return {
                "response": help_response,
                "nextQuestion": False
            }
        else:
            # Normale Antwort verarbeiten
            if request.questionIndex < request.totalQuestions - 1:
                response_text = f"Ihre Antwort '{user_message}' wurde gespeichert. Nächste Frage:"
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
        
        return {"message": "Daten erfolgreich gespeichert", "filename": request.filename}
    
    except Exception as e:
        print(f"❌ Speicher-Fehler: {e}")
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
                "chatHistory": request.chatHistory,
                "timestamp": datetime.now().isoformat(),
                "type": "dialog_data"
            }, f, ensure_ascii=False, indent=2)
        
        return {"message": "Dialog-Daten erfolgreich gespeichert", "filename": request.filename}
    
    except Exception as e:
        print(f"❌ Dialog-Speicher-Fehler: {e}")
        raise HTTPException(status_code=500, detail="Fehler beim Speichern der Dialog-Daten")

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    print(f"🚀 Starte FormularIQ Backend mit Bulletproof CORS auf Port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)