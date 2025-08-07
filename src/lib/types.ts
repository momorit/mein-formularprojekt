// src/lib/types.ts
// TypeScript Interfaces für FormularIQ Wissenschaftliche Studie

// === GENERAL TYPES ===
export interface SystemStatus {
  status: 'healthy' | 'unhealthy'
  services: {
    google_drive: 'connected' | 'disconnected'
    llm_ollama: 'online' | 'offline'
  }
  timestamp: string
}

export interface StudyMetadata {
  project: string
  institution: string
  researcher: string
  upload_timestamp: string
  backend_version: string
}

// === FORM DATA TYPES ===
export interface FormInstructions {
  [key: string]: string
}

export interface FormValues {
  [key: string]: string
}

export interface FormField {
  key: string
  label: string
  instruction: string
  value: string
  required?: boolean
  type?: 'text' | 'number' | 'email' | 'tel' | 'url'
  placeholder?: string
}

// === SAVE RESPONSE TYPES ===
export interface SaveResponse {
  message: string
  filename: string
  storage: 'google_drive' | 'local'
  google_drive_id?: string
  web_link?: string
  folder?: string
  path?: string
}

export interface SavedFormData {
  variant: 'A_sichtbares_formular'
  timestamp: string
  instructions: FormInstructions
  values: FormValues
  metadata: {
    total_fields: number
    filled_fields: number
    completion_rate: number
  }
  study_metadata?: StudyMetadata
}

// === CHAT TYPES ===
export interface ChatMessage {
  type: 'user' | 'bot'
  message: string
  timestamp: Date
}

export interface ChatRequest {
  message: string
  context?: string
}

export interface ChatResponse {
  response: string
}

// === DIALOG TYPES ===
export interface DialogQuestion {
  question: string
  field: string
}

export interface DialogStartRequest {
  context: string
}

export interface DialogStartResponse {
  questions: DialogQuestion[]
  totalQuestions: number
  currentQuestionIndex: number
}

export interface DialogMessageRequest {
  message: string
  currentQuestion: DialogQuestion
  questionIndex: number
  totalQuestions: number
}

export interface DialogMessageResponse {
  response: string
  nextQuestion: boolean
  questionIndex?: number
  helpProvided?: boolean
  dialogComplete?: boolean
}

export interface DialogSaveRequest {
  questions: DialogQuestion[]
  answers: Record<string, string>
  chatHistory: ChatMessage[]
  filename: string
}

export interface SavedDialogData {
  variant: 'B_dialog_system'
  timestamp: string
  questions: DialogQuestion[]
  answers: Record<string, string>
  chatHistory: ChatMessage[]
  metadata: {
    total_questions: number
    answered_questions: number
    completion_rate: number
    chat_interactions: number
  }
  study_metadata?: StudyMetadata
}

// === STUDY PROGRESS TYPES ===
export interface StudyProgress {
  currentStep: 'intro' | 'variant_a' | 'variant_b' | 'comparison' | 'complete'
  completedVariants: ('A' | 'B')[]
  startTime: Date
  variantATimes?: {
    start: Date
    end?: Date
    duration?: number
  }
  variantBTimes?: {
    start: Date
    end?: Date
    duration?: number
  }
}

export interface VariantComparison {
  speed: 'A' | 'B' | 'equal'
  understandability: 'A' | 'B' | 'equal'
  pleasantness: 'A' | 'B' | 'equal'
  helpfulness: 'A' | 'B' | 'equal'
  future_preference: 'A_strong' | 'A_slight' | 'neutral' | 'B_slight' | 'B_strong'
  comments?: string
}

// === ERROR TYPES ===
export interface APIError {
  message: string
  status?: number
  endpoint?: string
}

export interface FormValidationError {
  field: string
  message: string
}

// === COMPONENT PROPS TYPES ===
export interface ProgressBarProps {
  current: number
  total: number
  variant?: 'blue' | 'green' | 'purple'
  showLabel?: boolean
  className?: string
}

export interface ChatInterfaceProps {
  messages: ChatMessage[]
  onSendMessage: (message: string) => void
  loading?: boolean
  disabled?: boolean
  placeholder?: string
}

export interface FormFieldComponentProps {
  field: FormField
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
}

// === UTILITY TYPES ===
export type Variant = 'A' | 'B'

export type StorageType = 'google_drive' | 'local'

export type ChatMessageType = 'user' | 'bot'

export type StudyPhase = 
  | 'welcome'
  | 'consent' 
  | 'instructions'
  | 'variant_a'
  | 'break'
  | 'variant_b'
  | 'comparison'
  | 'completion'

// === CONSTANTS ===
export const STUDY_CONFIG = {
  PROJECT_NAME: 'FormularIQ - LLM-gestützte Formularbearbeitung',
  INSTITUTION: 'HAW Hamburg',
  RESEARCHER: 'Moritz Treu',
  VERSION: '1.0.0',
  MIN_FIELDS_REQUIRED: 5,
  MAX_CHAT_MESSAGES: 100,
  TIMEOUT_MINUTES: 30
} as const

export const VARIANT_LABELS = {
  A: 'Sichtbares Formular',
  B: 'Dialog-System'
} as const

export const STORAGE_LABELS = {
  google_drive: 'Google Drive (Cloud)',
  local: 'Lokal gespeichert'
} as const