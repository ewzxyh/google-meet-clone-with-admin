"use client"

import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface SecurityNoticeProps {
  onClose: () => void
}

export default function SecurityNotice({ onClose }: SecurityNoticeProps) {
  return (
    <div className="rounded-lg bg-teal-900 p-4 text-white shadow-lg">
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          <Lock className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">O Meet garante sua segurança</h3>
          <p className="mt-1 text-sm">
            Se alguém denunciar abuso em uma chamada, um clipe curto apenas do vídeo poderá ser enviado ao VideoZapp para
            verificação.
          </p>
          <div className="mt-3 flex justify-end">
            <Button variant="ghost" size="sm" className="text-blue-300 hover:bg-teal-800 hover:text-blue-200">
              Saiba como denunciar abusos
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-2 bg-teal-800 text-blue-300 hover:bg-teal-700"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onClose()
              }}
            >
              Entendi
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
