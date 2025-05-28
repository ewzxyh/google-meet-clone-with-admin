"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"
import { Play } from "lucide-react"

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
  const [hasStarted, setHasStarted] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(volume)

  // Detectar iOS
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )

  useImperativeHandle(ref, () => ({
    play: () => {
      playVideo()
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

  const playVideo = () => {
    const videoElement = videoRef.current
    if (!videoElement || isEnded) return

    console.log('🎬 Reproduzindo vídeo...')
    
    // Configurar vídeo
    videoElement.currentTime = initialPosition
    videoElement.muted = false
    videoElement.volume = currentVolume
    
    // Reproduzir
    videoElement.play()
      .then(() => {
        console.log('✅ Vídeo reproduzindo!')
        setHasStarted(true)
      })
      .catch((error) => {
        console.error('❌ Erro ao reproduzir:', error)
        // Se falhar, tentar mutado
        videoElement.muted = true
        videoElement.play()
          .then(() => {
            console.log('✅ Vídeo reproduzindo (mutado)!')
            setHasStarted(true)
          })
          .catch((err) => {
            console.error('❌ Erro mesmo mutado:', err)
          })
      })
  }

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

  // Para iOS: interface simples com botão
  if (isIOS) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        <video
          ref={videoRef}
          className="h-full w-full object-contain"
          src={videoUrl}
          playsInline
          controls={false}
          preload="auto"
        />
        
        {!hasStarted && (
          <div 
            className="absolute inset-0 z-20 flex items-center justify-center bg-black bg-opacity-50 cursor-pointer"
            onClick={playVideo}
          >
            <div className="text-center">
              <div className="rounded-full bg-white bg-opacity-90 p-6 mx-auto mb-4 w-20 h-20 flex items-center justify-center">
                <Play className="h-8 w-8 text-black fill-black ml-1" />
              </div>
              <h3 className="text-white text-xl font-medium">Entrar na reunião</h3>
              <p className="text-gray-300 text-sm mt-2">Toque para participar</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Para outros dispositivos: comportamento normal
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

