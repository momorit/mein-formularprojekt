// src/app/study-analytics.ts - FIXED VERSION (TypeScript Error behoben)

import { useState, useEffect, useRef } from 'react'

export interface StudyTimer {
  startTime: Date | null
  endTime: Date | null
  duration: number
  events: StudyEvent[]
}

export interface StudyEvent {
  timestamp: Date
  type: 'start' | 'help_request' | 'field_focus' | 'field_complete' | 'error' | 'completion'  // ✅ 'start' hinzugefügt
  data?: any
}

export interface VariantMetrics {
  timer: StudyTimer
  fieldsCompleted: number
  totalFields: number
  helpRequests: number
  errors: number
  completionRate: number
}

export class StudyAnalytics {
  private timer: StudyTimer
  private variant: 'A' | 'B'
  private questionSet: 'SET-A' | 'SET-B'

  constructor(variant: 'A' | 'B', questionSet: 'SET-A' | 'SET-B') {
    this.variant = variant
    this.questionSet = questionSet
    this.timer = {
      startTime: null,
      endTime: null,
      duration: 0,
      events: []
    }
  }

  startTimer(): void {
    this.timer.startTime = new Date()
    this.addEvent('start', { variant: this.variant, questionSet: this.questionSet })  // ✅ Jetzt erlaubt
  }

  stopTimer(): number {
    if (!this.timer.startTime) return 0
    
    this.timer.endTime = new Date()
    this.timer.duration = this.timer.endTime.getTime() - this.timer.startTime.getTime()
    this.addEvent('completion', { duration: this.timer.duration })
    
    return this.timer.duration
  }

  addEvent(type: StudyEvent['type'], data?: any): void {
    this.timer.events.push({
      timestamp: new Date(),
      type,
      data
    })
  }

  trackHelpRequest(fieldName?: string): void {
    this.addEvent('help_request', { field: fieldName })
  }

  trackFieldFocus(fieldName: string): void {
    this.addEvent('field_focus', { field: fieldName })
  }

  trackFieldComplete(fieldName: string, value: string): void {
    this.addEvent('field_complete', { field: fieldName, value })
  }

  trackError(errorType: string, fieldName?: string): void {
    this.addEvent('error', { errorType, field: fieldName })
  }

  getMetrics(fieldsData: any): VariantMetrics {
    const helpRequests = this.timer.events.filter(e => e.type === 'help_request').length
    const errors = this.timer.events.filter(e => e.type === 'error').length
    const fieldsCompleted = Object.values(fieldsData).filter(v => v && String(v).trim()).length
    const totalFields = Object.keys(fieldsData).length

    return {
      timer: this.timer,
      fieldsCompleted,
      totalFields,
      helpRequests,
      errors,
      completionRate: totalFields > 0 ? (fieldsCompleted / totalFields) * 100 : 0
    }
  }

  exportData(): any {
    return {
      variant: this.variant,
      questionSet: this.questionSet,
      timer: this.timer,
      events: this.timer.events,
      summary: {
        duration: this.timer.duration,
        helpRequests: this.timer.events.filter(e => e.type === 'help_request').length,
        errors: this.timer.events.filter(e => e.type === 'error').length,
        totalEvents: this.timer.events.length
      }
    }
  }
}

// React Hook für Study Analytics
export function useStudyAnalytics(variant: 'A' | 'B', questionSet: 'SET-A' | 'SET-B') {
  const analyticsRef = useRef<StudyAnalytics | null>(null)
  const [metrics, setMetrics] = useState<VariantMetrics | null>(null)

  useEffect(() => {
    analyticsRef.current = new StudyAnalytics(variant, questionSet)
    analyticsRef.current.startTimer()

    return () => {
      if (analyticsRef.current) {
        analyticsRef.current.stopTimer()
      }
    }
  }, [variant, questionSet])

  const trackHelpRequest = (fieldName?: string) => {
    analyticsRef.current?.trackHelpRequest(fieldName)
  }

  const trackFieldFocus = (fieldName: string) => {
    analyticsRef.current?.trackFieldFocus(fieldName)
  }

  const trackFieldComplete = (fieldName: string, value: string) => {
    analyticsRef.current?.trackFieldComplete(fieldName, value)
  }

  const trackError = (errorType: string, fieldName?: string) => {
    analyticsRef.current?.trackError(errorType, fieldName)
  }

  const finishAndGetMetrics = (fieldsData: any): VariantMetrics => {
    if (!analyticsRef.current) {
      throw new Error('Analytics not initialized')
    }

    analyticsRef.current.stopTimer()
    const finalMetrics = analyticsRef.current.getMetrics(fieldsData)
    setMetrics(finalMetrics)
    return finalMetrics
  }

  const exportData = () => {
    return analyticsRef.current?.exportData()
  }

  return {
    trackHelpRequest,
    trackFieldFocus,
    trackFieldComplete,
    trackError,
    finishAndGetMetrics,
    exportData,
    metrics
  }
}

