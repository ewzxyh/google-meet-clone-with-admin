"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"

interface VideoPlayerProps {
  videoUrl: string
  initialPosition: number
  onVideoEnd: () => void
  volume?: number
  isEnded?: boolean
}

export interface VideoPlayerRef {
  play: () => void
  setVolume: (volume: number) => void
  getVolume: () => number
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ 
  videoUrl, 
  initialPosition, 
  onVideoEnd, 
  volume = 1,
  isEnded = false
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [currentVolume, setCurrentVolume] = useState(volume)

  // Detectar iOS
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )

  useImperativeHandle(ref, () => ({
    play: () => {
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.play()
      }
    },
    setVolume: (vol: number) => {
      const videoElement = videoRef.current
      if (videoElement) {
        const clampedVolume = Math.max(0, Math.min(1, vol))
        setCurrentVolume(clampedVolume)
        videoElement.volume = clampedVolume
      }
    },
    getVolume: () => currentVolume
  }))

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || isEnded) return

    const handleEnded = () => {
      if (!isEnded) {
        onVideoEnd()
      }
    }

    videoElement.addEventListener("ended", handleEnded)
    
    return () => {
      videoElement.removeEventListener("ended", handleEnded)
    }
  }, [onVideoEnd, isEnded])

  // Para iOS: vídeo simples sem autoplay
  if (isIOS) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          src={videoUrl}
          playsInline
          controls
          preload="metadata"
        />
      </div>
    )
  }

  // Para outros dispositivos: autoplay normal
  return (
    <div className="relative h-full w-full bg-gray-900">
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
        preload="auto"
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer

