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

  // Função para iniciar o vídeo (chamada pela API externa)
  const startVideo = () => {
    console.log('startVideo chamado via API, isIOS:', isIOS)
    
    const videoElement = videoRef.current
    if (videoElement) {
      console.log('Tentando iniciar vídeo via API...')
      
      videoElement.play().then(() => {
        console.log('Vídeo iniciado com sucesso via API!')
        setHasStarted(true)
        setShowJoinButton(false)
      }).catch((error) => {
        console.error('Erro ao iniciar vídeo via API:', error)
      })
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
        if (clampedVolume > 0 && videoElement.muted) {
          videoElement.muted = false // Explicitamente desmutar se o volume for > 0 e estiver mutado
        } else if (clampedVolume === 0 && !videoElement.muted) {
          videoElement.muted = true // Explicitamente mutar se o volume for 0 e não estiver mutado
        }
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

    const handlePause = () => {
      if (hasStarted && !videoElement.ended) {
        console.log('Tentativa de pause detectada - forçando play')
        setTimeout(() => {
          if (videoElement.paused && !videoElement.ended) {
            videoElement.play().catch(console.error)
          }
        }, 10)
      }
    }

    videoElement.addEventListener("ended", handleEnded)
    videoElement.addEventListener("pause", handlePause)
    
    return () => {
      videoElement.removeEventListener("ended", handleEnded)
      videoElement.removeEventListener("pause", handlePause)
    }
  }, [onVideoEnd, isEnded, hasStarted])

  // Prevenir teclas que podem pausar o vídeo
  useEffect(() => {
    if (!hasStarted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault()
        console.log('Tecla espaço bloqueada')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [hasStarted])

  // Para iOS: usar vídeo HTML5 normal com botão visual
  if (isIOS) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        {/* Thumbnail de fundo apenas quando não iniciou */}
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
          className="h-full w-full object-contain"
          src={videoUrl}
          playsInline
          autoPlay
          muted={true}
          loop
          controls={false}
          disablePictureInPicture
          controlsList="nodownload nofullscreen noremoteplayback"
          preload="metadata"
          style={{
            zIndex: showJoinButton && !hasStarted ? 5 : 1
          }}
          onClick={() => {
            const videoElement = videoRef.current;
            if (videoElement) {
              if (videoElement.muted || videoElement.paused) {
                videoElement.muted = false; // Desmutar
                if (videoElement.paused) {
                  videoElement.play().then(() => {
                    console.log('Vídeo iniciado e desmutado (via clique iOS)');
                    setHasStarted(true);
                    setShowJoinButton(false);
                  }).catch((error) => {
                    console.error('Erro ao iniciar/desmutar vídeo (via clique iOS):', error);
                  });
                } else {
                  // Já estava tocando mutado, agora foi desmutado.
                  console.log('Vídeo desmutado por clique (iOS)');
                  setHasStarted(true); 
                  setShowJoinButton(false);
                }
              }
            }
          }}
          onPlay={() => {
            console.log('Vídeo iniciou - iOS')
            setHasStarted(true)
            setShowJoinButton(false)
          }}
          onEnded={() => {
            if (!isEnded) {
              onVideoEnd()
            }
          }}
        />
        
        {/* Overlay para prevenir pause APENAS após o vídeo iniciar */}
        {hasStarted && (
          <div 
            className="absolute inset-0"
            style={{ 
              zIndex: 20, 
              pointerEvents: 'auto',
              background: 'transparent',
              touchAction: 'none'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Clique no overlay bloqueado - vídeo não pode ser pausado')
            }}
            onTouchStart={(e) => {
              e.stopPropagation()
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
            }}
            onTouchMove={(e) => {
              e.stopPropagation()
            }}
          />
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