// Question Sets Definition
export const QUESTION_SETS = {
  'SET-A': {
    easy: [
      {
        id: 'wohnungsbezeichnung',
        label: 'WOHNUNGSBEZEICHNUNG',
        question: 'Wie lautet die Bezeichnung der zu sanierenden Wohnung?',
        type: 'text',
        help: 'Z.B. "Hochparterre rechts", "1. OG links", "Erdgeschoss Mitte"',
        difficulty: 'easy'
      },
      {
        id: 'himmelsrichtung',
        label: 'HIMMELSRICHTUNG',
        question: 'In welche Himmelsrichtung zeigt die Hauptfassade?',
        type: 'select',
        options: ['Nord', 'Nordost', 'Ost', 'Südost', 'Süd', 'Südwest', 'West', 'Nordwest'],
        difficulty: 'easy'
      }
    ],
    medium: [
      {
        id: 'energietraeger',
        label: 'ENERGIETRÄGER',
        question: 'Welcher Energieträger wird aktuell für die Heizung verwendet?',
        type: 'select',
        options: ['Gas', 'Öl', 'Fernwärme', 'Strom', 'Wärmepumpe', 'Holz/Pellets', 'Solar'],
        difficulty: 'medium',
        help: 'Der hauptsächlich genutzte Energieträger für Raumheizung und Warmwasser.'
      },
      {
        id: 'fensterart',
        label: 'FENSTERART',
        question: 'Welche Art von Fenstern ist überwiegend verbaut?',
        type: 'select',
        options: [
          'Einfachverglasung',
          'Doppelverglasung (älter)',
          'Wärmeschutzverglasung 2-fach',
          'Wärmeschutzverglasung 3-fach',
          'Gemischt (verschiedene Typen)'
        ],
        difficulty: 'medium'
      }
    ],
    hard: [
      {
        id: 'daemmsystem',
        label: 'DÄMMUNGSYSTEM',
        question: 'Welches Fassadendämmungssystem kommt zum Einsatz?',
        type: 'select',
        options: [
          'WDVS mit Putz',
          'WDVS mit Riemchen/Klinker', 
          'Hinterlüftete Vorhangfassade',
          'Innendämmung',
          'Kombination verschiedener Systeme'
        ],
        help: 'WDVS = Wärmedämmverbundsystem. Bei Unsicherheit wählen Sie die Kombination.',
        difficulty: 'hard',
        hasUncertainty: true
      },
      {
        id: 'luftdichtheit',
        label: 'LUFTDICHTHEIT',
        question: 'Wie würden Sie die Luftdichtheit des Gebäudes einschätzen?',
        type: 'select',
        options: [
          'Sehr gut (Blower-Door-Test n50 < 1,5)',
          'Gut (wenig spürbare Zugluft)',
          'Mittel (gelegentlich spürbare Zugluft)',
          'Schlecht (deutlich spürbare Zugluft)',
          'Sehr schlecht (starke Zugluft)'
        ],
        difficulty: 'hard',
        help: 'Luftdichtheit beeinflusst den Energieverlust erheblich. Bei Unsicherheit: "Mittel" wählen.'
      }
    ]
  },
  'SET-B': {
    easy: [
      {
        id: 'gebaeudeart',
        label: 'GEBÄUDEART',
        question: 'Um welche Art von Gebäude handelt es sich?',
        type: 'select',
        options: [
          'Einfamilienhaus freistehend',
          'Einfamilienhaus Doppelhaushälfte',
          'Reihenhaus',
          'Mehrfamilienhaus',
          'Wohn- und Geschäftshaus'
        ],
        difficulty: 'easy'
      },
      {
        id: 'baujahr',
        label: 'BAUJAHR',
        question: 'Aus welchem Jahr stammt das Gebäude?',
        type: 'number',
        help: 'Das ursprüngliche Baujahr (vor größeren Sanierungen)',
        difficulty: 'easy'
      }
    ],
    medium: [
      {
        id: 'wohnflaeche',
        label: 'WOHNFLÄCHE',
        question: 'Wie groß ist die Gesamtwohnfläche des Gebäudes?',
        type: 'number',
        unit: 'm²',
        difficulty: 'medium',
        help: 'Gesamte beheizte Wohnfläche aller Etagen.'
      },
      {
        id: 'heizungsart',
        label: 'HEIZUNGSART',
        question: 'Welche Heizungsart ist aktuell installiert?',
        type: 'select',
        options: [
          'Gas-Brennwertkessel',
          'Gas-Niedertemperaturkessel',
          'Öl-Brennwertkessel',
          'Öl-Niedertemperaturkessel',
          'Fernwärme',
          'Wärmepumpe (Luft)',
          'Wärmepumpe (Erdreich)',
          'Nachtspeicherheizung',
          'Kaminofen/Einzelöfen'
        ],
        difficulty: 'medium'
      }
    ],
    hard: [
      {
        id: 'daemmzustand',
        label: 'DÄMMZUSTAND',
        question: 'Wie ist der aktuelle Dämmzustand des Gebäudes?',
        type: 'select',
        options: [
          'Keine Dämmung vorhanden',
          'Teilweise gedämmt (nur Dach oder Fassade)',
          'Grunddämmung vorhanden (5-10 cm)',
          'Gute Dämmung (10-20 cm)',
          'Sehr gute Dämmung (>20 cm)'
        ],
        difficulty: 'hard',
        help: 'Bezieht sich auf Außenwände, Dach und Kellerdecke zusammen.'
      }
    ]
  }
}

// Timer Display Component
export function StudyTimerDisplay({ analytics, variant }: { analytics: any, variant: 'A' | 'B' }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (analytics?.analyticsRef?.current?.timer?.startTime) {
        const now = new Date().getTime()
        const start = analytics.analyticsRef.current.timer.startTime.getTime()
        setElapsed(now - start)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [analytics])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-sm text-gray-600">Variante {variant}</div>
      <div className="text-lg font-mono font-bold text-gray-900">
        ⏱️ {formatTime(elapsed)}
      </div>
    </div>
  )
}