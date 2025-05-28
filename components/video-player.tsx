"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState } from "react"

interface VideoPlayerProps {
  videoUrl: string
  initialPosition: number
  onVideoEnd: () => void
  volume?: number
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
  volume = 1
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isPendingPlay, setIsPendingPlay] = useState(false)
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
        if (isIOS && !hasUserInteracted) {
          videoElement.muted = true
          videoElement.play().then(() => {
            setIsPendingPlay(true)
          }).catch(console.error)
        } else {
          videoElement.muted = false
          videoElement.play().catch(console.error)
        }
      }
    },
    setVolume: (vol: number) => {
      const videoElement = videoRef.current
      if (videoElement) {
        const clampedVolume = Math.max(0, Math.min(1, vol))
        videoElement.volume = clampedVolume
        setCurrentVolume(clampedVolume)
      }
    },
    getVolume: () => currentVolume
  }))

  // Função para ativar áudio após interação
  const enableAudioAfterInteraction = async () => {
    const videoElement = videoRef.current
    if (videoElement && isIOS && !hasUserInteracted) {
      try {
        // Pausar, desmutar e reproduzir novamente
        videoElement.pause()
        videoElement.muted = false
        videoElement.volume = currentVolume
        await videoElement.play()
        setHasUserInteracted(true)
        setIsPendingPlay(false)
      } catch (error) {
        console.error('Erro ao ativar áudio:', error)
      }
    }
  }

  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.currentTime = initialPosition

      const handleEnded = () => {
        onVideoEnd()
      }

      // Permitir cliques para ativar áudio no iOS
      const handleClick = (e: Event) => {
        if (isPendingPlay && isIOS) {
          e.preventDefault()
          e.stopPropagation()
          enableAudioAfterInteraction()
        } else {
          e.preventDefault()
          e.stopPropagation()
        }
      }

      // Prevenir pausa
      const handlePause = () => {
        if (!isPendingPlay) {
          videoElement.play()
        }
      }

      videoElement.addEventListener("ended", handleEnded)
      videoElement.addEventListener("click", handleClick)
      videoElement.addEventListener("pause", handlePause)

      // Tentar reproduzir - mutado inicialmente no iOS
      if (isIOS) {
        videoElement.muted = true
        videoElement.play().then(() => {
          setIsPendingPlay(true)
        }).catch(() => {
          console.log("Autoplay bloqueado - aguardando interação do usuário")
        })
      } else {
        videoElement.muted = false
        videoElement.play().catch(() => {
          console.log("Autoplay bloqueado - aguardando interação do usuário")
        })
      }

      return () => {
        videoElement.removeEventListener("ended", handleEnded)
        videoElement.removeEventListener("click", handleClick)
        videoElement.removeEventListener("pause", handlePause)
      }
    }
  }, [videoUrl, initialPosition, onVideoEnd, isPendingPlay, isIOS])

  // Separar o controle de volume em um useEffect próprio
  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement) {
      videoElement.volume = currentVolume
    }
  }, [currentVolume])

  // Atualizar volume quando prop mudar
  useEffect(() => {
    if (volume !== currentVolume) {
      setCurrentVolume(volume)
    }
  }, [volume, currentVolume])

  return (
    <div className="relative h-full w-full">
      {/* Overlay para iOS quando áudio está pendente */}
      {isPendingPlay && isIOS && (
        <div 
          className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-70 cursor-pointer"
          onClick={enableAudioAfterInteraction}
        >
          <div className="text-white text-center p-4">
            <div className="text-6xl mb-4">🔊</div>
            <p className="text-xl font-medium mb-2">Toque para ativar o áudio</p>
            <p className="text-sm text-gray-300">O vídeo está reproduzindo sem som</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={videoUrl}
        autoPlay
        playsInline
        muted={isIOS ? true : false}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        style={{ pointerEvents: isPendingPlay ? 'none' : 'auto' }}
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
