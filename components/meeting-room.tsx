"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowser } from "@/lib/supabase"
import { MicOff, VideoOff, MessageCircle, Phone } from "lucide-react"
import ChatPanel from "./chat-panel"
import SecurityNotice from "./security-notice"
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
  const [showSecurityNotice, setShowSecurityNotice] = useState(true)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const videoPlayerRef = useRef<VideoPlayerRef>(null)

  // Auto-hide security notice after 3 seconds
  useEffect(() => {
    if (showSecurityNotice) {
      const timer = setTimeout(() => {
        setShowSecurityNotice(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [showSecurityNotice])

  const markMeetingAsEnded = async () => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      await supabase.from("meetings").update({ status: "ended" }).eq("meeting_id", meetingId)
    } catch (error) {
      console.error("Error marking meeting as ended:", error)
    }
  }

  const handleVideoEnd = async () => {
    console.log("Video ended, ending meeting...")
    setIsEnded(true)

    // Marcar a reunião como finalizada no banco de dados
    const supabase = getSupabaseBrowser()
    if (supabase) {
      try {
        await supabase.from("meetings").update({ status: "ended" }).eq("meeting_id", meetingId)

        console.log("Meeting marked as ended in database")
      } catch (error) {
        console.error("Error marking meeting as ended:", error)
      }
    }
  }

  const handleEndMeeting = () => {
    router.push("/")
  }

  const handleReturnHome = () => {
    console.log("Returning to home page...")
    router.push("/")
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

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
        <div className="flex items-center">
          <h1 className="text-lg font-medium">{meetingId}</h1>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-300">
            {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
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
            meetingId={meetingId}
            userName={userName}
          />

          {/* User name display */}
          <div className="absolute bottom-4 left-4 text-white">{userName}</div>

          {/* Security notice - Positioned absolutely over the video without affecting it */}
          {showSecurityNotice && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 transform z-10">
              <SecurityNotice onClose={() => {
                setShowSecurityNotice(false)
              }} />
            </div>
          )}
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
