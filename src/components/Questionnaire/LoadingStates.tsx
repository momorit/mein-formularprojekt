'use client'

import React from 'react'
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

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className="w-4 h-4 text-gray-500" />
      <span className="text-sm text-gray-600">
        {formatTime(elapsed)}
      </span>
      {variant && (
        <span className="text-xs text-gray-500">
          (Variante {variant})
        </span>
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