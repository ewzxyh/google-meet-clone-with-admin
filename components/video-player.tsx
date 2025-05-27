"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"

interface VideoPlayerProps {
  videoUrl: string
  initialPosition: number
  onVideoEnd: () => void
}

export interface VideoPlayerRef {
  play: () => void
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ videoUrl, initialPosition, onVideoEnd }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)

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
    if (videoElement) {
      videoElement.currentTime = initialPosition

      const handleEnded = () => {
        onVideoEnd()
      }

      // Prevenir cliques no vídeo
      const handleClick = (e: Event) => {
        e.preventDefault()
        e.stopPropagation()
      }

      // Prevenir pausa
      const handlePause = () => {
        videoElement.play()
      }

      videoElement.addEventListener("ended", handleEnded)
      videoElement.addEventListener("click", handleClick)
      videoElement.addEventListener("pause", handlePause)

      // Tentar reproduzir automaticamente (pode falhar devido às políticas do navegador)
      videoElement.play().catch(() => {
        // Silenciosamente falha se não houver interação do usuário ainda
        console.log("Autoplay bloqueado - aguardando interação do usuário")
      })

      return () => {
        videoElement.removeEventListener("ended", handleEnded)
        videoElement.removeEventListener("click", handleClick)
        videoElement.removeEventListener("pause", handlePause)
      }
    }
  }, [videoUrl, initialPosition, onVideoEnd])

  return (
    <div className="relative h-full w-full">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={videoUrl}
        autoPlay
        playsInline
        muted={false}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
