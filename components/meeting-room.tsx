"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { getSupabaseBrowser } from "@/lib/supabase"
import { MicOff, VideoOff, MessageCircle, Phone, Volume2, VolumeX, Users, User, MoreVertical, Settings, Mic, Video } from "lucide-react"
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
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [isMarkingAsEnded, setIsMarkingAsEnded] = useState(false)
  const [showEndMeetingDialog, setShowEndMeetingDialog] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showVolumeWarning, setShowVolumeWarning] = useState(false)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<VideoPlayerRef>(null)

  // Detectar se é iOS e ajustar estado inicial do volume
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);
    if (isIOSDevice) {
      setIsMuted(true); // Ícone mutado para iOS
      setVolume(0); // Volume 0 para iOS
      setShowVolumeWarning(true); // Mostrar aviso para ativar som
      const timer = setTimeout(() => {
        setShowVolumeWarning(false);
      }, 5000); // Esconder aviso após 5 segundos
      return () => clearTimeout(timer);
    } else {
      setIsMuted(false); // Não mutado para outros dispositivos
      setVolume(1); // Volume 1 para outros dispositivos
    }
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
      // Limpar timeout do volume slider
      if (volumeTimeoutRef.current) {
        clearTimeout(volumeTimeoutRef.current)
      }
      
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

  // Efeito para encerrar a reunião automaticamente após um tempo específico
  useEffect(() => {
    const autoEndDurationMs = (10 * 60 + 52) * 1000 // 10 minutos e 52 segundos em milissegundos
    
    console.log(`Reunião programada para encerrar automaticamente em ${autoEndDurationMs / 1000} segundos.`) 

    const autoEndTimer = setTimeout(() => {
      console.log("Tempo limite da reunião atingido, encerrando automaticamente...")
      handleVideoEnd() // Chama a função que marca a reunião como encerrada e redireciona
    }, autoEndDurationMs)

    // Limpar o timer se o componente for desmontado antes do tempo
    return () => {
      console.log("Limpando timer de encerramento automático da reunião.")
      clearTimeout(autoEndTimer)
    }
  }, [handleVideoEnd]) // Dependência em handleVideoEnd para garantir que a função mais recente seja usada

  if (isEnded) {
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

            <Button className="mt-4 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleReturnHome}>
              Voltar para a página inicial
            </Button>
          </div>
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
            <div className="flex flex-col lg:flex-row w-full max-w-6xl mx-auto">
              {/* Video principal da Amanda */}
              <div className="flex items-center justify-center p-4 sm:p-2 bg-white flex-1">
                <div className="w-full max-w-3xl">
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg">
                    <div className="aspect-[16/9] relative">
                      {/* Header do vídeo com nome */}
                      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Image
                            src="/amanda_icon.webp"
                            alt="Amanda"
                            width={32}
                            height={32}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <span className="text-white text-sm font-medium">@Mentora_Amanda</span>
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
                    </div>

                    {/* Controls at bottom - apenas volume e outros controles */}
                    <div className="meeting-controls absolute bottom-4 sm:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2 sm:space-x-4 z-30">
                      {/* Controle de Volume com Slider - Escondido no iOS */}
                      {!isIOS && (
                        <div 
                          className="relative"
                          onMouseEnter={() => {
                            if (volumeTimeoutRef.current) {
                              clearTimeout(volumeTimeoutRef.current)
                            }
                            setShowVolumeSlider(true)
                          }}
                          onMouseLeave={() => {
                            // Delay para permitir movimento do mouse para o slider
                            volumeTimeoutRef.current = setTimeout(() => {
                              setShowVolumeSlider(false)
                            }, 500)
                          }}
                        >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-0 shadow-lg relative z-50"
                              onClick={(e) => {
                                console.log('Botão de volume clicado!')
                                e.preventDefault()
                                e.stopPropagation()
                                toggleMute()
                                setShowVolumeWarning(false)
                              }}
                              onMouseDown={(e) => {
                                e.stopPropagation()
                              }}
                              onTouchStart={(e) => {
                                e.stopPropagation()
                              }}
                              style={{ pointerEvents: 'auto' }}
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
                        
                        {/* Volume Slider */}
                        {showVolumeSlider && (
                          <>
                            {/* Área invisível de ponte entre botão e slider */}
                            <div 
                              className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-transparent z-39"
                              onMouseEnter={() => {
                                if (volumeTimeoutRef.current) {
                                  clearTimeout(volumeTimeoutRef.current)
                                }
                                setShowVolumeSlider(true)
                              }}
                            />
                            
                            <div 
                              className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 p-3 rounded-lg shadow-lg z-40"
                              onMouseEnter={() => {
                                if (volumeTimeoutRef.current) {
                                  clearTimeout(volumeTimeoutRef.current)
                                }
                                setShowVolumeSlider(true)
                              }}
                              onMouseLeave={() => {
                                volumeTimeoutRef.current = setTimeout(() => {
                                  setShowVolumeSlider(false)
                                }, 300)
                              }}
                            >
                              <div className="flex flex-col items-center space-y-2">
                                <span className="text-white text-xs font-medium">{Math.round(volume * 100)}%</span>
                                <div className="relative">
                                  <input
                                     type="range"
                                     min="0"
                                     max="1"
                                     step="0.01"
                                     value={volume}
                                     onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                                     className="w-4 h-20 appearance-none cursor-pointer"
                                     style={{
                                       WebkitAppearance: 'slider-vertical',
                                       outline: 'none',
                                       background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`,
                                       borderRadius: '8px',
                                       border: '1px solid #374151'
                                     } as React.CSSProperties}
                                   />
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        </div>
                      )}

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-gray-500 hover:bg-gray-600 text-white border-0 shadow-lg relative z-50"
                            disabled
                            style={{ pointerEvents: 'auto' }}
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
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white border-0 shadow-lg relative z-50"
                            disabled
                            style={{ pointerEvents: 'auto' }}
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
                            className="h-10 w-10 sm:h-14 sm:w-14 rounded-full bg-gray-600 hover:bg-gray-700 text-white border-0 shadow-lg relative z-50"
                            disabled
                            style={{ pointerEvents: 'auto' }}
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
              <div className="w-full lg:w-[380px] bg-white p-6 flex flex-col justify-center lg:ml-4">
                <div className="max-w-sm mx-auto w-full">
                  {/* Video do usuário */}
                  <div className="relative bg-gray-900 rounded-xl overflow-hidden shadow-lg mb-4">
                    <div className="aspect-[16/9] flex items-center justify-center relative">
                      {/* Ícone de usuário */}
                      <div className="flex flex-col items-center justify-center text-gray-400 mb-14 sm:mb-20">
                        <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2">
                          <User className="h-8 w-8" />
                        </div>
                        <span className="text-sm">{userName}</span>
                      </div>
                      

                    </div>

                    {/* Controles do usuário - movidos para aqui */}
                    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3">
                      {/* Botão de encerrar reunião com ícone Material Symbols */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg"
                            onClick={() => setShowEndMeetingDialog(true)}
                          >
                            <span 
                              className="material-symbols-outlined text-lg sm:text-xl"
                              style={{ 
                                fontFamily: '"Material Symbols Outlined", sans-serif',
                                fontVariationSettings: '"FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24',
                                lineHeight: 1
                              }}
                            >
                              call_end
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Encerrar reunião</p>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black border-0 shadow-lg"
                            disabled
                          >
                            <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
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
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-neutral-100 hover:bg-neutral-200 text-black border-0 shadow-lg"
                            disabled
                          >
                            <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                          <p>Câmera desativada</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Bottom badges - aligned left, responsive */}
                  <div className="flex flex-nowrap items-start justify-start gap-2 sm:gap-3">
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
