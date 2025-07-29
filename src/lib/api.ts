// src/lib/api.ts - KOMPLETTE DATEI - ALLES ERSETZEN

const API_BASE_URL = 'http://localhost:8000'

export async function getInstructions(context: string = '') {
  const response = await fetch(`${API_BASE_URL}/api/instructions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context }),
  })

  if (!response.ok) {
    throw new Error('Fehler beim Abrufen der Anweisungen')
  }

  return response.json()
}

export async function sendChatMessage(message: string) {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  })

  if (!response.ok) {
    throw new Error('Fehler beim Senden der Chat-Nachricht')
  }

  return response.json()
}

export async function saveFormData(instructions: any, values: any) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `output_${timestamp}.json`

  const response = await fetch(`${API_BASE_URL}/api/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      instructions,
      values,
      filename
    }),
  })

  if (!response.ok) {
    throw new Error('Fehler beim Speichern der Formulardaten')
  }

  return response.json()
}

export async function startDialog(formData: FormData) {
  const response = await fetch(`${API_BASE_URL}/api/dialog/start`, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error('Fehler beim Starten des Dialogs')
  }

  return response.json()
}

export async function sendDialogMessage(data: {
  message: string
  currentQuestion: { feld: string; frage: string }
  questionIndex: number
  totalQuestions: number
}) {
  const response = await fetch(`${API_BASE_URL}/api/dialog/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    throw new Error('Fehler beim Senden der Dialog-Nachricht')
  }

  return response.json()
}

export async function saveDialogData(data: {
  questions: Array<{feld: string, frage: string}>
  answers: Record<string, string>
  chatHistory: Array<{role: string, content: string}>
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `dialog_output_${timestamp}.json`

  const response = await fetch(`${API_BASE_URL}/api/dialog/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      questions: data.questions,
      answers: data.answers,
      chatHistory: data.chatHistory,
      filename
    }),
  })

  if (!response.ok) {
    throw new Error('Fehler beim Speichern der Dialog-Daten')
  }

  return response.json()
}

export async function saveQuestionsOnly(data: {
  questions: Array<{feld: string, frage: string}>
  context: string
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `questions_${timestamp}.json`

  const response = await fetch(`${API_BASE_URL}/api/dialog/save-questions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      questions: data.questions,
      context: data.context,
      filename
    }),
  })

  if (!response.ok) {
    throw new Error('Fehler beim Speichern der Fragen')
  }

  return response.json()
}

// NEUE FUNKTIONEN FÜR ANTWORT-EXTRAKTION

export async function extractAnswers(data: {
  questions: Array<{feld: string, frage: string}>
  raw_answers: Record<string, string>
}) {
  const response = await fetch(`${API_BASE_URL}/api/dialog/extract-answers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      questions: data.questions,
      raw_answers: data.raw_answers
    }),
  })

  if (!response.ok) {
    throw new Error('Fehler bei der Antwort-Extraktion')
  }

  return response.json()
}

export async function saveCompleteDialogData(data: {
  questions: Array<{feld: string, frage: string}>
  answers: Record<string, string>
  chatHistory: Array<{role: string, content: string}>
  filename: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/dialog/save-complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      questions: data.questions,
      answers: data.answers,
      chatHistory: data.chatHistory,
      filename: data.filename
    }),
  })

  if (!response.ok) {
    throw new Error('Fehler beim Speichern der kompletten Dialog-Daten')
  }

  return response.json()
}

// PERFORMANCE STATS

export async function getPerformanceStats() {
  const response = await fetch(`${API_BASE_URL}/api/stats`, {
    method: 'GET',
  })

  if (!response.ok) {
    throw new Error('Fehler beim Abrufen der Performance-Statistiken')
  }

  return response.json()
}