"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowser } from "@/lib/supabase"
import { MicOff, VideoOff, MessageCircle, Phone, Volume2, VolumeX } from "lucide-react"
import ChatPanel from "./chat-panel"
import VideoPlayer, { VideoPlayerRef } from "./video-player"

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
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<VideoPlayerRef>(null)

  const markMeetingAsEnded = async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) {
      console.error("Supabase client not available")
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
      // Só marcar como encerrada se não estiver já encerrada
      if (!isEnded) {
        markMeetingAsEnded()
      }
    }
  }, [isEnded])

  const handleVolumeChange = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume))
    setVolume(clampedVolume)
    if (videoPlayerRef.current) {
      videoPlayerRef.current.setVolume(clampedVolume)
    }
    setIsMuted(clampedVolume === 0)
  }, [])

  const toggleMute = useCallback(() => {
    if (isMuted) {
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
    <div className="flex h-screen flex-col bg-black">
      {/* Header */}
      <header className="flex items-center justify-between bg-black px-4 py-2 text-white">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-500">AO VIVO</span>
          </div>
        </div>
        <div className="flex items-center">
          <span className="text-lg font-medium">Amanda</span>
        </div>
      </header>

      {/* Main content */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Video area - Using a ref to maintain the video container */}
        <main ref={videoContainerRef} className="relative flex-1 overflow-hidden">
          <VideoPlayer
            ref={videoPlayerRef}
            videoUrl={videoUrl}
            initialPosition={initialPosition}
            onVideoEnd={handleVideoEnd}
            volume={volume}
          />

          {/* User name display */}
          <div className="absolute bottom-4 left-4 text-white">{userName}</div>
        </main>

        {/* Chat panel */}
        {isChatOpen && <ChatPanel onClose={toggleChat} />}
      </div>

      {/* Controls */}
      <div className="bg-black p-4">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-red-500 text-white hover:bg-red-600"
            disabled
          >
            <MicOff className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-red-500 text-white hover:bg-red-600"
            disabled
          >
            <VideoOff className="h-6 w-6" />
          </Button>

          {/* Volume Control */}
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-full bg-gray-600 text-white hover:bg-gray-700"
              onClick={toggleMute}
              onMouseEnter={() => setShowVolumeSlider(true)}
              onMouseLeave={() => setShowVolumeSlider(false)}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-6 w-6 text-white" />
              ) : (
                <Volume2 className="h-6 w-6 text-white" />
              )}
            </Button>
            
            {/* Volume Slider */}
            {showVolumeSlider && (
              <div 
                className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gray-800 p-3 rounded-lg shadow-lg"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
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
                      className="w-4 h-20 appearance-none cursor-pointer slider-vertical"
                      style={{
                        WebkitAppearance: 'slider-vertical',
                        outline: 'none',
                        background: `linear-gradient(to top, #3b82f6 0%, #3b82f6 ${volume * 100}%, #4b5563 ${volume * 100}%, #4b5563 100%)`,
                        borderRadius: '8px',
                        border: '1px solid #374151'
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-gray-500 text-gray-400 cursor-not-allowed"
            disabled
          >
            <MessageCircle className="h-6 w-6" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-red-600 text-white hover:bg-red-700"
            onClick={handleEndMeeting}
          >
            <Phone className="h-6 w-6 rotate-135" />
          </Button>
        </div>
      </div>
    </div>
  )
}
