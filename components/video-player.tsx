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

  // Carregar script do ConvertAI para iOS
  useEffect(() => {
    if (!isIOS) return

    // Verificar se o script já existe
    const existingScript = document.getElementById('scr_6837a8d8357fd7f67137cd7c')
    if (existingScript) {
      setIsScriptLoaded(true)
      return
    }

    // Criar e carregar o script
    const script = document.createElement("script")
    script.id = "scr_6837a8d8357fd7f67137cd7c"
    script.src = "https://scripts.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/player.js"
    script.async = true
    
    script.onload = () => {
      console.log('ConvertAI script carregado para iOS')
      setIsScriptLoaded(true)
      
      // Configurações para esconder controles e desabilitar pause
      setTimeout(() => {
        // Tentar esconder barra de progresso e controles de tempo
        const playerElement = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        if (playerElement) {
          // Adicionar CSS para esconder controles
          const style = document.createElement('style')
          style.textContent = `
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-controls-bar,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-progress-bar,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-time,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-duration,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-progress,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-controller-mask,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-fake-bar,
            #vid_6837a8d8357fd7f67137cd7c .vjs-progress-control,
            #vid_6837a8d8357fd7f67137cd7c .vjs-time-control,
            #vid_6837a8d8357fd7f67137cd7c .vjs-current-time,
            #vid_6837a8d8357fd7f67137cd7c .vjs-duration,
            #vid_6837a8d8357fd7f67137cd7c .vjs-remaining-time,
            #vid_6837a8d8357fd7f67137cd7c .vjs-control-bar,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-control-bar {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
            }
            #vid_6837a8d8357fd7f67137cd7c video {
              pointer-events: none !important;
            }
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-play-button,
            #vid_6837a8d8357fd7f67137cd7c .vjs-big-play-button {
              pointer-events: auto !important;
            }
            #vid_6837a8d8357fd7f67137cd7c {
              pointer-events: none !important;
            }
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-play-button,
            #vid_6837a8d8357fd7f67137cd7c .vjs-big-play-button,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-poster {
              pointer-events: auto !important;
            }
          `
          document.head.appendChild(style)
          
          // Prevenir pause no vídeo de forma mais robusta
          const video = playerElement.querySelector('video')
          if (video) {
            let isPlaying = false
            
            // Listener para detectar quando vídeo começa
            video.addEventListener('play', () => {
              isPlaying = true
              console.log('Vídeo iniciado - prevenção de pause ativada')
            })
            
            // Prevenir pause
            video.addEventListener('pause', (e) => {
              if (isPlaying && !video.ended) {
                console.log('Tentativa de pause detectada - forçando play')
                e.preventDefault()
                setTimeout(() => {
                  if (video.paused && !video.ended) {
                    video.play().catch(console.error)
                  }
                }, 10)
              }
            })
            
            // Prevenir cliques diretos no vídeo
            video.addEventListener('click', (e) => {
              if (isPlaying) {
                e.preventDefault()
                e.stopPropagation()
                console.log('Clique no vídeo bloqueado')
              }
            })
            
            // Listener para espaço e outras teclas
            document.addEventListener('keydown', (e) => {
              if (isPlaying && (e.code === 'Space' || e.key === ' ')) {
                e.preventDefault()
                console.log('Tecla espaço bloqueada')
              }
            })
          }
        }
      }, 1000)
      
      // Observer adicional para esconder controles que aparecem depois
      setTimeout(() => {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // Element node
                const element = node as Element
                // Esconder controles que podem aparecer dinamicamente
                if (element.classList?.contains('smartplayer-controller-mask') || 
                    element.classList?.contains('smartplayer-fake-bar') ||
                    element.classList?.contains('smartplayer-control-bar') ||
                    element.classList?.contains('vjs-control-bar')) {
                  (element as HTMLElement).style.display = 'none'
                  ;(element as HTMLElement).style.visibility = 'hidden'
                  ;(element as HTMLElement).style.opacity = '0'
                }
                
                // Esconder controles dentro do elemento adicionado
                const controlElements = element.querySelectorAll?.('.smartplayer-controller-mask, .smartplayer-fake-bar, .smartplayer-control-bar, .vjs-control-bar')
                controlElements?.forEach((el: Element) => {
                  (el as HTMLElement).style.display = 'none'
                  ;(el as HTMLElement).style.visibility = 'hidden'
                  ;(el as HTMLElement).style.opacity = '0'
                })
              }
            })
          })
        })
        
        const playerElement = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        if (playerElement) {
          observer.observe(playerElement, { 
            childList: true, 
            subtree: true 
          })
          
          // Cleanup observer após 30 segundos
          setTimeout(() => {
            observer.disconnect()
          }, 30000)
        }
      }, 2000)
    }

    script.onerror = () => {
      console.error('Erro ao carregar script ConvertAI')
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup - remover script se necessário
      const scriptToRemove = document.getElementById('scr_6837a8d8357fd7f67137cd7c')
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove)
      }
    }
  }, [isIOS])

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

  // Para iOS: usar embed do ConvertAI
  if (isIOS) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        <div 
          id="vid_6837a8d8357fd7f67137cd7c" 
          style={{ 
            position: 'relative', 
            width: '100%', 
            height: '100%',
            paddingBottom: '0', // Removendo padding para usar toda a altura
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img 
            id="thumb_6837a8d8357fd7f67137cd7c" 
            src="https://images.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/thumbnail.jpg" 
            style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover', 
              display: 'block' 
            }} 
            alt="thumbnail" 
          />
          <div 
            id="backdrop_6837a8d8357fd7f67137cd7c" 
            style={{
              WebkitBackdropFilter: 'blur(5px)',
              backdropFilter: 'blur(5px)',
              position: 'absolute',
              top: 0,
              height: '100%',
              width: '100%'
            }}
          />
        </div>
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

