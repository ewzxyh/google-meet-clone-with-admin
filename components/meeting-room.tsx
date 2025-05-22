"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { getSupabaseBrowser } from "@/lib/supabase"
import ChatPanel from "./chat-panel"
import SecurityNotice from "./security-notice"
import VideoPlayer from "./video-player"

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
  const [currentTime, setCurrentTime] = useState(initialPosition)
  const videoContainerRef = useRef<HTMLDivElement>(null)

  // Auto-hide security notice after 10 seconds
  useEffect(() => {
    if (showSecurityNotice) {
      const timer = setTimeout(() => {
        setShowSecurityNotice(false)
      }, 10000)

      return () => clearTimeout(timer)
    }
  }, [showSecurityNotice])

  // Save video position periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      saveVideoPosition(currentTime)
    }, 5000)

    return () => {
      clearInterval(saveInterval)
      saveVideoPosition(currentTime)
    }
  }, [currentTime])

  const saveVideoPosition = async (position: number) => {
    const supabase = getSupabaseBrowser()
    if (!supabase) return

    try {
      await supabase
        .from("participants")
        .update({ last_video_position: position })
        .eq("meeting_id", meetingId)
        .eq("name", userName)
    } catch (error) {
      console.error("Error saving video position:", error)
    }
  }

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
    saveVideoPosition(currentTime)
    router.push("/")
  }

  const handleReturnHome = () => {
    console.log("Returning to home page...")
    router.push("/")
  }

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen)
  }

  const handleUpdateTime = (time: number) => {
    setCurrentTime(time)
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
            videoUrl={videoUrl}
            initialPosition={initialPosition}
            onVideoEnd={handleVideoEnd}
            onTimeUpdate={handleUpdateTime}
          />

          {/* User name display */}
          <div className="absolute bottom-4 left-4 text-white">{userName}</div>

          {/* Security notice - Positioned absolutely over the video without affecting it */}
          {showSecurityNotice && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 transform z-10">
              <SecurityNotice onClose={() => setShowSecurityNotice(false)} />
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

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-gray-700 text-white hover:bg-gray-600"
            onClick={toggleChat}
          >
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
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full bg-red-600 text-white hover:bg-red-700"
            onClick={handleEndMeeting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 rotate-135"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  )
}
