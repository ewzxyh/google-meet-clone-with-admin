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
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [showJoinButton, setShowJoinButton] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)

  // Detectar iOS
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )

  // Função para iniciar o vídeo (chamada pelo botão ou pela API)
  const startVideo = () => {
    console.log('startVideo chamado, isIOS:', isIOS)
    
    const videoElement = videoRef.current
    if (videoElement) {
      console.log('Elemento de vídeo encontrado, tentando reproduzir...')
      
      videoElement.play().then(() => {
        console.log('Vídeo iniciado com sucesso!')
        setHasStarted(true)
        setShowJoinButton(false)
      }).catch((error) => {
        console.error('Erro ao iniciar vídeo:', error)
        // Tentar novamente após um delay
        setTimeout(() => {
          videoElement.play().then(() => {
            console.log('Vídeo iniciado com sucesso na segunda tentativa!')
            setHasStarted(true)
            setShowJoinButton(false)
          }).catch(console.error)
        }, 500)
      })
    } else {
      console.log('Elemento de vídeo não encontrado')
    }
  }

  useImperativeHandle(ref, () => ({
    play: startVideo,
    setVolume: (vol: number) => {
      const clampedVolume = Math.max(0, Math.min(1, vol))
      setCurrentVolume(clampedVolume)
      
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.volume = clampedVolume
        console.log(`Volume ajustado para: ${Math.round(clampedVolume * 100)}%`)
      }
    },
    getVolume: () => currentVolume
  }))

  // Para iOS, mostrar botão após um delay
  useEffect(() => {
    if (isIOS) {
      const timer = setTimeout(() => {
        console.log('Mostrando botão de entrada na reunião para iOS')
        setShowJoinButton(true)
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isIOS])

  // Debug dos estados
  useEffect(() => {
    console.log('Estados atuais:', {
      isIOS,
      isScriptLoaded,
      showJoinButton,
      hasStarted
    })
  }, [isIOS, isScriptLoaded, showJoinButton, hasStarted])

  // Para dispositivos não-iOS, iniciar automaticamente
  useEffect(() => {
    if (!isIOS && !hasStarted) {
      const timer = setTimeout(() => {
        startVideo()
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isIOS, hasStarted])

  // Sincronizar volume quando prop volume mudar
  useEffect(() => {
    if (volume !== currentVolume) {
      setCurrentVolume(volume)
      
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.volume = volume
        console.log(`Volume sincronizado para: ${Math.round(volume * 100)}%`)
      }
    }
  }, [volume, currentVolume])

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

  // Para iOS: usar vídeo HTML5 normal com botão de entrada
  if (isIOS) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        {!hasStarted && (
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(https://images.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/thumbnail.jpg)'
            }}
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          </div>
        )}
        
        <video
          ref={videoRef}
          className={`h-full w-full object-contain ${hasStarted ? 'block' : 'hidden'}`}
          src={videoUrl}
          playsInline
          muted={false}
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          preload="metadata"
          onEnded={() => {
            if (!isEnded) {
              onVideoEnd()
            }
          }}
        />
        
        {/* Botão de Confirmar Entrada na Reunião */}
        {showJoinButton && !hasStarted && (
          <div 
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 9999, pointerEvents: 'auto' }}
          >
            <div className="text-center">
              <button
                onClick={() => {
                  console.log('Botão clicado!')
                  startVideo()
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
                style={{ pointerEvents: 'auto' }}
              >
                Confirmar Entrada na Reunião
              </button>
            </div>
          </div>
        )}
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

