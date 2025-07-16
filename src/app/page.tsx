"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { getInstructions, saveFormData, sendChatMessage } from "@/lib/api"

export default function Home() {
  const [context, setContext] = useState("")
  const [instructions, setInstructions] = useState<any>(null)
  const [values, setValues] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [chat, setChat] = useState<{ sender: string; text: string }[]>([])
  const [chatInput, setChatInput] = useState("")

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await getInstructions(context)
      setInstructions(result)
    } catch (e) {
      alert("Fehler bei der Verarbeitung")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      await saveFormData(instructions, values)
      alert("Daten wurden gespeichert.")
    } catch {
      alert("Speichern fehlgeschlagen")
    }
  }

  const handleChatSend = async () => {
    if (!chatInput.trim()) return
    const newChat = [...chat, { sender: "user", text: chatInput }]
    setChat(newChat)
    setChatInput("")
    const res = await sendChatMessage(chatInput)
    setChat([...newChat, { sender: "bot", text: res.response }])
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-100 text-gray-900 font-sans">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-center mb-10">
          Formular-Assistent
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formularseite */}
          <div className="lg:col-span-2 space-y-6">
            <Textarea
              placeholder="Zusatzinformationen (optional)..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleGenerate} disabled={loading}>
                {loading ? "Wird geladen..." : "Anweisungen generieren"}
              </Button>
              {instructions && (
                <Button onClick={handleSave} variant="secondary">
                  Als JSON speichern
                </Button>
              )}
            </div>

            {instructions && (
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(instructions).map(([key, obj]) => (
                  <div
                    key={key}
                    className="bg-white p-6 rounded-xl shadow-md border border-slate-200 hover:shadow-lg transition"
                  >
                    <label className="font-bold text-slate-800 text-sm mb-1 block">
                      {key.toUpperCase()}
                    </label>
                    <p className="text-sm text-slate-600 mb-2 leading-snug">
                      {obj.instruction}
                    </p>
                    <input
                      type="text"
                      className="border border-slate-300 rounded px-3 py-2 w-full"
                      value={values[key] || ""}
                      onChange={(e) =>
                        setValues({ ...values, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chatbereich */}
          <div className="bg-white p-6 rounded-xl shadow-md h-fit sticky top-10 flex flex-col max-h-[80vh] border border-slate-200">
            <h2 className="font-semibold text-lg mb-3 text-slate-800">
              Chat mit dem Assistenten
            </h2>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 pr-1 custom-scrollbar">
              {chat.map((msg, i) => (
                <div
                  key={i}
                  className={`text-sm whitespace-pre-wrap ${
                    msg.sender === "user" ? "text-right" : "text-left text-gray-700"
                  }`}
                >
                  <span
                    className={`block px-3 py-2 rounded-xl inline-block ${
                      msg.sender === "user"
                        ? "bg-blue-100 text-blue-900"
                        : "bg-slate-100"
                    }`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-slate-300 rounded px-3 py-2"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Frage stellen..."
              />
              <Button onClick={handleChatSend}>Senden</Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
