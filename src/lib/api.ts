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
