# Setup Anweisungen - LLM-gestützte Formularbearbeitung

## Projekt Struktur

```
project-root/
├── frontend/ (Next.js)
├── backend/ (FastAPI)
└── LLM Output/ (wird automatisch erstellt)
```

## Voraussetzungen

1. **Node.js** (Version 18+)
2. **Python** (Version 3.8+)
3. **Ollama** installiert und laufend mit LLaMA3 Modell

### Ollama Setup
```bash
# Ollama installieren (falls noch nicht vorhanden)
curl -fsSL https://ollama.ai/install.sh | sh

# LLaMA3 Modell herunterladen
ollama pull llama3

# Ollama starten (läuft als Service)
ollama serve
```

## Installation

### 1. Frontend (Next.js)

```bash
# In das Frontend-Verzeichnis wechseln
cd frontend

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Das Frontend läuft dann auf `http://localhost:3000`

### 2. Backend (FastAPI)

```bash
# In das Backend-Verzeichnis wechseln
cd backend

# Virtual Environment erstellen (empfohlen)
python -m venv venv

# Virtual Environment aktivieren
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt

# FastAPI Server starten
python main.py
```

Das Backend läuft dann auf `http://localhost:8000`

## Nutzung

### Variante A - Sichtbares Formular
1. Öffne `http://localhost:3000`
2. Klicke auf "Variante A starten"
3. Gib optional Kontextinformationen ein
4. Klicke auf "Anweisungen generieren"
5. Fülle das generierte Formular aus
6. Nutze den Chat für Hilfe
7. Speichere als JSON

### Variante B - Dialog-basiert
1. Öffne `http://localhost:3000`
2. Klicke auf "Variante B starten"
3. Optional: PDF hochladen oder Kontext eingeben
4. Klicke auf "Dialog starten"
5. Beantworte die Fragen Schritt für Schritt
6. Nutze "?" für Rückfragen
7. Speichere die Ergebnisse

## Dateien Struktur

### Neue/Geänderte Dateien:

1. **src/app/form-b/page.tsx** - Dialog-Interface (Variante B)
2. **src/lib/api.ts** - Erweiterte API-Funktionen
3. **backend/main.py** - Vollständiges FastAPI Backend
4. **backend/requirements.txt** - Python Dependencies
5. **src/app/page.tsx** - Aktualisierte Hauptseite

### Ausgabe-Ordner:
- **LLM Output/** - Alle JSON-Ausgaben werden hier gespeichert
  - `output_*.json` (Variante A)
  - `dialog_output_*.json` (Variante B)

## Debugging

### Häufige Probleme:

1. **Ollama nicht erreichbar**
   - Prüfe: `ollama list` (zeigt installierte Modelle)
   - Starte: `ollama serve`

2. **CORS-Fehler**
   - Backend und Frontend müssen beide laufen
   - Frontend: `localhost:3000`
   - Backend: `localhost:8000`

3. **PDF-Upload Probleme**
   - Stelle sicher, dass nur PDF-Dateien hochgeladen werden
   - Prüfe Backend-Logs für detaillierte Fehlermeldungen

4. **LLM-Antworten unvollständig**
   - Das passiert manchmal - die App hat Fallback-Mechanismen
   - Prüfe Backend-Logs für Details

## Entwicklung

### Backend erweitern:
- Neue Endpoints in `backend/main.py` hinzufügen
- Pydantic Models für Request/Response definieren

### Frontend erweitern:
- Neue API-Funktionen in `src/lib/api.ts`
- UI-Komponenten in `src/components/ui/`

## Troubleshooting

### Backend startet nicht:
```bash
# Dependencies neu installieren
pip install -r requirements.txt --force-reinstall

# Python-Version prüfen
python --version
```

### Frontend startet nicht:
```bash
# Dependencies neu installieren
npm install --force

# Cache leeren
npm run build
```

### LLM antwortet nicht:
```bash
# Ollama Status prüfen
ollama ps

# Modell testen
ollama run llama3 "Hallo, kannst du mir helfen?"
```