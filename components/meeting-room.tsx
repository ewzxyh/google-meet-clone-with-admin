"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { getSupabaseBrowser } from "@/lib/supabase"
import { MicOff, VideoOff, MessageCircle, Phone, Volume2, VolumeX, Users, MoreVertical, Settings, Mic, Video } from "lucide-react"
import ChatPanel from "./chat-panel"
import VideoPlayer, { VideoPlayerRef } from "./video-player"
import IOSDebugInfo from "./ios-debug-info"

interface MeetingRoomProps {
  meetingId: string
  userName: string
  videoUrl: string
  initialPosition: number
}

export default function MeetingRoom({ meetingId, userName, videoUrl, initialPosition }: MeetingRoomProps) {
  const router = useRouter()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [isMarkingAsEnded, setIsMarkingAsEnded] = useState(false)
  const [showEndMeetingDialog, setShowEndMeetingDialog] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<VideoPlayerRef>(null)

  // Detectar se é iOS
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
  }, [])

  const markMeetingAsEnded = async () => {
    if (isMarkingAsEnded) {
      console.log("Already marking meeting as ended, skipping...")
      return
    }

    setIsMarkingAsEnded(true)
    
    const supabase = getSupabaseBrowser()
    if (!supabase) {
      console.error("Supabase client not available")
      setIsMarkingAsEnded(false)
      return
    }

    try {
      console.log(`Marking meeting ${meetingId} as ended...`)
      const { error } = await supabase
        .from("meetings")
        .update({ status: "ended" })
        .eq("meeting_id", meetingId)
      
      if (error) {
        throw error
      }
      
      console.log(`Meeting ${meetingId} successfully marked as ended in database`)
    } catch (error) {
      console.error("Error marking meeting as ended:", error)
    } finally {
      setIsMarkingAsEnded(false)
    }
  }

  const handleVideoEnd = useCallback(async () => {
    console.log("Video ended, ending meeting...")
    setIsEnded(true)
    
    // Marcar a reunião como finalizada no banco de dados
    await markMeetingAsEnded()
  }, [])

  const handleEndMeeting = async () => {
    console.log("User ending meeting...")
    
    // Marcar a reunião como finalizada no banco de dados antes de sair
    await markMeetingAsEnded()
    
    router.push("/")
  }

  const confirmEndMeeting = () => {
    setShowEndMeetingDialog(false)
    handleEndMeeting()
  }

  const handleReturnHome = () => {
    console.log("Returning to home page...")
    router.push("/")
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  // Marcar reunião como encerrada quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Só marcar como encerrada se não estiver já encerrada e não estiver no processo
      if (!isEnded && !isMarkingAsEnded) {
        console.log("Component unmounting, marking meeting as ended...")
        markMeetingAsEnded()
      }
    }
  }, [isEnded, isMarkingAsEnded])

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    if (videoPlayerRef.current) {
      videoPlayerRef.current.setVolume(clampedVolume)
    }
    setIsMuted(clampedVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (isMuted || volume === 0) {
      const newVolume = volume === 0 ? 0.5 : volume
      handleVolumeChange(newVolume)
    } else {
      handleVolumeChange(0)
    }
  }, [isMuted, volume, handleVolumeChange])

  if (isEnded) {
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

          <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={handleReturnHome}>
            Voltar para a página inicial
          </Button>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col bg-white">
        {/* Header */}
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

        {/* Main content */}
        <main className="flex-1 flex bg-white">
          <div className="flex w-full justify-center items-center">
            {/* Layout responsivo - vertical em mobile, horizontal em desktop */}
            <div className="flex flex-col lg:flex-row w-full max-w-7xl mx-auto">
              {/* Video principal da Amanda */}
              <div className="flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-white flex-1">
                <div className="w-full max-w-2xl">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                    <div className="aspect-[16/9] relative">
                      {/* Header do vídeo com nome e status */}
                      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                        <span className="text-white text-sm font-medium">Amanda mentora</span>
                        {/* Status "AO VIVO" no lado direito do vídeo */}
                        <div className="flex items-center space-x-1">
                          <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-white text-xs font-medium">AO VIVO</span>
                        </div>
                      </div>

                      {/* Video Player */}
                      <VideoPlayer
                        ref={videoPlayerRef}
                        videoUrl={videoUrl}
                        initialPosition={initialPosition}
                        onVideoEnd={handleVideoEnd}
                        volume={volume}
                        isEnded={isEnded}
                      />
                      
                      {/* Overlay para iOS para impedir pause */}
                      {isIOS && (
                        <div 
                          className="absolute inset-0 z-20 bg-transparent"
                          onTouchStart={(e) => e.preventDefault()}
                          onTouchEnd={(e) => e.preventDefault()}
                          onTouchMove={(e) => e.preventDefault()}
                          style={{ pointerEvents: 'auto' }}
                        />
                      )}
                    </div>

                    {/* Controls at bottom - apenas volume e outros controles */}
                    <div className="absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg"
                            onClick={toggleMute}
                          >
                            {isMuted || volume === 0 ? (
                              <VolumeX className="h-4 w-4 sm:h-6 sm:w-6" />
                            ) : (
                              <Volume2 className="h-4 w-4 sm:h-6 sm:w-6" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>{isMuted ? "Ativar som" : "Silenciar"}</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-gray-500 hover:bg-gray-600 text-white border-0 shadow-lg"
                            disabled
                          >
                            <MessageCircle className="h-4 w-4 sm:h-6 sm:w-6" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Chat indisponível</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white border-0 shadow-lg"
                            disabled
                          >
                            <Users className="h-4 w-4 sm:h-6 sm:w-6" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Participantes</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white border-0 shadow-lg"
                            disabled
                          >
                            <Settings className="h-4 w-4 sm:h-6 sm:w-6" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Configurações</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção lateral - Video do usuário */}
              <div className="w-full lg:w-[380px] bg-white p-4 sm:p-6 flex flex-col justify-center lg:ml-4">
                <div className="max-w-sm mx-auto w-full">
                  {/* Video do usuário */}
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-4">
                    <div className="aspect-[16/9] flex items-center justify-center relative">
                      {/* Ícone de usuário */}
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                          <Users className="h-8 w-8" />
                        </div>
                        <span className="text-sm">Você</span>
                      </div>
                      
                      {/* Indicador de vídeo desabilitado */}
                      <div className="absolute bottom-2 right-2">
                        <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                          <VideoOff className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    </div>

                    {/* Controles do usuário - movidos para aqui */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg"
                            disabled
                          >
                            <MicOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Microfone desativado</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-500 hover:bg-red-600 text-white border-0 shadow-lg"
                            disabled
                          >
                            <VideoOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Câmera desativada</p>
                        </TooltipContent>
                      </Tooltip>

                      {/* Botão de encerrar reunião com confirmação */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg"
                            onClick={() => setShowEndMeetingDialog(true)}
                          >
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 rotate-135" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Encerrar reunião</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Bottom badges - aligned left, responsive */}
                  <div className="flex flex-wrap items-start justify-start gap-2 sm:gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs px-2 sm:px-3 py-1 bg-white border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer flex items-center space-x-1">
                          <MicOff className="h-3 w-3 sm:h-4 sm:w-4" />
                          <span className="hidden sm:inline">Mic negado</span>
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
                          <span className="hidden sm:inline">Cam negada</span>
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
                          <span className="hidden sm:inline">Sem câmera</span>
                          <span className="sm:hidden">Sem câmera</span>
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="bg-gray-800 text-white text-xs px-2 py-1 rounded max-w-xs">
                        <p>Nenhuma câmera foi detectada no seu dispositivo.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  {/* Informação do usuário */}
                  <div className="mt-6 text-center">
                    <div className="text-sm text-gray-500">Participando como</div>
                    <div className="text-lg font-medium text-gray-900 mt-1">{userName}</div>
                  </div>
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

        {/* Debug info para iOS */}
        <IOSDebugInfo isVisible={false} />

        {/* Dialog de confirmação para encerrar reunião */}
        <Dialog open={showEndMeetingDialog} onOpenChange={setShowEndMeetingDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Encerrar Reunião</DialogTitle>
              <DialogDescription>
                Tem certeza de que deseja sair desta reunião? Esta ação encerrará a reunião para todos os participantes e não poderá ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowEndMeetingDialog(false)}
                className="mt-2 sm:mt-0"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={confirmEndMeeting}
                className="bg-red-600 hover:bg-red-700"
              >
                Sim, encerrar reunião
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
