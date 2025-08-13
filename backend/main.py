# backend/main.py - RAILWAY DEBUG VERSION
import os
import json
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional
from pathlib import Path

print("🔧 Railway Debug Mode")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Environment variables:")
for key, value in os.environ.items():
    if 'PORT' in key or 'RAILWAY' in key or 'HOST' in key:
        print(f"  {key}: {value}")

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import aiofiles

# Port configuration - Railway specific
PORT = int(os.getenv("PORT", os.getenv("RAILWAY_PORT", 8000)))
HOST = os.getenv("HOST", "0.0.0.0")

print(f"🌐 Will bind to: {HOST}:{PORT}")

app = FastAPI(
    title="FormularIQ Backend - Railway Debug",
    description="Railway debugging version",
    version="2.8.0-debug"
)

# Ultra-permissive CORS for debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

print("✅ CORS configured (ultra-permissive for debugging)")

# Storage
LOCAL_OUTPUT_DIR = Path("output")
LOCAL_OUTPUT_DIR.mkdir(exist_ok=True)

# Models
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

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"📥 {request.method} {request.url} from {request.client.host if request.client else 'unknown'}")
    print(f"   Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    print(f"📤 Response: {response.status_code}")
    return response

# === ENDPOINTS ===

@app.get("/")
async def root():
    """Root endpoint with extensive debug info"""
    debug_info = {
        "message": "FormularIQ Backend - Railway Debug",
        "status": "healthy",
        "version": "2.8.0-debug",
        "timestamp": datetime.now().isoformat(),
        "debug": {
            "host": HOST,
            "port": PORT,
            "cwd": os.getcwd(),
            "python_version": sys.version,
            "railway_environment": os.getenv("RAILWAY_ENVIRONMENT"),
            "port_sources": {
                "PORT": os.getenv("PORT"),
                "RAILWAY_PORT": os.getenv("RAILWAY_PORT"),
                "final_port": PORT
            },
            "file_system": {
                "output_dir_exists": LOCAL_OUTPUT_DIR.exists(),
                "current_files": list(os.listdir("."))[:10]  # First 10 files
            }
        }
    }
    
    print(f"🏠 Root endpoint called - returning debug info")
    return debug_info

@app.get("/health")
async def health_check():
    """Comprehensive health check for Railway"""
    health_data = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.8.0-debug",
        "railway": {
            "environment": os.getenv("RAILWAY_ENVIRONMENT"),
            "port": PORT,
            "host": HOST
        },
        "services": {
            "api": "online",
            "storage": "available",
            "cors": "enabled"
        },
        "system": {
            "python_version": sys.version.split()[0],
            "working_directory": os.getcwd(),
            "output_directory": str(LOCAL_OUTPUT_DIR)
        }
    }
    
    print(f"💚 Health check successful")
    return health_data

@app.get("/debug")
async def debug_endpoint():
    """Special debug endpoint"""
    return {
        "debug": "This endpoint is working",
        "timestamp": datetime.now().isoformat(),
        "environment": dict(os.environ),
        "railway_specific": {
            "RAILWAY_ENVIRONMENT": os.getenv("RAILWAY_ENVIRONMENT"),
            "PORT": os.getenv("PORT"),
            "RAILWAY_PORT": os.getenv("RAILWAY_PORT"),
            "PYTHONUNBUFFERED": os.getenv("PYTHONUNBUFFERED")
        }
    }

@app.post("/api/generate-instructions")
async def generate_instructions(request: ContextRequest):
    """Generate form instructions"""
    print(f"📝 Generate instructions called with context: {request.context[:50] if request.context else 'empty'}")
    
    instructions = [
        "Geben Sie die Art Ihres Gebäudes an",
        "In welchem Jahr wurde das Gebäude errichtet?",
        "Wie groß ist die Wohnfläche in Quadratmetern?",
        "Welche Art der Heizung ist installiert?",
        "Beschreiben Sie den Dämmzustand",
        "Welcher Fenstertyp ist installiert?"
    ]
    
    print(f"✅ Instructions generated: {len(instructions)} items")
    return {"instructions": instructions}

