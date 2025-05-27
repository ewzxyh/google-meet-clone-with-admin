"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Send } from "lucide-react"

interface ChatPanelProps {
  onClose: () => void
}

export default function ChatPanel({ onClose }: ChatPanelProps) {
  const [message, setMessage] = useState("")
  const [showError, setShowError] = useState(false)

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      setShowError(true)
      setMessage("")
    }
  }

  return (
    <div className="flex w-80 flex-col border-l border-gray-700 bg-white text-black">
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <h2 className="text-lg font-medium">Mensagens na chamada</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="rounded-lg bg-gray-100 p-3">
          <div className="flex items-center">
            <div className="ml-2">
              <p className="text-sm font-medium">Permitir que os colaboradores enviem mensagens</p>
              <div className="mt-1 flex items-center">
                <div className="h-5 w-5 rounded-full bg-gray-300"></div>
                <div className="ml-2 h-2 w-12 rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>

        {showError && (
          <div className="mt-4 rounded-lg bg-gray-100 p-3">
            <p className="text-sm font-medium text-red-500">Colaborador não permite</p>
          </div>
        )}

        <div className="mt-4 rounded-lg bg-gray-100 p-3">
          <p className="text-sm text-gray-600">
            Você pode fixar uma mensagem para que ela fique visível para as pessoas que entrarem mais tarde. Quando você
            sair da chamada, não poderá mais acessar este chat.
          </p>
        </div>
      </div>

      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Enviar uma mensagem"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" variant="ghost" size="icon">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  )
}
