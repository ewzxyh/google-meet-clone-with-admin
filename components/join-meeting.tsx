"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { MicOff, VideoOff, Users } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase"
import PermissionNoticeModal from "@/components/permission-notice-modal"

interface JoinMeetingProps {
  meetingId: string
  videoUrl: string
}

export default function JoinMeeting({ meetingId, videoUrl }: JoinMeetingProps) {
  const [name, setName] = useState("")
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showNameError, setShowNameError] = useState(false)
  const router = useRouter()

  // Show the permission modal when component mounts
  useEffect(() => {
    setShowPermissionModal(true)
  }, [])

  // Function to capitalize first letter and validate input
  const handleNameChange = (value: string) => {
    // Remove extra spaces and limit to 60 characters
    let cleanValue = value.slice(0, 60)
    
    // Capitalize first letter if there's text
    if (cleanValue.length > 0) {
      cleanValue = cleanValue.charAt(0).toUpperCase() + cleanValue.slice(1)
    }
    
    setName(cleanValue)
    
    // Hide error when user starts typing and has valid name
    if (showNameError && cleanValue.trim().length >= 3) {
      setShowNameError(false)
    }
  }

  // Check if name is valid (at least 3 letters)
  const isNameValid = name.trim().length >= 3

  const handleJoinMeeting = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isNameValid) {
      setShowNameError(true)
      return
    }

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
    <TooltipProvider>
      <PermissionNoticeModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
      />

      <div className="flex min-h-screen flex-col bg-white">
        <header className="bg-white px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/videozapp.webp"
                alt="VideoZapp"
                width={180}
                height={50}
                className="h-10 sm:h-14 w-auto"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 flex bg-white">
          <div className="flex w-full justify-center items-center">
            {/* Layout responsivo - vertical em mobile, horizontal em desktop */}
            <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto">
              {/* Video preview */}
              <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white flex-1">
                <div className="w-full max-w-2xl">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                    <div className="aspect-[16/9] flex items-center justify-center">
                      <div className="text-center text-white text-sm sm:text-lg font-medium px-4">
                        Não há câmeras disponíveis
                      </div>
                    </div>

                    {/* Controls at bottom */}
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg relative"
                            disabled
                          >
                            <MicOff className="h-4 w-4 sm:h-6 sm:w-6" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Mostrar mais informações</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg relative"
                            disabled
                          >
                            <VideoOff className="h-4 w-4 sm:h-6 sm:w-6" />
                            <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-6 sm:h-6 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs font-bold">!</span>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Mostrar mais informações</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                  </div>

                  {/* Bottom badges - aligned left, responsive */}
                  <div className="mt-3 sm:mt-4 flex flex-wrap items-start justify-start gap-2 sm:gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1 bg-white border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-1">
                          <MicOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Permissão negada</span>
                          <span className="sm:hidden">Mic negado</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
                        <p>O microfone está bloqueado pelo colaborador.</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1 bg-white border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-1">
                          <VideoOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Permissão negada</span>
                          <span className="sm:hidden">Cam negada</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
                        <p>A câmera está bloqueada pelo colaborador.</p>
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1 bg-white border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-1">
                          <VideoOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">A câmera não foi encontrada</span>
                          <span className="sm:hidden">Sem câmera</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
                        <p>Nenhuma câmera foi detectada no seu dispositivo.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </div>

              {/* Join form - responsivo */}
              <div className="w-full lg:w-[380px] bg-white p-4 sm:p-6 flex flex-col justify-center lg:ml-4">
                <div className="max-w-sm mx-auto w-full text-center">
                  <h2 className="text-xl sm:text-2xl font-normal text-gray-900 mb-6 sm:mb-8 text-center">Qual é seu nome?</h2>

                  <form onSubmit={handleJoinMeeting} className="space-y-4 sm:space-y-6">
                    <div>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Seu nome"
                        className="w-full h-10 sm:h-12 text-sm sm:text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md text-center"
                        maxLength={60}
                        required
                      />
                      <div className="mt-2 flex justify-between items-center text-xs">
                        <span className="text-red-500">
                          {showNameError ? 'O nome deve ter pelo menos 3 letras' : ''}
                        </span>
                        <span className="text-gray-500">{name.length}/60</span>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-10 sm:h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full text-sm sm:text-base"
                    >
                      Pedir para participar
                    </Button>
                  </form>

                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white px-4 sm:px-8 py-4">
          <div className="text-center text-xs text-gray-500">
            <p className="leading-relaxed">
              Ao participar, você concorda com os{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Termos de Serviço
              </a>{" "}
              e a{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Política de Privacidade
              </a>
              . Serão enviadas informações do sistema para confirmar que você não é um bot.
            </p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  )
}