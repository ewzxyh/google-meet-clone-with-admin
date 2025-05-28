"use client"

import { useEffect } from "react"
import { Lock } from "lucide-react"

interface SecurityNoticeProps {
  onClose: () => void
}

export default function SecurityNotice({ onClose }: SecurityNoticeProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000) // 3 segundos

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="rounded-lg bg-teal-900 p-4 text-white shadow-lg animate-fade-in">
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
        </div>
      </div>
    </div>
  )
}
