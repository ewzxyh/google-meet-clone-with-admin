"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

interface MeetingEndedProps {
  meetingId: string
}

export default function MeetingEnded({ meetingId }: MeetingEndedProps) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-gray-900 text-white">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold">Reunião Encerrada</h1>
        <p className="text-gray-400">A reunião {meetingId} foi encerrada</p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <p className="max-w-md text-center text-gray-400">
          Esta reunião foi concluída e não pode ser reiniciada. Obrigado por participar.
        </p>

        <Link href="/" className="mt-4">
          <Button className="bg-blue-600 hover:bg-blue-700">Voltar para a página inicial</Button>
        </Link>
      </div>
    </div>
  )
}
