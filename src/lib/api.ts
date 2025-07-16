// src/lib/api.ts

export async function getInstructions(context: string) {
  const res = await fetch("http://localhost:8000/api/instructions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context })
  })
  if (!res.ok) throw new Error("Fehler bei der Verarbeitung")
  return await res.json()
}

export async function saveFormData(instructions: any, values: any) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `output_${timestamp}.json`
  const res = await fetch("http://localhost:8000/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ instructions, values, filename })
  })
  if (!res.ok) throw new Error("Fehler beim Speichern der JSON-Datei")
  return await res.json()
}

export async function sendChatMessage(message: string) {
  const res = await fetch("http://localhost:8000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  })
  if (!res.ok) throw new Error("Fehler bei der Chatverarbeitung")
  return await res.json()
}


// === NEUE FUNKTIONEN FÜR VARIANTE B (DIALOG) ===

export async function startDialog(formData: FormData) {
  const res = await fetch("http://localhost:8000/api/dialog/start", {
    method: "POST",
    body: formData
  })
  if (!res.ok) throw new Error("Fehler beim Starten des Dialogs")
  return await res.json()
}

export async function sendDialogMessage(data: {
  message: string
  currentQuestion: { feld: string; frage: string }
  questionIndex: number
  totalQuestions: number
}) {
  const res = await fetch("http://localhost:8000/api/dialog/message", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error("Fehler beim Senden der Dialog-Nachricht")
  return await res.json()
}

export async function saveDialogData(data: {
  questions: Array<{ feld: string; frage: string }>
  answers: Record<string, string>
  chatHistory: Array<{ role: string; content: string }>
}) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
  const filename = `dialog_output_${timestamp}.json`
  
  const res = await fetch("http://localhost:8000/api/dialog/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, filename })
  })
  if (!res.ok) throw new Error("Fehler beim Speichern der Dialog-Daten")
  return await res.json()
}