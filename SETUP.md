# Setup – Next.js App mit integrierten API Routes

Dieser Stand nutzt ausschließlich Next.js (App Router) mit integrierten API‑Routen. Es gibt kein separates Backend (FastAPI/Ollama) mehr.

## Projektstruktur (vereinfacht)

```
project-root/
├── src/app/                 # Pages, Layout, API Routes
│   └── api/...              # Server-Only Endpoints (Chat, Dialog, Fragebögen, Studie)
├── src/components/          # UI & Feature-Komponenten
├── src/lib/                 # Utils & Server-Libs (LLM, API-Helpers)
├── public/                  # Statische Assets
├── next.config.mjs          # Next.js Konfiguration
└── README.md / SETUP.md     # Doku
```

## Voraussetzungen

1. Node.js 18+
2. Groq API Key (für LLM): `GROQ_API_KEY`
3. Optional: Google Cloud Storage (für persistente Speicherung)

## Installation & Start

```bash
# Dependencies installieren
npm install

# Dev-Server starten (http://localhost:3000)
npm run dev
```

## Umgebungsvariablen

Erstelle `.env.local` im Projektwurzelverzeichnis:

```
# LLM (Groq)
GROQ_API_KEY=...dein_key...

# Optional: Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_BUCKET_NAME=your-bucket
# Entweder Base64 des JSON oder das JSON direkt
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account",...}
# oder
# GOOGLE_CLOUD_CREDENTIALS=BASE64_ENCODED_JSON
```

Ohne GCS-Variablen werden Daten strukturiert in den Server-Logs ausgegeben (Vercel‑kompatibel).

## Nutzung

- Variante A – Sichtbares Formular: `http://localhost:3000/form-a`
- Variante B – Dialog-System: `http://localhost:3000/form-b`
- Studienflow: `http://localhost:3000/study`

Die App speichert Form-/Dialog-/Fragebogen‑Daten über Next.js API Routes unter `/api/...`.

## Wichtige API‑Endpoints

- `/api/health` – Health Check
- `/api/generate-instructions` – Formularanweisungen (Variante A)
- `/api/chat` – Chat‑Hilfe (LLM, Variante A)
- `/api/dialog/start|message|save` – Dialogsteuerung (Variante B)
- `/api/questionnaire/save` – Fragebogen‑Daten
- `/api/study/save` – Gesamt‑Studiendaten (mit optionalem GCS)

Debug/Diagnose:
- `/api/debug/llm` – Testet LLM‑Konnektivität (Groq)
- `/api/debug/gcs` – Testet GCS‑Konnektivität (nur falls Variablen gesetzt)

## Häufige Probleme

1) LLM antwortet nicht
- Prüfe `GROQ_API_KEY` in `.env.local`
- `GET /api/debug/llm` aufrufen und Rückgabe ansehen

2) Google Cloud Storage speichert nicht
- Prüfe Variablen (`/api/debug/gcs`)
- Service‑Account‑Rolle: `Storage Object Admin` auf den Bucket

3) Build/Start-Probleme
```bash
rm -rf .next node_modules
npm install
npm run dev
```

## Entwicklungshinweise

- Server‑Only Logik (LLM, GCS) liegt in API‑Routes bzw. `src/lib/llm.ts`
- Client‑Komponenten befinden sich unter `src/components/`
- Für Studienfluss siehe `src/app/study/page.tsx`

## Deployment

- Empfohlen: Vercel. Env‑Vars im Dashboard setzen.
- Ohne GCS werden die Daten sicher in Logs ausgegeben (Export möglich).
