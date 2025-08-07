# FormularIQ - LLM-gestützte Formularbearbeitung

## 📋 Projektbeschreibung

**FormularIQ** ist eine wissenschaftliche Studie zur Untersuchung der Benutzerfreundlichkeit von LLM-gestützten Formularsystemen. Das Projekt vergleicht zwei Ansätze zur intelligenten Formularbearbeitung:

- **Variante A**: Klassisches sichtbares Formular mit KI-Chat-Unterstützung
- **Variante B**: Interaktives Dialog-System mit konversationeller Datenerfassung

### 🎓 Akademischer Kontext
- **Institution**: HAW Hamburg
- **Fakultät**: Technik und Informatik, Department Informatik  
- **Projekt**: Masterarbeit - Wintersemester 2024/25
- **Forscher**: Moritz Treu

---

## 🏗️ Systemarchitektur

```
FormularIQ/
├── backend/                 # FastAPI Backend
│   ├── main.py             # Hauptserver mit API-Endpunkten
│   ├── requirements.txt    # Python-Dependencies
│   └── service-account-key.json  # Google Drive Credentials
├── src/                    # Next.js Frontend
│   ├── app/               
│   │   ├── page.tsx       # Homepage
│   │   ├── form-a/        # Variante A (Sichtbares Formular)
│   │   └── form-b/        # Variante B (Dialog-System)
│   ├── lib/
│   │   ├── api.ts         # API-Client
│   │   └── types.ts       # TypeScript-Interfaces
│   └── components/        # Wiederverwendbare Komponenten
└── LLM Output/            # Lokale Datenspeicherung (Fallback)
```

### 🔧 Technologie-Stack

#### Backend
- **FastAPI** - Moderne Python Web-API
- **Ollama + LLaMA3** - Large Language Model
- **Google Drive API** - Cloud-Datenspeicherung
- **Pydantic** - Datenvalidierung

#### Frontend  
- **Next.js 14** - React-Framework mit App Router
- **TypeScript** - Typsicherheit
- **Tailwind CSS** - Utility-First CSS

---

## 🚀 Installation & Setup

### Voraussetzungen

- **Node.js** (≥ 18.0.0)
- **Python** (≥ 3.8)
- **Ollama** mit LLaMA3-Modell
- **Google Cloud Account** (für Drive-Integration)

### 1. Repository klonen

```bash
git clone [repository-url]
cd FormularIQ
```

### 2. Backend Setup

#### 2.1 Python-Umgebung vorbereiten

```bash
cd backend

# Virtual Environment erstellen
python -m venv venv

# Aktivieren
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Dependencies installieren
pip install -r requirements.txt
```

#### 2.2 Ollama & LLaMA3 Setup

```bash
# Ollama installieren (macOS/Linux)
curl -fsSL https://ollama.ai/install.sh | sh

# Windows: Download von https://ollama.ai

# LLaMA3 Modell herunterladen
ollama pull llama3

# Ollama-Service starten
ollama serve
```

#### 2.3 Google Drive API konfigurieren

1. **Google Cloud Console** öffnen: https://console.cloud.google.com/
2. **Neues Projekt erstellen** oder existierendes auswählen
3. **Google Drive API aktivieren**:
   - Navigation → "APIs & Services" → "Library" 
   - Nach "Google Drive API" suchen → "Enable"
4. **Service Account erstellen**:
   - "APIs & Services" → "Credentials" → "Create Credentials" → "Service account"
   - Name: `formulariq-storage`
   - Role: `Editor`
5. **JSON-Key generieren**:
   - Service Account auswählen → "Keys" → "Add Key" → "Create new key" → JSON
   - Datei als `service-account-key.json` ins `backend/`-Verzeichnis speichern

#### 2.4 Backend starten

```bash
python main.py
```

✅ **Backend läuft auf**: http://localhost:8000

### 3. Frontend Setup

#### 3.1 Node.js-Dependencies installieren

```bash
cd .. # zurück ins Hauptverzeichnis
npm install
```

#### 3.2 Development-Server starten

```bash
npm run dev
```

✅ **Frontend läuft auf**: http://localhost:3000

---

## 🔍 System-Verifikation

### Backend Health-Check
```bash
curl http://localhost:8000/health
```

**Erwartete Antwort:**
```json
{
  "status": "healthy",
  "services": {
    "google_drive": "connected",
    "llm_ollama": "online"
  },
  "timestamp": "2024-XX-XXTXX:XX:XX"
}
```

### Frontend-Test
1. Browser öffnen: http://localhost:3000
2. System-Status-Indikator sollte "online" anzeigen
3. Beide Varianten-Buttons sollten funktionsfähig sein

---

## 🎯 Nutzung

### Für Studienteilnehmer

1. **Homepage** besuchen: http://localhost:3000
2. **Instruktionen** lesen und Systemanforderungen prüfen
3. **Variante A** oder **B** starten (beliebige Reihenfolge)
4. **Gebäudeformular** entsprechend der gewählten Variante ausfüllen
5. **Daten automatisch speichern** lassen
6. **Zweite Variante** testen
7. **Beide Varianten vergleichen** (optional)