@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Chat endpoint"""
    print(f"💬 Chat called with message: {request.message[:50]}")
    
    response = f"Echo: {request.message} (received at {datetime.now().strftime('%H:%M:%S')})"
    
    print(f"✅ Chat response generated")
    return {"response": response}

@app.post("/api/save")
async def save_form_data(request: SaveRequest):
    """Save form data"""
    print(f"💾 Save called with {len(request.instructions)} instructions and {len(request.values)} values")
    
    try:
        save_data = {
            "variant": "A_debug",
            "timestamp": datetime.now().isoformat(),
            "instructions": request.instructions,
            "values": request.values
        }
        
        filename = f"debug_save_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        local_path = LOCAL_OUTPUT_DIR / filename
        
        async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
        
        print(f"✅ Data saved to: {local_path}")
        return {
            "message": "Debug save successful",
            "filename": filename,
            "path": str(local_path)
        }
        
    except Exception as e:
        print(f"💥 Save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/dialog/start")
async def start_dialog(request: DialogStartRequest):
    """Start dialog session"""
    print(f"🎭 Dialog start called")
    
    questions = [
        {"question": "Debug: Welche Art von Gebäude?", "field": "GEBÄUDEART"},
        {"question": "Debug: Baujahr?", "field": "BAUJAHR"},
        {"question": "Debug: Wohnfläche?", "field": "WOHNFLÄCHE"}
    ]
    
    session_id = f"debug_session_{datetime.now().strftime('%H%M%S')}"
    
    print(f"✅ Dialog session created: {session_id}")
    return {
        "session_id": session_id,
        "questions": questions,
        "totalQuestions": len(questions),
        "currentQuestionIndex": 0,
        "currentQuestion": questions[0]
    }

@app.post("/api/dialog/message")
async def dialog_message(request: DialogMessageRequest):
    """Process dialog message"""
    print(f"💬 Dialog message: {request.message}")
    
    if request.message.strip() == "?":
        response = "Debug help: This is a test response"
    else:
        response = f"Debug echo: {request.message} (processed at {datetime.now().strftime('%H:%M:%S')})"
    
    print(f"✅ Dialog response generated")
    return {
        "response": response,
        "nextQuestion": True,
        "helpProvided": request.message.strip() == "?"
    }

@app.post("/api/dialog/save")
async def save_dialog_data(request: DialogSaveRequest):
    """Save dialog data"""
    print(f"💾 Dialog save called")
    
    try:
        save_data = {
            "variant": "B_debug",
            "timestamp": datetime.now().isoformat(),
            "questions": request.questions,
            "answers": request.answers,
            "chatHistory": request.chatHistory
        }
        
        filename = f"debug_dialog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        local_path = LOCAL_OUTPUT_DIR / filename
        
        async with aiofiles.open(local_path, 'w', encoding='utf-8') as f:
            await f.write(json.dumps(save_data, ensure_ascii=False, indent=2))
        
        print(f"✅ Dialog data saved to: {local_path}")
        return {
            "message": "Debug dialog save successful",
            "filename": filename
        }
        
    except Exception as e:
        print(f"💥 Dialog save failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Startup event
@app.on_event("startup")
async def startup_event():
    print("🚀 Railway Debug Backend startup complete")
    print(f"📂 Output directory: {LOCAL_OUTPUT_DIR}")
    print(f"🌐 Server should be available at: http://{HOST}:{PORT}")
    print("🔍 Debug endpoint: /debug")
    print("💚 Health endpoint: /health")

# Main function
if __name__ == "__main__":
    print(f"🚀 Starting Railway Debug Server")
    print(f"🌐 Binding to: {HOST}:{PORT}")
    
    try:
        uvicorn.run(
            "main:app",
            host=HOST,
            port=PORT,
            reload=False,
            log_level="info",
            access_log=True
        )
    except Exception as e:
        print(f"💥 Failed to start server: {e}")
        sys.exit(1)