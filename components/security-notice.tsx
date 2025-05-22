"use client"

import { Button } from "@/components/ui/button"

interface SecurityNoticeProps {
  onClose: () => void
}

export default function SecurityNotice({ onClose }: SecurityNoticeProps) {
  return (
    <div className="rounded-lg bg-teal-900 p-4 text-white shadow-lg">
      <div className="flex items-start">
        <div className="mr-3 mt-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="font-medium">O Meet garante sua segurança</h3>
          <p className="mt-1 text-sm">
            Se alguém denunciar abuso em uma chamada, um clipe curto apenas do vídeo poderá ser enviado ao Google para
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
