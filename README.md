# 🏢 FormularIQ – KI‑gestützte Formularbearbeitung (Variante A vs. B)

Forschungsprojekt an der HAW Hamburg. Vergleich zweier Interaktionsparadigmen zur Formularbearbeitung mit LLM‑Unterstützung:

- 📋 Variante A: Sichtbares Webformular mit KI‑Hinweisen und Chat
- 💬 Variante B: Dialogbasiertes System, das Formularfelder konversational klärt

Technik: Next.js 15 · TypeScript · Tailwind · shadcn/ui · Groq (Generierung) · Ollama (Embeddings) · Datei‑basierter Vektor‑Store (JSON)

—

## Inhalt
- Überblick und Architektur
- Setup und Start (inkl. .env)
- RAG (Upload → Parsing → Chunking → Embedding → Suche)
- LLM/Prompting (Modi, Modelle, Fehlerfälle)
- Wichtige API‑Endpunkte und Flows
- Code‑Karte (Dateien und Verantwortlichkeiten)
- Häufige Aufgaben
- Troubleshooting und Tipps

—

## Überblick

System zum Vergleich zweier KI‑gestützter Formular‑UIs im Energieberatungs‑Szenario. Die App kombiniert:
- Frontend (Next.js, React, Tailwind, shadcn/ui)
- Backend (Next.js API Routes; Node.js Runtime)
- LLM‑Generierung über Groq (chat.completions)
- Lokalen Vektorindex (JSON) mit Embeddings via Ollama

ASCII‑Architektur
```
Browser (Variante A/B, RAG-UI)
   │
   ├── /api/generate-instructions   (LLM: Feldhinweise)
   ├── /api/chat                    (LLM + optional RAG für Formhilfe)
   ├── /api/dialog/*                (LLM gesteuerter Dialogfluss)
   └── /api/rag/*                   (Upload/Index/Suche/Ask)
                                   │
LLM (Groq)  ←→  callLLM()           │        RAG Store (JSON: data/rag)
                                   │        ├─ chunks.json (Embeddings)
Ollama (Embeddings)  ←→  /api/embeddings    └─ docs.json   (Metadaten)
```

—

## Setup

Voraussetzungen
- Node.js ≥ 18
- Groq API‑Key für Generierung
- Optional: lokale Ollama‑Instanz für RAG‑Embeddings (empfohlen)

Installation
```bash
npm install
```

.env.local (Beispiel)
```env
LLM_PROVIDER=groq
GROQ_API_KEY=...            # erforderlich für Generierung
OLLAMA_HOST=http://localhost:11434
# Optional/RAG-Feintuning
# OLLAMA_EMBED_MODEL=nomic-embed-text
# RAG_DATA_DIR=./data/rag
# RAG_CHUNK_SIZE=1500
# RAG_CHUNK_OVERLAP=200
# RAG_TOP_K=5
# RAG_MIN_SCORE=0.15
# RAG_MAX_CONTEXT_CHARS=6000
```

Start
```bash
npm run dev
# App: http://localhost:3000
```

Ollama Embedding‑Modell vorbereiten (lokal)
```bash
# Beispiel (eines wählen)
ollama pull nomic-embed-text
# oder
ollama pull all-minilm
```

—

## RAG: Upload → Index → Suche → Ask

UI: „RAG Verwaltung“ unter `/rag`.

- Upload: PDF/DOCX/TXT → `/api/rag/upload`
  - Parsing: `pdf-parse` (PDF), `mammoth` (DOCX), Fallback Text
  - Normalisierung: De‑Hyphenation, Whitespaces, Unicode‑Cleanup
- Chunking: absatzsensitiv, Zielgröße/Overlap konfigurierbar
- Embedding: Ollama `/api/embeddings` (Default: `nomic-embed-text`)
- Persistenz: JSON unter `data/rag/` (konfigurierbar via `RAG_DATA_DIR`)
- Suche: `searchTopK` (Cosine), Filter via `RAG_MIN_SCORE`, Top‑K via `RAG_TOP_K`
- RAG‑Chat (streng): `/api/rag/ask` – nur dokumentenbasierte Antworten, sonst „Nicht gefunden“

—

## LLM/Prompting

Zentrale Funktion: `src/lib/llm.ts` → `callLLM(prompt, context, dialogMode, systemOverride)`
- Provider: Groq (Chat Completions)
- Modelle: `GROQ_MODEL` mit Fallbacks (`GROQ_MODEL_FALLBACKS`), Default: `llama3-8b-8192`
- Modi:
  - Beratung (Standard): kurze, fokussierte Antworten, deutsch, kontextsensitiv
  - Dialogmodus: 1–3 Sätze, Paraphrase + genau 1 Frage, keine Listen/Labels
- Fehlerbehandlung: API‑Key, Rate‑Limit, Modellverfügbarkeit → klare Fehlermeldungen

