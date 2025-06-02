"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface MeetingEndedProps {
  meetingId: string
}

export default function MeetingEnded({ meetingId }: MeetingEndedProps) {
  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Header com logo */}
      <header className="bg-white px-4 sm:px-6 py-3">
        <div className="flex items-center">
          <Image
            src="/videozapp.webp"
            alt="VideoZapp"
            width={180}
            height={50}
            className="h-10 sm:h-14 w-auto"
          />
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">Reunião Encerrada</h1>
          <p className="text-gray-600">A reunião {meetingId} foi encerrada</p>
        </div>

        <div className="flex flex-col items-center space-y-4">
          <p className="max-w-md text-center text-gray-600">
            Esta reunião foi concluída e não pode ser reiniciada. Obrigado por participar.
          </p>

          <Link href="/" className="mt-4">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Voltar para a página inicial
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
