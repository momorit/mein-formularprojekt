# 🏢 FormularIQ - KI-gestützte Formularbearbeitung

> **Innovatives Forschungsprojekt an der HAW Hamburg**  
> Vergleich von sichtbaren Formularen vs. Dialog-Systemen mit Large Language Models

[![Next.js](https://img.shields.io/badge/Next.js-15.4.1-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Research-green)](LICENSE)

---

## 🎯 Projektziel

FormularIQ erforscht innovative Ansätze zur **KI-gestützten Formularbearbeitung** und vergleicht zwei Interaktionsparadigmen:

- **📋 Variante A**: Klassisches sichtbares Formular mit KI-Chat-Unterstützung
- **💬 Variante B**: Konversationelle Datenerfassung durch Dialog-System

**Anwendungsfall:** Gebäude-Energieberatung für Mehrfamilienhäuser mit komplexen Förderanträgen.

---

## 🚀 Quick Start

### Voraussetzungen
- **Node.js** ≥ 18.0.0
- **npm** oder **yarn**
- **Git**

### Installation

```bash
# Repository klonen
git clone https://github.com/your-username/formulariq.git
cd formulariq

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

✅ **Anwendung läuft auf**: http://localhost:3000

---

## 🏗️ Systemarchitektur

### Tech Stack
```
Frontend:    Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend:     Next.js API Routes (Serverless Functions)
Deployment:  Vercel (Full-Stack)
Storage:     Vercel Logging + JSON Export
State:       React State (keine Browser Storage APIs)
```

### Projektstruktur
```
FormularIQ/
├── src/app/
│   ├── page.tsx                    # Landing & Redirect
│   ├── study/page.tsx              # Haupt-Studienablauf
│   ├── form-a/page.tsx             # Variante A Wrapper
│   ├── form-b/page.tsx             # Variante B Wrapper
│   └── api/                        # Backend API Routes
│       ├── save/route.ts           # Variante A Daten
│       ├── dialog/save/route.ts    # Variante B Daten
│       ├── questionnaire/save/route.ts # Fragebogen-Daten
│       └── study/complete/route.ts # Studie-Abschluss
├── src/components/
│   ├── VariantA.tsx                # Sichtbares Formular
│   ├── VariantB.tsx                # Dialog-System
│   ├── LoadingStates.tsx           # UI Loading Components
│   ├── ui/                         # shadcn/ui Komponenten
│   └── Questionnaire/              # Fragebogen-System
│       ├── EnhancedQuestionnaire.tsx # Haupt-Fragebogen
│       ├── TrustQuestionnaire.tsx  # Vertrauen (5-Punkt Likert)
│       ├── SUSQuestionnaire.tsx    # System Usability Scale
│       └── PreferenceQuestionnaire.tsx # Nutzerpräferenz
└── public/                         # Statische Assets
```

---

## 📊 Studiendesign

### Ablauf (6 Schritte)
```
1. intro → 2. demographics → 3. variant1_intro → [Variante] → 4. variant1_survey → 
5. variant2_intro → [Variante] → 6. variant2_survey → 7. final_comparison → 8. complete
```

### Randomisierung
- **Deterministische Zuordnung** basierend auf Teilnehmer-ID
- **Balancierte A-B / B-A Reihenfolge** über alle Sessions
- **Konsistente Navigation** mit URL-Parametern

### Messgrößen
- **Bearbeitungszeiten** (automatische Timestamps)
- **Vollständigkeitsraten** (Completion Rates)
- **Vertrauen in KI-Systeme** (5-Item Likert-Skala)
- **System Usability Scale** (SUS, 10 Items)
- **Nutzerpräferenzen** (Direktvergleich & Empfehlungen)

---

## 🔧 Entwicklung

### Lokaler Development

```bash
# Development Server
npm run dev

# Type Checking
npm run type-check

# Production Build
npm run build

# Preview Production Build
npm run start
```

### API Endpoints

| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/health` | GET | System Health Check |
| `/api/save` | POST | Variante A Formulardaten |
| `/api/dialog/save` | POST | Variante B Dialogdaten |
| `/api/questionnaire/save` | POST | Fragebogen-Antworten |
| `/api/study/complete` | POST | Studie-Abschluss |

### Datenstruktur (Export)

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

## 🎮 Nutzung

### Für Studienteilnehmer

1. **Homepage** besuchen → Instruktionen lesen
2. **Demografische Daten** eingeben (Schritt 1)
3. **Erste Variante** testen (A oder B, randomisiert)
4. **Fragebogen** zu Variante 1 ausfüllen
5. **Zweite Variante** testen
6. **Fragebogen** zu Variante 2 ausfüllen  
7. **Vergleich & Präferenzen** bewerten
8. **Abschluss** - Daten gespeichert

### Für Forscher/Administratoren

#### Datenzugriff
- **Vercel Dashboard**: Echtzeit-Logs und Analytics
- **JSON Export**: Strukturierte Datenexporte
- **Anonymisierung**: Automatische Teilnehmer-ID Generation

#### Monitoring
```bash
# System Status prüfen
curl https://mein-formularprojekt.vercel.app/api/health

# Expected Response:
{
  "status": "healthy",
  "timestamp": "2024-XX-XXTXX:XX:XX",
  "version": "2.0.0"
}
```

---

## 🛠️ Deployment

### Vercel (Empfohlen)

```bash
# Vercel CLI installieren
npm i -g vercel

# Projekt deployen
vercel

# Domain konfigurieren
vercel --prod
```

### Umgebungsvariablen

```env
# Vercel Dashboard → Settings → Environment Variables
NEXT_PUBLIC_SITE_URL=https://mein-formularprojekt.vercel.app
NODE_ENV=production
```

### Custom Domain Setup

```bash
# Domain hinzufügen
vercel domains add beispiel-studie.de

# SSL automatisch konfiguriert ✅
```

---

## 📈 Monitoring & Analytics

### Performance Monitoring
- **Vercel Analytics**: Automatische Performance-Metriken
- **Core Web Vitals**: LCP, FID, CLS Tracking
- **Error Tracking**: Echtzeit-Fehlermeldungen

### Nutzerdaten (Anonymisiert)
- **Session-Längen** und **Completion-Raten**
- **Device/Browser-Verteilung**  
- **Geografische Verteilung** (Land-Ebene)

---

## 🔒 Datenschutz & Sicherheit

### DSGVO-Compliance
- ✅ **Vollständige Anonymisierung** aller Teilnehmerdaten
- ✅ **Minimale Datensammlung** (nur studienrelevant)
- ✅ **Europäische Server** (Vercel EU-Region)
- ✅ **Verschlüsselte Übertragung** (TLS 1.3)
- ✅ **Keine persistente User-Tracking**

### Sicherheitsmaßnahmen
- **Content Security Policy** (CSP) Headers
- **HTTPS-Only** in Production
- **Input Validation** auf Client- und Server-Seite
- **Rate Limiting** für API-Endpoints

---

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Browser Testing
- **Chrome/Edge**: Vollständig unterstützt
- **Firefox**: Vollständig unterstützt  
- **Safari**: Vollständig unterstützt
- **Mobile**: Responsive Design getestet

---

## 📚 Wissenschaftlicher Hintergrund

### Forschungsfragen
1. **Effizienz**: Welche Variante ermöglicht schnellere Formularbearbeitung?
2. **Benutzerfreundlichkeit**: Welche Interaktionsform wird als intuitiver empfunden?
3. **Vertrauen**: Wie unterscheidet sich das Vertrauen in beide KI-Unterstützungsformen?
4. **Präferenz**: Welche Faktoren beeinflussen die Nutzerpräferenz?

### Methodologie
- **Within-Subject Design**: Alle Teilnehmer testen beide Varianten
- **Randomisierte Reihenfolge**: Ausgleich von Lerneffekten
- **Standardisierte Fragebögen**: SUS, Trust Scale, demografische Daten
- **Quantitative + Qualitative Daten**: Metriken + offenes Feedback

### Zielpublikation
- **Konferenz**: HCI, CHI, UIST, oder ähnliche
- **Journal**: Computers in Human Behavior, IJHCI
- **Fokus**: Human-AI Interaction, Form Design, Conversational UI

---

## 🤝 Beitragen

### Development Guidelines
```bash
# Branch erstellen
git checkout -b feature/neue-funktion

# Commits mit Convention
git commit -m "feat: neue Fragebogen-Komponente hinzugefügt"

# Pull Request erstellen
```

### Code Style
- **TypeScript**: Strikte Typisierung
- **ESLint**: Automatische Code-Qualität
- **Prettier**: Einheitliche Formatierung
- **Komponenten**: Funktionale React Components mit Hooks

### Testing Requirements
- **Unit Tests**: Für alle Utilities und Helpers
- **Component Tests**: Für UI-Komponenten
- **Integration Tests**: Für API-Endpoints
- **E2E Tests**: Für kritische User Journeys

---

## 🐛 Troubleshooting

### Häufige Probleme

#### 1. Build-Fehler
```bash
# Cache leeren
npm run clean
rm -rf .next node_modules
npm install

# Type-Check
npm run type-check
```

#### 2. Styling-Probleme
```bash
# Tailwind CSS regenerieren
npm run build:css

# shadcn/ui Komponenten updaten
npx shadcn-ui@latest add button
```

#### 3. API-Fehler
```bash
# Logs prüfen (Development)
npm run dev

# Logs prüfen (Production)
vercel logs
```

#### 4. Performance-Issues
```bash
# Bundle Analyzer
npm run analyze

# Performance Audit
npm run lighthouse
```

### Support Kanäle
- **GitHub Issues**: Bug Reports & Feature Requests
- **Diskussionen**: GitHub Discussions für Fragen
- **Email**: Bei kritischen Problemen

## 🔍 RAG Index erstellen
Das Skript `scripts/rag-index.ts` verarbeitet alle Dateien aus dem Ordner `docs/` (PDF & Markdown),
zerlegt sie in Chunks von etwa 500 Tokens, berechnet Embeddings mit dem Modell
`sentence-transformers/all-MiniLM-L6-v2` und speichert Vektoren samt Metadaten mittels **Chroma** unter `data/rag-index`.

```bash
# Dokumente indexieren
npm run rag:index
```

---

## 📄 Lizenz & Rechte

### Akademische Nutzung
Dieses Projekt wurde für wissenschaftliche Zwecke im Rahmen eines Forschungsprojekts an der **HAW Hamburg** entwickelt.

### Rechteinhaber
- **Institution**: Hochschule für Angewandte Wissenschaften Hamburg
- **Forscher**: Moritz Treu
- **Betreuer**: Prof. Dr. [Name]
- **Fakultät**: Technik und Informatik

### Nutzungsrechte
- ✅ **Akademische Forschung**: Frei nutzbar für Bildungszwecke
- ✅ **Open Source**: Code ist öffentlich einsehbar
- ❌ **Kommerzielle Nutzung**: Nicht ohne Genehmigung gestattet
- ❌ **Datenverwendung**: Studiendaten sind nicht öffentlich

---

## 🔗 Links & Ressourcen

### Live Demo
- **Production**: [https://mein-formularprojekt.vercel.app](https://mein-formularprojekt.vercel.app)
- **Staging**: [https://formulariq-staging.vercel.app](https://formulariq-staging.vercel.app)

### Dokumentation
- **API Docs**: [/api-documentation](https://mein-formularprojekt.vercel.app/api-documentation)
- **Component Library**: [/components](https://mein-formularprojekt.vercel.app/components)
- **Research Protocol**: [docs/research-protocol.md](docs/research-protocol.md)

### Externe Ressourcen
- **Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Tailwind CSS**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **shadcn/ui**: [https://ui.shadcn.com](https://ui.shadcn.com)
- **HAW Hamburg**: [https://www.haw-hamburg.de](https://www.haw-hamburg.de)

---

## 📊 Projektstatistiken

### Entwicklung
- **Entwicklungszeit**: ~6 Monate
- **Code Lines**: ~15,000 LOC
- **Komponenten**: 25+ React Components
- **API Endpoints**: 8 REST APIs

### Forschung
- **Ziel-Teilnehmer**: 100-200 Personen
- **Studiendauer**: ~20-25 Minuten pro Person
- **Datenfelder**: 50+ gemessene Variablen
- **Varianten**: 2 Hauptvarianten + 3 Fragebögen

---

## 🏆 Danksagungen

### Team
- **Hauptentwickler**: Moritz Treu
- **Wissenschaftliche Betreuung**: Prof. Dr. [Name], HAW Hamburg
- **UI/UX Consulting**: [Name], falls zutreffend
- **Beta-Tester**: Studierende und Fakultätsmitglieder der HAW

### Technologien
Besonderer Dank an die Open-Source-Community für:
- **Vercel** - Hosting & Deployment Platform
- **Next.js Team** - React Framework
- **Tailwind Labs** - CSS Framework  
- **shadcn** - UI Component Library
- **TypeScript Team** - Type Safety

---

## 📞 Kontakt

### Forscher
**Moritz Treu**  
Hochschule für Angewandte Wissenschaften Hamburg  
Fakultät Technik und Informatik  
📧 [moritz.treu@haw-hamburg.de](mailto:moritz.treu@haw-hamburg.de)

### Institution
**HAW Hamburg**  
Berliner Tor 7  
20099 Hamburg, Deutschland  
🌐 [www.haw-hamburg.de](https://www.haw-hamburg.de)

### Projektrepository
🔗 **GitHub**: [github.com/your-username/formulariq](https://github.com/your-username/formulariq)  
📖 **Dokumentation**: [formulariq.vercel.app/docs](https://formulariq.vercel.app/docs)

---

**Copyright © 2024 HAW Hamburg - FormularIQ Forschungsprojekt**

*Entwickelt für wissenschaftliche Zwecke im Bereich Human-Computer Interaction und KI-gestützte Benutzerschnittstellen.*