Prompt‑Beispiele
- Feldhinweise (JSON only): `/api/generate-instructions`
- Form‑Chat (feldnah, deutsch, optionaler RAG‑Kontext): `/api/chat`
- Strenger RAG‑Modus (Kontextpflicht, Quellen, „Nicht gefunden“): `/api/rag/ask`
- Dialogfluss (Follow‑up/Progress/Antwort): `/api/dialog/message`

—

## Wichtige Endpunkte

LLM & Dialog
- `POST /api/generate-instructions` – generiert knappe Feldhinweise + Welcome
- `POST /api/chat` – KI‑Hilfe im Formular (mit optionalen RAG‑Quellen)
- `POST /api/dialog/start` – begrüßt und stellt Frage 1/4
- `POST /api/dialog/message` – flexible Dialoglogik (Follow‑up, Fortschritt, Abschluss)
- `GET  /api/debug/llm` – Groq‑Checks und Testaufrufe

RAG
- `POST /api/rag/upload` – Datei indizieren (parse → chunk → embed → speichern)
- `POST /api/rag/search` – semantische Suche
- `GET  /api/rag/list` – Dokumente listen
- `POST /api/rag/delete` – Dokument entfernen
- `GET  /api/rag/doc/:id` – Vorschau erster Chunks
- `POST /api/rag/ask` – strenger RAG‑Chat

Sonstiges
- `POST /api/save` – Variante‑A Daten (logging‑basiert)
- `POST /api/dialog/save` – Variante‑B Daten (logging‑basiert)
- `GET  /api/health` – einfache Status‑Probe

—

## Code‑Karte (Dateien → Zweck)

LLM
- `src/lib/llm.ts` – zentrale Groq‑Anbindung, Modus‑Prompts, Fallbacks, Fehlerbehandlung

RAG
- `src/lib/rag/parse.ts` – PDF/DOCX/Text‑Parsing, Normalisierung
- `src/lib/rag/chunk.ts` – absatzsensitives Chunking mit Overlap
- `src/lib/rag/ollama.ts` – Ollama‑Client für Embeddings/Generate
- `src/lib/rag/store.ts` – JSON‑Store, Cosine‑Suche, Kontextformatierung

APIs (Auswahl)
- `src/app/api/chat/route.ts` – Form‑Chat (Kontextanreicherung + optionales RAG)
- `src/app/api/rag/ask/route.ts` – strenger RAG‑Chat
- `src/app/api/rag/*` – Upload/Liste/Suche/Delete/Preview
- `src/app/api/generate-instructions/route.ts` – Feldhinweise (JSON Only)
- `src/app/api/dialog/start|message` – Dialoglogik
- `src/app/api/ui/snippets/route.ts` – kurze UI‑Texte (Intro/Tipps)

UI
- `src/components/VariantA.tsx` – sichtbares Formular + Chat
- `src/components/VariantB.tsx` – flexibler Dialog mit Follow‑up‑Erkennung
- `src/app/rag/page.tsx` – RAG Admin/Debug‑UI

—

## Häufige Aufgaben

Embedding‑Modell wechseln (Ollama)
```env
OLLAMA_EMBED_MODEL=all-minilm
```
Dokumente neu indizieren: `data/rag/chunks.json`/`docs.json` archivieren/löschen, Upload erneut durchführen.

Antwortstil anpassen
- Beratung: `src/lib/llm.ts` – Basis‑Systemprompt ändern
- Dialog: `src/app/api/dialog/message/route.ts` – `systemPrompt`/Richtlinien
- Strenger RAG: `src/app/api/rag/ask/route.ts` – `systemOverride`

—

## Troubleshooting

„GROQ_API_KEY fehlt“
- `.env.local` setzen, Dev‑Server neu starten, `GET /api/debug/llm` prüfen

„Ollama embeddings failed“
- Läuft Ollama (`OLLAMA_HOST`)? Modell gepullt? Port erreichbar? Logs prüfen

RAG‑Suche liefert 0 Treffer
- `RAG_MIN_SCORE` zu hoch? Falsches Embedding‑Modell (Dimensions‑Mismatch) → neu indizieren

„Nicht gefunden“ bei `/api/rag/ask`
- Erwartet im strengen Modus; falls bekanntes Wissen fehlt: Dokumente/Chunks prüfen

—

## Datenschutz & Sicherheit (Kurz)

- Anonymisierte Studiennutzung; keine persistente User‑Tracking‑IDs
- API‑Keys als Umgebungsvariablen; keine Logs von Secrets
- Transportverschlüsselung (Produktivbetrieb) und minimal notwendige Datenerfassung

—

## Lizenz / Zitation

Forschungs-/Lehrzwecke. Bitte im Kontext „FormularIQ – LLM‑gestützte Formularbearbeitung, HAW Hamburg“ referenzieren.

