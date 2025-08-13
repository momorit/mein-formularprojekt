'use client'

import { Loader2, Clock, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react'

// === LOADING SPINNER ===
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'gray'
  text?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  text,
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  const colorClasses = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    gray: 'text-gray-500'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
      {text && (
        <span className={`ml-2 text-sm ${colorClasses[color]}`}>
          {text}
        </span>
      )}
    </div>
  )
}

// === PROGRESS BAR ===
interface ProgressBarProps {
  current: number
  total: number
  variant?: 'blue' | 'green' | 'purple'
  showLabel?: boolean
  showPercentage?: boolean
  className?: string
  animated?: boolean
}

export function ProgressBar({ 
  current, 
  total, 
  variant = 'blue',
  showLabel = false,
  showPercentage = true,
  className = '',
  animated = true
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0
  
  const variants = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className={className}>
      {(showLabel || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {showLabel && (
            <span className="text-sm font-medium text-gray-700">
              {current} von {total}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm text-gray-600">
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${variants[variant]} ${animated ? 'transition-all duration-300 ease-out' : ''}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  )
}

// === STUDY TIMER ===
interface StudyTimerProps {
  startTime: Date
  variant?: 'A' | 'B'
  className?: string
  showMilliseconds?: boolean
}

export function StudyTimer({ startTime, variant, className = '', showMilliseconds = false }: StudyTimerProps) {
  const [elapsed, setElapsed] = React.useState(0)

  React.useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime.getTime())
    }, showMilliseconds ? 100 : 1000)

    return () => clearInterval(interval)
  }, [startTime, showMilliseconds])

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    const milliseconds = Math.floor((ms % 1000) / 100)
    
    if (showMilliseconds) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds}`
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className={`inline-flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg ${className}`}>
      <Clock className="w-4 h-4 text-gray-600" />
      <span className="font-mono text-sm text-gray-800">
        {formatTime(elapsed)}
      </span>
      {variant && (
        <span className="text-xs text-gray-600 bg-gray-200 px-2 py-1 rounded">
          Variante {variant}
        </span>
      )}
    </div>
  )
}

// === CONNECTION STATUS ===
interface ConnectionStatusProps {
  isOnline?: boolean
  className?: string
}

export function ConnectionStatus({ isOnline, className = '' }: ConnectionStatusProps) {
  const [online, setOnline] = React.useState(isOnline ?? navigator.onLine)

  React.useEffect(() => {
    if (isOnline === undefined) {
      const handleOnline = () => setOnline(true)
      const handleOffline = () => setOnline(false)

      window.addEventListener('online', handleOnline)
      window.addEventListener('offline', handleOffline)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
      }
    } else {
      setOnline(isOnline)
    }
  }, [isOnline])

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-sm ${
      online 
        ? 'bg-green-50 text-green-700' 
        : 'bg-red-50 text-red-700'
    } ${className}`}>
      {online ? (
        <>
          <Wifi className="w-4 h-4" />
          <span>Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Offline</span>
        </>
      )}
    </div>
  )
}

// === BACKEND STATUS ===
interface BackendStatusProps {
  status: 'checking' | 'healthy' | 'error'
  url?: string
  className?: string
}

export function BackendStatus({ status, url, className = '' }: BackendStatusProps) {
  const statusConfig = {
    checking: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      text: 'Verbindung wird geprüft...',
      style: 'bg-blue-50 text-blue-700'
    },
    healthy: {
      icon: <CheckCircle className="w-4 h-4" />,
      text: 'Backend verbunden',
      style: 'bg-green-50 text-green-700'
    },
    error: {
      icon: <AlertCircle className="w-4 h-4" />,
      text: 'Backend nicht verfügbar',
      style: 'bg-red-50 text-red-700'
    }
  }

  const config = statusConfig[status]

  return (
    <div className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${config.style} ${className}`}>
      {config.icon}
      <span>{config.text}</span>
      {url && status === 'error' && (
        <button
          onClick={() => window.open(url + '/health', '_blank')}
          className="text-xs underline ml-2"
        >
          Testen
        </button>
      )}
    </div>
  )
}

// === LOADING OVERLAY ===
interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  children: React.ReactNode
  className?: string
}

export function LoadingOverlay({ isLoading, text, children, className = '' }: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg border p-6 flex flex-col items-center">
            <LoadingSpinner size="lg" />
            {text && (
              <p className="mt-3 text-gray-700 text-center">
                {text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// === PAGE LOADING ===
interface PageLoadingProps {
  title?: string
  subtitle?: string
  progress?: number
  className?: string
}

export function PageLoading({ 
  title = 'Wird geladen...', 
  subtitle,
  progress,
  className = '' 
}: PageLoadingProps) {
  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 ${className}`}>
      <div className="text-center max-w-md w-full">
        <LoadingSpinner size="lg" color="blue" />
        <h2 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-gray-600 mb-4">
            {subtitle}
          </p>
        )}
        {progress !== undefined && (
          <div className="mt-4">
            <ProgressBar 
              current={progress} 
              total={100} 
              variant="blue"
              showPercentage
            />
          </div>
        )}
      </div>
    </div>
  )
}

// === STEP INDICATOR ===
interface StepIndicatorProps {
  steps: Array<{ id: string; title: string; completed: boolean; current?: boolean }>
  className?: string
}

export function StepIndicator({ steps, className = '' }: StepIndicatorProps) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step.completed 
                ? 'bg-green-500 text-white'
                : step.current
                ? 'bg-blue-500 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </div>
            <span className={`text-xs mt-1 text-center max-w-20 ${
              step.current ? 'text-blue-600 font-medium' : 'text-gray-600'
            }`}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${
              steps[index + 1].completed || steps[index + 1].current
                ? 'bg-blue-300'
                : 'bg-gray-300'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// Export React import for timer component
import React from 'react'