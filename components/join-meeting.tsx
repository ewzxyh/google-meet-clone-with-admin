"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { EllipsisVertical } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase"
import PermissionNoticeModal from "@/components/permission-notice-modal"

interface JoinMeetingProps {
  meetingId: string
  videoUrl: string
}

export default function JoinMeeting({ meetingId, videoUrl }: JoinMeetingProps) {
  const [name, setName] = useState("")
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const router = useRouter()

  // Show the permission modal when component mounts
  useEffect(() => {
    setShowPermissionModal(true)
  }, [])

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
    <TooltipProvider>
      <PermissionNoticeModal 
        isOpen={showPermissionModal} 
        onClose={() => setShowPermissionModal(false)} 
      />
      
      <div className="flex min-h-screen flex-col bg-white">
        <header className="bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Image
                src="/videozapp.webp"
                alt="VideoZapp"
                width={180}
                height={50}
                className="h-14 w-auto"
              />
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 font-medium">
                Fazer login
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex bg-white">
          <div className="flex w-full justify-center items-center">
            {/* Left side - Video preview */}
            <div className="flex items-center justify-center p-8 bg-white">
              <div className="w-full max-w-2xl">
                <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                  <div className="aspect-[16/9] flex items-center justify-center">
                    <div className="text-center text-white text-lg font-medium">
                      Não há câmeras disponíveis
                    </div>
                  </div>
                  
                  {/* Controls at bottom */}
                  <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg relative"
                          disabled
                        >
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                            <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
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
                          className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg relative"
                          disabled
                        >
                          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4h1v-11h-1z"/>
                            <path d="M2 2L22 22" stroke="currentColor" strokeWidth="2"/>
                          </svg>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        <p>Mostrar mais informações</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  
                  {/* Settings button */}
                  <div className="absolute top-4 right-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-14 w-14 text-white hover:bg-white/20"
                        >
                          <EllipsisVertical className="h-6 w-6" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64">
                        <DropdownMenuItem className="flex items-center space-x-3 py-3">
                          <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z"/>
                          </svg>
                          <span>Planos de fundo e efeitos</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center space-x-3 py-3">
                          <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 12h-2v-2h2v2zm0-4h-2V6h2v4z"/>
                          </svg>
                          <span>Informar um problema</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center space-x-3 py-3">
                          <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                          </svg>
                          <span>Ajuda e solução de problemas</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center space-x-3 py-3">
                          <svg className="h-6 w-6 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
                          </svg>
                          <span>Configurações</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  {/* Bottom right icon */}
                  <div className="absolute bottom-4 right-4">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-14 w-14 rounded-full bg-white/10 hover:bg-white/20 text-white"
                        >
                          <Image
                            src="/frame-person.svg"
                            alt="Participantes"
                            width={24}
                            height={24}
                            className="w-6 h-6"
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                        <p>Mostrar participantes</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                
                {/* Bottom badges - aligned left */}
                <div className="mt-4 flex items-start justify-start space-x-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs px-3 py-1 bg-white border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                        </svg>
                        <span>Permissão negada</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
                      <p>O microfone está bloqueado por esta página. Clique no ícone do microfone na barra de endereços para permitir o acesso.</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs px-3 py-1 bg-white border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4h1v-11h-1l-4 4z"/>
                        </svg>
                        <span>Permissão negada</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
                      <p>A câmera está bloqueada por esta página. Clique no ícone da câmera na barra de endereços para permitir o acesso.</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs px-3 py-1 bg-white border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-1">
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M21 6.5l-4 4V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4h1v-11h-1z"/>
                        </svg>
                        <span>A câmera não foi encontrada</span>
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
                      <p>Nenhuma câmera foi detectada no seu dispositivo.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Right side - Join form (no divider) */}
            <div className="w-[380px] bg-white p-6 flex flex-col justify-center ml-4">
              <div className="max-w-sm mx-auto w-full text-center">
                <h2 className="text-2xl font-normal text-gray-900 mb-8 text-center">Qual é seu nome?</h2>
                
                <form onSubmit={handleJoinMeeting} className="space-y-6">
                  <div>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full h-12 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md text-center"
                      maxLength={60}
                      required
                    />
                    <div className="mt-2 text-right text-xs text-gray-500">{name.length}/60</div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full text-base" 
                    disabled={!name.trim()}
                  >
                    Pedir para participar
                  </Button>
                </form>

                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-full text-base"
                  >
                    Outras formas de participar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-white px-8 py-4">
          <div className="text-center text-xs text-gray-500">
            <p>
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