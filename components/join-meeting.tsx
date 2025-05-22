"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getSupabaseBrowser } from "@/lib/supabase"

interface JoinMeetingProps {
  meetingId: string
  videoUrl: string
}

export default function JoinMeeting({ meetingId, videoUrl }: JoinMeetingProps) {
  const [name, setName] = useState("")
  const router = useRouter()

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    const supabase = getSupabaseBrowser()

    // Add participant to the database if Supabase is available
    if (supabase) {
      try {
        await supabase.from("participants").upsert(
          {
            meeting_id: meetingId,
            name: name.trim(),
            last_video_position: 0,
          },
          {
            onConflict: "meeting_id,name",
          },
        )
      } catch (error) {
        console.error("Error adding participant:", error)
      }
    }

    // Redirect to the meeting room regardless of database operation
    router.push(`/${meetingId}/room?name=${encodeURIComponent(name)}&videoUrl=${encodeURIComponent(videoUrl)}`)
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center">
          <div className="flex items-center">
            <Image
              src="/placeholder.svg?height=32&width=32"
              alt="Google Meet"
              width={32}
              height={32}
              className="mr-2"
            />
            <h1 className="text-xl font-normal text-gray-800">
              <span className="text-blue-500">G</span>
              <span className="text-red-500">o</span>
              <span className="text-yellow-500">o</span>
              <span className="text-blue-500">g</span>
              <span className="text-green-500">l</span>
              <span className="text-red-500">e</span>
              <span className="ml-2 text-gray-700">Meet</span>
            </h1>
          </div>
          <div className="ml-auto">
            <Button variant="ghost" className="text-blue-600">
              Fazer login
            </Button>
          </div>
        </div>
      </header>

      <main className="flex flex-1">
        <div className="flex w-full flex-col md:flex-row">
          <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
            <div className="w-full max-w-md rounded-lg bg-black p-4">
              <div className="flex h-64 items-center justify-center rounded-lg bg-gray-900 md:h-96">
                <div className="text-center text-white">Não há câmeras disponíveis</div>
              </div>
              <div className="mt-4 flex justify-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-red-500 text-white hover:bg-red-600"
                  disabled
                >
                  <span className="sr-only">Microfone</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-full bg-red-500 text-white hover:bg-red-600"
                  disabled
                >
                  <span className="sr-only">Câmera</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-6 w-6"
                  >
                    <path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-8">
            <div className="w-full max-w-md">
              <h2 className="mb-6 text-2xl font-normal text-gray-900">Qual é seu nome?</h2>
              <form onSubmit={handleJoinMeeting} className="space-y-6">
                <div>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full"
                    maxLength={60}
                    required
                  />
                  <div className="mt-1 text-right text-xs text-gray-500">{name.length}/60</div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={!name.trim()}>
                  Pedir para participar
                </Button>
              </form>

              <div className="mt-8">
                <Button variant="outline" className="w-full">
                  Outras formas de participar
                </Button>
              </div>

              <div className="mt-8 text-center text-xs text-gray-500">
                <p>
                  Ao participar, você concorda com os{" "}
                  <a href="#" className="text-blue-600">
                    Termos de Serviço
                  </a>{" "}
                  e a{" "}
                  <a href="#" className="text-blue-600">
                    Política de Privacidade
                  </a>
                </p>
                <p className="mt-2">Serão enviadas informações do sistema para confirmar que você não é um bot.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
