"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
import VideoLoading from "./video-loading"
import MeetingConfirmation from "./meeting-confirmation"
import MeetingWaitingRoom from "./meeting-waiting-room"
import { useIOSDetection } from "@/hooks/use-ios-detection"

interface VideoPlayerProps {
  videoUrl: string
  initialPosition: number
  onVideoEnd: () => void
  meetingId: string
  userName: string
}

export interface VideoPlayerRef {
  play: () => void
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ videoUrl, initialPosition, onVideoEnd, meetingId, userName }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const { isIOS, isLoaded } = useIOSDetection()
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false)
  const [showWaitingRoom, setShowWaitingRoom] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useImperativeHandle(ref, () => ({
    play: () => {
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.play().catch(console.error)
      }
    }
  }))

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && isLoaded) {
      videoElement.currentTime = initialPosition

      const handleEnded = () => {
        onVideoEnd()
      }

      const handlePlay = () => {
        setIsPlaying(true)
        setNeedsUserInteraction(false)
        setShowWaitingRoom(false)
        setShowConfirmation(false)
        setIsLoading(false)
      }

      const handlePause = () => {
        setIsPlaying(false)
        // Só tentar reproduzir novamente se não for iOS ou se já houve interação
        if (!isIOS && !videoElement.ended) {
          videoElement.play().catch(() => {})
        }
      }

      const handleLoadedData = () => {
        setIsLoading(false)
        // Tentar autoplay baseado no dispositivo
        if (isIOS) {
          // iOS: começar mutado e aguardar interação
          videoElement.muted = true
          videoElement.play().catch(() => {
            setNeedsUserInteraction(true)
            setShowWaitingRoom(true)
          })
        } else {
          // Outros dispositivos: tentar autoplay normal
          videoElement.play().catch(() => {
            setNeedsUserInteraction(true)
            setShowWaitingRoom(true)
          })
        }
      }

      const handleLoadStart = () => {
        setIsLoading(true)
      }

      // Prevenir cliques no vídeo
      const handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
      }

      videoElement.addEventListener("ended", handleEnded)
      videoElement.addEventListener("play", handlePlay)
      videoElement.addEventListener("pause", handlePause)
      videoElement.addEventListener("loadeddata", handleLoadedData)
      videoElement.addEventListener("loadstart", handleLoadStart)
      videoElement.addEventListener("click", handleClick)

      return () => {
        videoElement.removeEventListener("ended", handleEnded)
        videoElement.removeEventListener("play", handlePlay)
        videoElement.removeEventListener("pause", handlePause)
        videoElement.removeEventListener("loadeddata", handleLoadedData)
        videoElement.removeEventListener("loadstart", handleLoadStart)
        videoElement.removeEventListener("click", handleClick)
      }
    }
  }, [videoUrl, initialPosition, onVideoEnd, isIOS, isLoaded])

  const handleWaitingRoomReady = () => {
    setShowWaitingRoom(false)
    setShowConfirmation(true)
  }

  const handleMeetingConfirmation = () => {
    const videoElement = videoRef.current
    if (videoElement) {
      if (isIOS) {
        // iOS: começar mutado e depois tentar ativar áudio
        videoElement.muted = true
        videoElement.play().then(() => {
          // Tentar ativar áudio após 1 segundo
          setTimeout(() => {
            videoElement.muted = false
          }, 1000)
        }).catch(console.error)
      } else {
        // Outros dispositivos: reproduzir normalmente
        videoElement.play().catch(console.error)
      }
      setNeedsUserInteraction(false)
      setShowConfirmation(false)
    }
  }

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={videoUrl}
        autoPlay={!isIOS} // Desabilitar autoplay no iOS
        playsInline
        muted={isIOS} // iOS sempre começa mutado
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{ pointerEvents: 'none' }}
        preload="metadata"
      />
      
      {/* Loading overlay */}
      <VideoLoading isVisible={isLoading} />
      
      {/* Sala de espera (aparece primeiro) */}
      {needsUserInteraction && !isLoading && (
        <MeetingWaitingRoom
          isVisible={showWaitingRoom}
          onReady={handleWaitingRoomReady}
          meetingId={meetingId}
          userName={userName}
        />
      )}
      
      {/* Confirmação de participação na reunião */}
      {needsUserInteraction && !isLoading && (
        <MeetingConfirmation
          isVisible={showConfirmation}
          onConfirm={handleMeetingConfirmation}
          meetingId={meetingId}
          userName={userName}
        />
      )}
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
