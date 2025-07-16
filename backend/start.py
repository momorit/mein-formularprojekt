#!/usr/bin/env python3
# backend/start.py - Backend Start Script

import os
import sys
import subprocess

def check_ollama():
    """Prüft ob Ollama läuft und das llama3 Modell verfügbar ist"""
    try:
        result = subprocess.run(['ollama', 'list'], capture_output=True, text=True)
        if 'llama3' not in result.stdout:
            print("❌ LLaMA3 Modell nicht gefunden!")
            print("Bitte installieren mit: ollama pull llama3")
            return False
        print("✅ Ollama und LLaMA3 sind bereit")
        return True
    except FileNotFoundError:
        print("❌ Ollama ist nicht installiert!")
        print("Bitte installieren: https://ollama.ai/")
        return False

def create_directories():
    """Erstellt notwendige Verzeichnisse"""
    os.makedirs("LLM Output", exist_ok=True)
    print("✅ Ausgabe-Verzeichnis erstellt")

def check_dependencies():
    """Prüft ob alle Python-Dependencies installiert sind"""
    try:
        import fastapi
        import uvicorn
        import pdfplumber
        import ollama
        print("✅ Alle Dependencies sind installiert")
        return True
    except ImportError as e:
        print(f"❌ Fehlende Dependency: {e}")
        print("Bitte installieren mit: pip install -r requirements.txt")
        return False

def main():
    print("🚀 Starte Formular-Assistent Backend")
    print("="*50)
    
    # Checks durchführen
    if not check_dependencies():
        sys.exit(1)
    
    if not check_ollama():
        sys.exit(1)
    
    create_directories()
    
    print("\n🎯 Starte FastAPI Server...")
    print("Backend läuft auf: http://localhost:8000")
    print("API Docs: http://localhost:8000/docs")
    print("\n⚡ Drücke Ctrl+C zum Beenden")
    print("="*50)
    
    # FastAPI Server starten
    try:
        import uvicorn
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
    except KeyboardInterrupt:
        print("\n👋 Server beendet")
    except Exception as e:
        print(f"❌ Fehler beim Starten: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()