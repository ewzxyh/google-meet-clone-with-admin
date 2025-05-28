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
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [isPlaybackBlocked, setIsPlaybackBlocked] = useState(false)
  const [currentVolume, setCurrentVolume] = useState(volume)
  const [isVideoLoaded, setIsVideoLoaded] = useState(false)
  const [needsAudioActivation, setNeedsAudioActivation] = useState(false)
  const [playbackAttempted, setPlaybackAttempted] = useState(false)

  // Detectar iOS com mais precisão
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
    /iPad|iPhone|iPod/.test(navigator.platform)
  )

  // Detectar Safari
  const isSafari = typeof window !== 'undefined' && (
    /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent)
  )

  useImperativeHandle(ref, () => ({
    play: () => {
      handleStartVideo()
    },
    setVolume: (vol: number) => {
      const videoElement = videoRef.current
      if (videoElement && !isEnded) {
        const clampedVolume = Math.max(0, Math.min(1, vol))
        setCurrentVolume(clampedVolume)
        if (hasUserInteracted && !videoElement.muted) {
          videoElement.volume = clampedVolume
        }
      }
    },
    getVolume: () => currentVolume
  }))

  // Função principal para iniciar reprodução
  const startVideoPlayback = async (forceUnmuted = false) => {
    const videoElement = videoRef.current
    if (!videoElement || isEnded) return false

    try {
      // Garantir posição inicial
      if (Math.abs(videoElement.currentTime - initialPosition) > 1) {
        videoElement.currentTime = initialPosition
      }
      
      // Configurar áudio baseado na plataforma
      if (isIOS || isSafari) {
        videoElement.muted = !forceUnmuted
      } else {
        videoElement.muted = false
        videoElement.volume = currentVolume
      }

      await videoElement.play()
      
      setIsPlaybackBlocked(false)
      setHasUserInteracted(true)
      setPlaybackAttempted(true)
      
      // No iOS, mostrar opção para ativar áudio
      if ((isIOS || isSafari) && !forceUnmuted) {
        setNeedsAudioActivation(true)
      }
      
      console.log('Vídeo iniciado com sucesso', { muted: videoElement.muted, platform: isIOS ? 'iOS' : isSafari ? 'Safari' : 'Other' })
      return true
    } catch (error) {
      console.error('Erro ao reproduzir vídeo:', error)
      setIsPlaybackBlocked(true)
      return false
    }
  }

  // Função para ativar áudio após interação
  const activateAudio = async () => {
    const videoElement = videoRef.current
    if (!videoElement || isEnded) return

    try {
      videoElement.muted = false
      videoElement.volume = currentVolume
      setNeedsAudioActivation(false)
      console.log('Áudio ativado com volume:', currentVolume)
    } catch (error) {
      console.error('Erro ao ativar áudio:', error)
    }
  }

  // Função para lidar com clique/toque inicial
  const handleStartVideo = async () => {
    if (isPlaybackBlocked || !isVideoLoaded) {
      // Tentar reproduzir com áudio se possível
      const success = await startVideoPlayback(!isIOS && !isSafari)
      if (!success && (isIOS || isSafari)) {
        // Se falhou, tentar mutado
        await startVideoPlayback(false)
      }
    } else if (needsAudioActivation) {
      await activateAudio()
    }
  }

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement || isEnded) return

    const handleLoadedMetadata = () => {
      console.log('Metadata carregada')
      videoElement.currentTime = initialPosition
    }

    const handleLoadedData = () => {
      console.log('Dados do vídeo carregados')
      setIsVideoLoaded(true)
      
      // Tentar reproduzir automaticamente
      if (!playbackAttempted) {
        setTimeout(() => {
          startVideoPlayback()
        }, 100)
      }
    }

    const handleCanPlay = () => {
      // Garantir posição correta
      if (Math.abs(videoElement.currentTime - initialPosition) > 1) {
        videoElement.currentTime = initialPosition
      }
    }

    const handleEnded = () => {
      if (!isEnded) {
        console.log('Vídeo terminou')
        onVideoEnd()
      }
    }

    const handlePause = () => {
      // Só tentar reproduzir automaticamente se o usuário já interagiu
      if (hasUserInteracted && !isEnded && !isPlaybackBlocked) {
        setTimeout(() => {
          if (videoElement.paused && !isEnded) {
            videoElement.play().catch(() => {
              console.log('Não foi possível retomar reprodução automaticamente')
            })
          }
        }, 100)
      }
    }

    const handlePlay = () => {
      setIsPlaybackBlocked(false)
    }

    const handleError = (e: Event) => {
      console.error('Erro no vídeo:', e)
      setIsPlaybackBlocked(true)
    }

    const handleWaiting = () => {
      console.log('Vídeo buffering...')
    }

    const handlePlaying = () => {
      console.log('Vídeo reproduzindo')
      setIsPlaybackBlocked(false)
    }

    // Adicionar listeners
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata)
    videoElement.addEventListener("loadeddata", handleLoadedData)
    videoElement.addEventListener("canplay", handleCanPlay)
    videoElement.addEventListener("ended", handleEnded)
    videoElement.addEventListener("pause", handlePause)
    videoElement.addEventListener("play", handlePlay)
    videoElement.addEventListener("playing", handlePlaying)
    videoElement.addEventListener("waiting", handleWaiting)
    videoElement.addEventListener("error", handleError)

    return () => {
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata)
      videoElement.removeEventListener("loadeddata", handleLoadedData)
      videoElement.removeEventListener("canplay", handleCanPlay)
      videoElement.removeEventListener("ended", handleEnded)
      videoElement.removeEventListener("pause", handlePause)
      videoElement.removeEventListener("play", handlePlay)
      videoElement.removeEventListener("playing", handlePlaying)
      videoElement.removeEventListener("waiting", handleWaiting)
      videoElement.removeEventListener("error", handleError)
    }
  }, [videoUrl, initialPosition, onVideoEnd, hasUserInteracted, isEnded, isPlaybackBlocked, playbackAttempted])

  // Controle de volume
  useEffect(() => {
    const videoElement = videoRef.current
    if (videoElement && hasUserInteracted && !videoElement.muted) {
      videoElement.volume = currentVolume
    }
  }, [currentVolume, hasUserInteracted])

  // Atualizar volume quando prop mudar
  useEffect(() => {
    if (volume !== currentVolume) {
      setCurrentVolume(volume)
    }
  }, [volume, currentVolume])

  return (
    <div className="relative h-full w-full bg-gray-900">
      {/* Overlay quando reprodução está bloqueada */}
      {(isPlaybackBlocked || (!playbackAttempted && isVideoLoaded)) && (
        <div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-gray-900 cursor-pointer transition-opacity"
          onClick={handleStartVideo}
        >
          <div className="text-white text-center p-6 max-w-sm">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-blue-600 p-4 hover:bg-blue-700 transition-colors shadow-lg">
                <Play className="h-8 w-8 text-white fill-white ml-1" />
              </div>
            </div>
            <h3 className="text-xl font-medium mb-2">Entrar na reunião</h3>
            <p className="text-sm text-gray-300">
              {isIOS || isSafari 
                ? "Toque para participar da reunião ao vivo" 
                : "Clique para participar da reunião ao vivo"
              }
            </p>
          </div>
        </div>
      )}

      {/* Overlay discreto para ativar áudio no iOS/Safari */}
      {needsAudioActivation && hasUserInteracted && !isPlaybackBlocked && (
        <div 
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-80 rounded-lg p-3 cursor-pointer hover:bg-opacity-90 transition-all"
          onClick={activateAudio}
        >
          <div className="text-white text-center">
            <div className="text-xl mb-1">🔊</div>
            <p className="text-xs font-medium">Ativar som</p>
          </div>
        </div>
      )}

      {/* Loading indicator quando vídeo está carregando */}
      {!isVideoLoaded && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-900">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-sm text-gray-300">Carregando reunião...</p>
          </div>
        </div>
      )}
      
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={videoUrl}
        playsInline
        muted={isIOS || isSafari}
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        preload="auto"
        webkit-playsinline="true"
      />
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
