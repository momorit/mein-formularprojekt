// src/app/study-analytics.ts - MINIMAL SAFE VERSION
import { useState, useEffect, useRef } from 'react'

export interface StudyTimer {
  startTime: Date | null
  endTime: Date | null
  duration: number
  events: StudyEvent[]
}

export interface StudyEvent {
  timestamp: Date
  type: string
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
  private variant: string
  private questionSet: string

  constructor(variant: string, questionSet: string) {
    this.variant = variant
    this.questionSet = questionSet
    this.timer = {
      startTime: null,
      endTime: null,
      duration: 0,
      events: []
    }
  }

  startTimer() {
    this.timer.startTime = new Date()
    this.addEvent('start', { variant: this.variant })
  }

  stopTimer() {
    if (!this.timer.startTime) return 0
    
    this.timer.endTime = new Date()
    this.timer.duration = this.timer.endTime.getTime() - this.timer.startTime.getTime()
    this.addEvent('completion', { duration: this.timer.duration })
    
    return this.timer.duration
  }

  addEvent(type: string, data?: any) {
    this.timer.events.push({
      timestamp: new Date(),
      type,
      data
    })
  }

  trackHelpRequest(fieldName?: string) {
    this.addEvent('help_request', { field: fieldName })
  }

  trackFieldFocus(fieldName: string) {
    this.addEvent('field_focus', { field: fieldName })
  }

  trackFieldComplete(fieldName: string, value: string) {
    this.addEvent('field_complete', { field: fieldName, value })
  }

  trackError(errorType: string, fieldName?: string) {
    this.addEvent('error', { errorType, field: fieldName })
  }

  getMetrics(fieldsData: any) {
    const helpRequests = this.timer.events.filter(e => e.type === 'help_request').length
    const errors = this.timer.events.filter(e => e.type === 'error').length
    const fieldsCompleted = Object.values(fieldsData).filter(v => v && String(v).trim()).length
    const totalFields = Object.keys(fieldsData).length
    
    let completionRate = 0
    if (totalFields > 0) {
      completionRate = Math.round((fieldsCompleted / totalFields) * 100)
    }

    const result: VariantMetrics = {
      timer: this.timer,
      fieldsCompleted,
      totalFields,
      helpRequests,
      errors,
      completionRate
    }

    return result
  }

  exportData() {
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

export function useStudyAnalytics(variant: string, questionSet: string) {
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
    if (analyticsRef.current) {
      analyticsRef.current.trackHelpRequest(fieldName)
    }
  }

  const trackFieldFocus = (fieldName: string) => {
    if (analyticsRef.current) {
      analyticsRef.current.trackFieldFocus(fieldName)
    }
  }

  const trackFieldComplete = (fieldName: string, value: string) => {
    if (analyticsRef.current) {
      analyticsRef.current.trackFieldComplete(fieldName, value)
    }
  }

  const trackError = (errorType: string, fieldName?: string) => {
    if (analyticsRef.current) {
      analyticsRef.current.trackError(errorType, fieldName)
    }
  }

  const finishAndGetMetrics = (fieldsData: any) => {
    if (!analyticsRef.current) {
      const emptyResult: VariantMetrics = {
        timer: { startTime: null, endTime: null, duration: 0, events: [] },
        fieldsCompleted: 0,
        totalFields: 0,
        helpRequests: 0,
        errors: 0,
        completionRate: 0
      }
      return emptyResult
    }

    analyticsRef.current.stopTimer()
    const finalMetrics = analyticsRef.current.getMetrics(fieldsData)
    setMetrics(finalMetrics)
    return finalMetrics
  }

  const exportData = () => {
    if (analyticsRef.current) {
      return analyticsRef.current.exportData()
    }
    return null
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

export function StudyTimerDisplay(props: { analytics: any; variant: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      if (props.analytics && props.analytics.analyticsRef && props.analytics.analyticsRef.current) {
        const current = props.analytics.analyticsRef.current
        if (current.timer && current.timer.startTime) {
          const now = new Date().getTime()
          const start = current.timer.startTime.getTime()
          setElapsed(now - start)
        }
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [props.analytics])

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    const paddedSeconds = String(remainingSeconds).padStart(2, '0')
    return minutes + ':' + paddedSeconds
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <div className="text-sm text-gray-600">Variante {props.variant}</div>
      <div className="text-lg font-mono font-bold text-gray-900">
        ⏱️ {formatTime(elapsed)}
      </div>
    </div>
  )
}