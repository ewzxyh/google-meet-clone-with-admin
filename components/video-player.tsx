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
      if (isIOS) {
        // Para iOS com ConvertAI player
        const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        const video = player?.querySelector('video') as HTMLVideoElement
        if (video) {
          video.play()
        }
      } else {
        // Para outros dispositivos
        const videoElement = videoRef.current
        if (videoElement) {
          videoElement.play()
        }
      }
    },
    setVolume: (vol: number) => {
      const clampedVolume = Math.max(0, Math.min(1, vol))
      setCurrentVolume(clampedVolume)
      
      if (isIOS) {
        // Para iOS com ConvertAI player
        const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        const video = player?.querySelector('video') as HTMLVideoElement
        if (video) {
          video.volume = clampedVolume
          console.log(`Volume iOS ajustado para: ${Math.round(clampedVolume * 100)}%`)
        }
        
        // Tentar também via API do ConvertAI se disponível
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances['6837a8d8357fd7f67137cd7c']
          if (instance && instance.setVolume) {
            instance.setVolume(clampedVolume)
            console.log(`Volume ConvertAI ajustado para: ${Math.round(clampedVolume * 100)}%`)
          }
        }
      } else {
        // Para outros dispositivos
        const videoElement = videoRef.current
        if (videoElement) {
          videoElement.volume = clampedVolume
        }
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
        const mainPlayer = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        
        if (mainPlayer) {
          // Aplicar volume inicial quando o player carrega
          const videoElement = mainPlayer.querySelector('video') as HTMLVideoElement
          if (videoElement) {
            videoElement.volume = currentVolume
            console.log(`Volume inicial iOS aplicado: ${Math.round(currentVolume * 100)}%`)
          }
          
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
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-control-bar,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-resume {
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
          
          // Função para automaticamente continuar vídeo sem mostrar popup
          const autoResumeVideo = () => {
            // Tentar via API do ConvertAI
            if ((window as any).smartplayer && (window as any).smartplayer.instances) {
              const instance = (window as any).smartplayer.instances['6837a8d8357fd7f67137cd7c']
              if (instance) {
                // Desabilitar popup de resume se possível
                if (instance.setResumeMode) {
                  instance.setResumeMode(false)
                }
                // Continuar reprodução automaticamente
                if (instance.play) {
                  instance.play()
                  console.log('Vídeo continuado automaticamente via ConvertAI API')
                }
              }
            }
            
            // Fallback: tentar via elemento de vídeo direto
            const videoElement = mainPlayer.querySelector('video') as HTMLVideoElement
            if (videoElement && videoElement.paused) {
              videoElement.play().catch(console.error)
              console.log('Vídeo continuado automaticamente via elemento HTML')
            }
          }
          
          // Executar auto-resume após um delay
          setTimeout(autoResumeVideo, 1500)
          
          // Prevenir pause no vídeo de forma mais robusta
          if (videoElement) {
            let isPlaying = false
            
            // Listener para detectar quando vídeo começa
            videoElement.addEventListener('play', () => {
              isPlaying = true
              console.log('Vídeo iniciado - prevenção de pause ativada')
            })
            
            // Prevenir pause
            videoElement.addEventListener('pause', (e: Event) => {
              if (isPlaying && !videoElement.ended) {
                console.log('Tentativa de pause detectada - forçando play')
                e.preventDefault()
                setTimeout(() => {
                  if (videoElement.paused && !videoElement.ended) {
                    videoElement.play().catch(console.error)
                  }
                }, 10)
              }
            })
            
            // Prevenir cliques diretos no vídeo
            videoElement.addEventListener('click', (e: Event) => {
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
                    element.classList?.contains('vjs-control-bar') ||
                    element.classList?.contains('smartplayer-resume')) {
                  (element as HTMLElement).style.display = 'none'
                  ;(element as HTMLElement).style.visibility = 'hidden'
                  ;(element as HTMLElement).style.opacity = '0'
                  console.log('Elemento de controle escondido:', element.className)
                }
                
                // Esconder controles dentro do elemento adicionado
                const controlElements = element.querySelectorAll?.('.smartplayer-controller-mask, .smartplayer-fake-bar, .smartplayer-control-bar, .vjs-control-bar, .smartplayer-resume')
                controlElements?.forEach((el: Element) => {
                  (el as HTMLElement).style.display = 'none'
                  ;(el as HTMLElement).style.visibility = 'hidden'
                  ;(el as HTMLElement).style.opacity = '0'
                  console.log('Controle interno escondido:', el.className)
                })
                
                // Se for especificamente o popup de resume, tentar continuar automaticamente
                if (element.classList?.contains('smartplayer-resume')) {
                  console.log('Popup de resume detectado - continuando automaticamente')
                  setTimeout(() => {
                    // Tentar clicar no botão de continuar automaticamente
                    const continueButton = element.querySelector('.smartplayer-resume__play')
                    if (continueButton) {
                      (continueButton as HTMLElement).click()
                      console.log('Botão continuar clicado automaticamente')
                    }
                  }, 100)
                }
              }
            })
          })
        })
        
        const observerTarget = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        if (observerTarget) {
          observer.observe(observerTarget, { 
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

  // Sincronizar volume quando prop volume mudar
  useEffect(() => {
    if (volume !== currentVolume) {
      setCurrentVolume(volume)
      
      if (isIOS) {
        // Para iOS com ConvertAI player
        const syncPlayer = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        const syncVideo = syncPlayer?.querySelector('video') as HTMLVideoElement
        if (syncVideo) {
          syncVideo.volume = volume
          console.log(`Volume iOS sincronizado para: ${Math.round(volume * 100)}%`)
        }
        
        // Tentar também via API do ConvertAI se disponível
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances['6837a8d8357fd7f67137cd7c']
          if (instance && instance.setVolume) {
            instance.setVolume(volume)
            console.log(`Volume ConvertAI sincronizado para: ${Math.round(volume * 100)}%`)
          }
        }
      } else {
        // Para outros dispositivos
        const videoElement = videoRef.current
        if (videoElement) {
          videoElement.volume = volume
        }
      }
    }
  }, [volume, currentVolume, isIOS])

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

