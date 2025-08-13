'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Download, Send } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  participantId?: string
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
  errorId: string
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { 
      hasError: false,
      errorId: this.generateErrorId()
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorId: ErrorBoundary.prototype.generateErrorId()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    })

    // Log error für Debugging
    console.error('🚨 Study Error Boundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      participantId: this.props.participantId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    })

    // Sende Fehler an Backend (falls verfügbar)
    this.reportError(error, errorInfo)
  }

  generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      await fetch('/api/error/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: this.state.errorId,
          participantId: this.props.participantId,
          error: {
            message: error.message,
            stack: error.stack,
            name: error.name
          },
          errorInfo: {
            componentStack: errorInfo.componentStack
          },
          context: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            viewport: {
              width: window.innerWidth,
              height: window.innerHeight
            }
          }
        })
      })
    } catch (reportError) {
      console.warn('Failed to report error to backend:', reportError)
    }
  }

  handleRestart = () => {
    // Speichere Studiendaten im lokalen Storage als Backup
    const studyData = {
      participantId: this.props.participantId,
      error: this.state.error?.message,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      step: 'error_recovery'
    }

    try {
      localStorage.setItem('study_error_backup', JSON.stringify(studyData))
    } catch (e) {
      console.warn('Failed to save error backup:', e)
    }

    // Reload page
    window.location.reload()
  }

  handleDownloadErrorReport = () => {
    const errorReport = {
      errorId: this.state.errorId,
      participantId: this.props.participantId,
      timestamp: new Date().toISOString(),
      error: {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        name: this.state.error?.name
      },
      errorInfo: this.state.errorInfo,
      browser: {
        userAgent: navigator.userAgent,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      }
    }

    const dataStr = JSON.stringify(errorReport, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `error_report_${this.state.errorId}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  handleContactSupport = () => {
    const subject = encodeURIComponent(`StudyError ${this.state.errorId}`)
    const body = encodeURIComponent(`
Hallo,

bei der Teilnahme an der FormularIQ Studie ist ein Fehler aufgetreten.

Fehler-ID: ${this.state.errorId}
Teilnehmer-ID: ${this.props.participantId || 'Unbekannt'}
Zeitpunkt: ${new Date().toLocaleString('de-DE')}
Browser: ${navigator.userAgent}

Fehlermeldung: ${this.state.error?.message || 'Unbekannt'}

Bitte um Unterstützung bei der Fehlerbehebung.

Vielen Dank!
    `)

    window.open(`mailto:moritz.treu@haw-hamburg.de?subject=${subject}&body=${body}`)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-lg shadow-lg border border-red-200 p-8">
              {/* Error Icon */}
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Unerwarteter Fehler
                </h1>
                <p className="text-gray-600">
                  Bei der Studie ist ein technischer Fehler aufgetreten.
                </p>
              </div>

              {/* Error Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Fehler-ID:</strong><br />
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {this.state.errorId}
                    </code>
                  </div>
                  <div>
                    <strong>Teilnehmer-ID:</strong><br />
                    <code className="text-xs bg-gray-200 px-2 py-1 rounded">
                      {this.props.participantId || 'Unbekannt'}
                    </code>
                  </div>
                  <div>
                    <strong>Zeitpunkt:</strong><br />
                    {new Date().toLocaleString('de-DE')}
                  </div>
                  <div>
                    <strong>Browser:</strong><br />
                    {navigator.userAgent.split(' ').slice(-2).join(' ')}
                  </div>
                </div>
                
                {this.state.error && (
                  <div className="mt-4">
                    <strong>Fehlermeldung:</strong><br />
                    <code className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded block mt-1">
                      {this.state.error.message}
                    </code>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={this.handleRestart}
                  className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Studie neu starten
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={this.handleDownloadErrorReport}
                    className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Fehlerbericht
                  </button>

                  <button
                    onClick={this.handleContactSupport}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center justify-center"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Support kontaktieren
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                <strong>Was Sie tun können:</strong>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li><strong>Neu starten:</strong> Versuchen Sie die Studie erneut zu beginnen</li>
                  <li><strong>Fehlerbericht:</strong> Laden Sie den Bericht herunter und senden Sie ihn an den Studienleiter</li>
                  <li><strong>Support:</strong> Kontaktieren Sie direkt den Studienleiter</li>
                </ul>
              </div>

              {/* Apology */}
              <div className="mt-6 text-center text-sm text-gray-600">
                <p>
                  Entschuldigung für die Unannehmlichkeiten. Ihre bisherigen Daten wurden automatisch gesichert.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Error Report API Route
export const ErrorReportAPI = {
  async report(errorData: any) {
    try {
      const response = await fetch('/api/error/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData)
      })
      return response.ok
    } catch (error) {
      console.warn('Failed to report error:', error)
      return false
    }
  }
}