### Für Forscher/Administratoren

#### Datenzugriff
- **Google Drive**: Ordner `FormularIQ_Studiendata`
- **Lokaler Fallback**: `LLM Output/`-Verzeichnis

#### Datenstruktur
```json
{
  "variant": "A_sichtbares_formular" | "B_dialog_system",
  "timestamp": "2024-XX-XXTXX:XX:XX",
  "instructions|questions": {...},
  "values|answers": {...},
  "chatHistory": [...],
  "metadata": {
    "completion_rate": 85.5,
    "total_fields": 8,
    "filled_fields": 7
  },
  "study_metadata": {
    "project": "FormularIQ - LLM-gestützte Formularbearbeitung",
    "institution": "HAW Hamburg",
    "researcher": "Moritz Treu"
  }
}
```

---

## 🛠️ Entwicklung & Debugging

### Häufige Probleme

#### 1. Ollama nicht erreichbar
```bash
# Status prüfen
ollama list

# Neustart
ollama serve

# Modell testen
ollama run llama3 "Test"
```

#### 2. Google Drive API-Fehler
- **Credentials prüfen**: `service-account-key.json` korrekt platziert?
- **API aktiviert**: Drive API in Google Cloud Console aktiviert?
- **Berechtigungen**: Service Account hat Editor-Rolle?

#### 3. CORS-Probleme
- **Beide Services laufen**: Backend (8000) + Frontend (3000)
- **URLs korrekt**: Keine Proxy/VPN-Konflikte

#### 4. TypeScript-Fehler
```bash
# Type-Check
npm run type-check

# Build-Test
npm run build
```

### Logging & Monitoring

#### Backend-Logs
```bash
# Detaillierte Ausgabe im Terminal beim Start
python main.py
```

#### Frontend-Logs
```bash
# Browser Developer Console (F12)
# Network-Tab für API-Requests
```

---

## 📊 Datenanalyse

### Exportierte Datenfelder

#### Variante A (Formular)
- `instructions`: Generierte Formularfelder
- `values`: Benutzer-Eingaben  
- `metadata.completion_rate`: Ausfüllungsgrad
- `metadata.filled_fields`: Anzahl ausgefüllter Felder

#### Variante B (Dialog)
- `questions`: Dialog-Fragenkatalog
- `answers`: Benutzer-Antworten
- `chatHistory`: Vollständiger Gesprächsverlauf
- `metadata.chat_interactions`: Anzahl Nachrichten

### Analysemöglichkeiten
- **Bearbeitungszeiten** (Timestamps)
- **Vollständigkeitsraten** (Completion Rates) 
- **Interaktionsmuster** (Chat-Verläufe)
- **Hilfeanfragen** ("?"-Eingaben)
- **Systemnutzung** (Field-Types, Error-Rates)

---

## 🔒 Sicherheit & Datenschutz

### Implementierte Maßnahmen
- ✅ **Vollständige Anonymisierung** der Teilnehmerdaten
- ✅ **DSGVO-konforme Speicherung** in europäischen Rechenzonen  
- ✅ **Verschlüsselte Übertragung** (HTTPS in Production)
- ✅ **Minimale Datensammlung** (nur studienrelevante Informationen)
- ✅ **Automatische Metadaten-Ergänzung** für wissenschaftliche Zuordnung

### Service Account Sicherheit
```bash
# Niemals in Versionskontrolle committen
echo "service-account-key.json" >> .gitignore

# Berechtigungen minimal halten
# Nur Google Drive File-Access, keine Admin-Rechte
```

---

## 🚀 Deployment (Production)

### Frontend (Vercel/Netlify)
```bash
npm run build
npm run start
```

### Backend (Railway/Heroku)
```bash
# Dockerfile oder requirements.txt für Container-Deployment
# Umgebungsvariablen für Google Service Account
```

### Umgebungsvariablen
```bash
# Frontend
NEXT_PUBLIC_API_URL=https://your-backend-url.com

# Backend  
PORT=8000
GOOGLE_SERVICE_ACCOUNT_KEY=base64-encoded-key
```

---

## 📞 Support & Kontakt

### Technische Issues
- **GitHub Issues**: Für Bug-Reports und Feature-Requests
- **Entwickler**: Moritz Treu - HAW Hamburg

### Wissenschaftliche Fragen
- **Betreuer**: Prof. Dr. [Name]
- **Fakultät**: Technik und Informatik, HAW Hamburg

### Systemstatus
- **Health-Check**: http://localhost:8000/health
- **API-Dokumentation**: http://localhost:8000/docs (automatisch generiert)

---

## 📜 Lizenz

Dieses Projekt wurde für wissenschaftliche Zwecke im Rahmen einer Masterarbeit an der HAW Hamburg entwickelt. Alle Rechte vorbehalten.

**Copyright © 2024 HAW Hamburg - FormularIQ Studie**