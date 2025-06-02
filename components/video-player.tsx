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
  const [hasStarted, setHasStarted] = useState(false)

  // Detectar iOS
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )

  // Função unificada para iniciar/desmutar o vídeo
  const startVideo = () => {
    console.log('startVideo chamado, isIOS:', isIOS)
    
    if (isIOS) {
      const playerContainer = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
      const video = playerContainer?.querySelector('video') as HTMLVideoElement
      const smartPlayerContent = playerContainer?.querySelector('.smartplayer-content') as HTMLElement

      if (smartPlayerContent) {
        smartPlayerContent.style.display = 'block';
        smartPlayerContent.style.visibility = 'visible';
        smartPlayerContent.style.opacity = '1';
        console.log('iOS: Forçando visibilidade de smartplayer-content');
      }

      if (video) {
        video.muted = false; // Desmutar para reprodução com som
        video.playsInline = true; // Garantir playsInline
        video.loop = true; // Garantir loop
        video.autoplay = true; // Garantir autoplay
        video.play().then(() => {
          console.log('iOS: Vídeo iniciado e desmutado via elemento HTML (startVideo) com todas as propriedades')
          setHasStarted(true)
        }).catch((error) => {
          console.error('iOS: Erro ao iniciar/desmutar vídeo via elemento HTML (startVideo):', error)
        })
      } else {
        // Fallback: tentar via ConvertAI API se o elemento video não for encontrado imediatamente
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances['6837a8d8357fd7f67137cd7c']
          if (instance && instance.play) {
            instance.play()
            console.log('iOS: Vídeo iniciado via ConvertAI API (startVideo)')
            setHasStarted(true) // Assumir que iniciou
          }
        }
      }
    } else {
      // Para outros dispositivos (HTML5 nativo)
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.play().then(() => {
          console.log('Não-iOS: Vídeo iniciado com sucesso!')
          setHasStarted(true)
        }).catch((error) => {
          console.error('Não-iOS: Erro ao iniciar vídeo:', error)
        })
      }
    }
  }

  useImperativeHandle(ref, () => ({
    play: startVideo,
    setVolume: (vol: number) => {
      const clampedVolume = Math.max(0, Math.min(1, vol))
      setCurrentVolume(clampedVolume)
      
      if (isIOS) {
        // Para iOS com ConvertAI player
        const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        const video = player?.querySelector('video') as HTMLVideoElement
        if (video) {
          video.volume = clampedVolume
          // Garantir que as propriedades estejam sempre aplicadas
          video.playsInline = true
          video.loop = true
          video.autoplay = true
          if (clampedVolume > 0 && video.muted) {
            video.muted = false
          } else if (clampedVolume === 0 && !video.muted) {
            video.muted = true
          }
          console.log(`Volume iOS (elemento HTML) ajustado para: ${Math.round(clampedVolume * 100)}% com propriedades aplicadas`)
        }
        
        // Tentar também via API do ConvertAI se disponível
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances['6837a8d8357fd7f67137cd7c']
          if (instance && instance.setVolume) {
            instance.setVolume(clampedVolume)
            console.log(`Volume ConvertAI (API) ajustado para: ${Math.round(clampedVolume * 100)}%`)
          }
        }
      } else {
        // Para outros dispositivos (HTML5 nativo)
        const videoElement = videoRef.current
        if (videoElement) {
          videoElement.volume = clampedVolume
          if (clampedVolume > 0 && videoElement.muted) {
            videoElement.muted = false
          } else if (clampedVolume === 0 && !videoElement.muted) {
            videoElement.muted = true
          }
          console.log(`Volume não-iOS (elemento HTML) ajustado para: ${Math.round(clampedVolume * 100)}%`)
        }
      }
    },
    getVolume: () => currentVolume
  }))

  // Carregar script do ConvertAI e aplicar CSS para iOS
  useEffect(() => {
    if (!isIOS) return // Apenas para iOS

    // Função para aplicar CSS ao player ConvertAI
    const applyConvertAICss = () => {
      const mainPlayer = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
      if (mainPlayer) {
        // Adicionar log para verificar a existência do smartplayer-content
        const smartPlayerContent = mainPlayer.querySelector('.smartplayer-content')
        if (smartPlayerContent) {
          console.log('iOS: smartplayer-content encontrado no DOM.')
        } else {
          console.log('iOS: smartplayer-content NÃO encontrado no DOM.')
        }

        // Remover estilos existentes para evitar duplicação ou conflito
        let existingStyle = document.getElementById('converteai-custom-style')
        if (existingStyle) {
          existingStyle.remove()
        }

        const style = document.createElement('style')
        style.id = 'converteai-custom-style'
        style.textContent = `
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-controls-bar,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-progress-bar,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-time,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-duration,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-progress,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-controller-mask,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-fake-bar,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-control-bar,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-resume,
          #vid_6837a8d8357fd7f67137cd7c .vjs-progress-control,
          #vid_6837a8d8357fd7f67137cd7c .vjs-time-control,
          #vid_6837a8d8357fd7f67137cd7c .vjs-current-time,
          #vid_6837a8d8357fd7f67137cd7c .vjs-duration,
          #vid_6837a8d8357fd7f67137cd7c .vjs-remaining-time,
          #vid_6837a8d8357fd7f67137cd7c .vjs-control-bar {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
          /* IMPEDIR POPUP DE RESUME - força esconder com máxima prioridade */
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-resume,
          .smartplayer-resume {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            pointer-events: none !important;
            position: absolute !important;
            left: -9999px !important;
            top: -9999px !important;
            z-index: -1 !important;
          }
          /* Garantir que o conteúdo do player ConvertAI esteja sempre visível */
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-content {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
          /* O video interno do ConvertAI PODE ter pointer-events: none no overlay, mas não no CSS base */
          /* #vid_6837a8d8357fd7f67137cd7c video {
            pointer-events: none !important;
          } */
          /* O play button inicial e o poster precisam ser clicáveis para desmutar */
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-play-button,
          #vid_6837a8d8357fd7f67137cd7c .vjs-big-play-button,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-poster {
            pointer-events: auto !important;
          }
          /* O container principal do player deve ser clicável inicialmente para iOS desmutar */
          #vid_6837a8d8357fd7f67137cd7c {
            pointer-events: auto !important;
          }
        `
        document.head.appendChild(style)

        // Prevenir pause no vídeo de forma mais robusta (para o video interno do ConvertAI)
        const videoElement = mainPlayer.querySelector('video') as HTMLVideoElement
        if (videoElement) {
          let isPlaying = false
          
          videoElement.addEventListener('play', () => {
            isPlaying = true
            // Garantir que as propriedades estejam sempre aplicadas
            videoElement.playsInline = true
            videoElement.loop = true
            videoElement.autoplay = true
            console.log('iOS: Vídeo interno do ConvertAI iniciou - prevenção de pause ativada com propriedades aplicadas')
            setHasStarted(true) // Definir hasStarted aqui para garantir
          })
          
          videoElement.addEventListener('pause', (e: Event) => {
            if (isPlaying && !videoElement.ended) {
              console.log('iOS: Tentativa de pause detectada no vídeo interno - forçando play')
              e.preventDefault()
              setTimeout(() => {
                if (videoElement.paused && !videoElement.ended) {
                  videoElement.play().catch(console.error)
                }
              }, 10)
            }
          })
        }

        // RE-ADICIONANDO Observer para garantir a visibilidade do smartplayer-content
        const visibilityObserver = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
              const targetElement = mutation.target as HTMLElement;
              // Verifica se o elemento ou um de seus pais contém a classe smartplayer-content
              // ou se o elemento é o próprio mainPlayer (vid_6837a8d8357fd7f67137cd7c)
              if (targetElement.classList.contains('smartplayer-content') || targetElement.id === 'vid_6837a8d8357fd7f67137cd7c') {
                const computedStyle = window.getComputedStyle(targetElement);
                if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden' || computedStyle.opacity === '0') {
                  targetElement.style.display = 'block';
                  targetElement.style.visibility = 'visible';
                  targetElement.style.opacity = '1';
                  console.log('iOS: smartplayer-content ou player principal forçado a ser visível via MutationObserver');
                }
              }
              
              // IMPEDIR POPUP DE RESUME - forçar esconder se aparecer
              if (targetElement.classList.contains('smartplayer-resume')) {
                targetElement.style.display = 'none';
                targetElement.style.visibility = 'hidden';
                targetElement.style.opacity = '0';
                targetElement.style.pointerEvents = 'none';
                targetElement.style.position = 'absolute';
                targetElement.style.left = '-9999px';
                targetElement.style.top = '-9999px';
                targetElement.style.zIndex = '-1';
                console.log('iOS: Popup de resume forçadamente escondido via MutationObserver');
              }
            }
          })
        })
        
        const observerTarget = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        if (observerTarget) {
          visibilityObserver.observe(observerTarget, { 
            attributes: true, 
            subtree: true, 
            attributeFilter: ['style', 'class'] 
          })
          // Cleanup observer após um tempo
          setTimeout(() => {
            visibilityObserver.disconnect()
            console.log('iOS: Observer de visibilidade desconectado.')
          }, 60000) // Desconecta após 60 segundos
        }
      }
    }

    // Verificar se o script já existe
    const existingScript = document.getElementById('scr_6837a8d8357fd7f67137cd7c')
    if (existingScript) {
      setIsScriptLoaded(true)
      applyConvertAICss() // Tentar aplicar CSS novamente em caso de FCR
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
      
      applyConvertAICss() // Aplicar CSS após o script carregar
      
      // Tentar iniciar o vídeo mutado com todas as propriedades para iPhone
      setTimeout(() => {
        const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        const video = player?.querySelector('video') as HTMLVideoElement
        if (video) {
          // Aplicar todas as propriedades necessárias para iPhone
          video.muted = true // Garantir que esteja mutado para autoplay
          video.playsInline = true // Garantir playsInline
          video.loop = true // Garantir loop
          video.autoplay = true // Garantir autoplay
          
          // Tentar iniciar o vídeo
          video.play().then(() => {
            console.log('iOS: Vídeo iniciado (autoplay muted) via ConvertAI script load com playsInline, muted, loop')
            // setHasStarted será definido pelo listener de 'play'
          }).catch(error => {
            console.error('iOS: Erro ao tentar autoplay muted via ConvertAI script load:', error)
          })
        } else {
          console.log('iOS: Vídeo interno do ConvertAI NÃO encontrado após 1 segundo do script load.')
        }
      }, 1000) // Pequeno delay para garantir que o player esteja totalmente inicializado
    }

    script.onerror = () => {
      console.error('Erro ao carregar script ConvertAI')
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup - remover script e style tag se necessário
      const scriptToRemove = document.getElementById('scr_6837a8d8357fd7f67137cd7c')
      if (scriptToRemove) {
        document.head.removeChild(scriptToRemove)
        console.log('ConvertAI script removido do DOM.')
      }
      const styleToRemove = document.getElementById('converteai-custom-style')
      if (styleToRemove) {
        document.head.removeChild(styleToRemove)
        console.log('ConvertAI custom style removido do DOM.')
      }
    }
  }, [isIOS]); // Dependência apenas em isIOS

  // Debug dos estados
  useEffect(() => {
    console.log('Estados atuais:', {
      isIOS,
      isScriptLoaded,
      hasStarted,
      currentVolume
    })
  }, [isIOS, isScriptLoaded, hasStarted, currentVolume])

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
      
      if (isIOS) {
        // Para iOS com ConvertAI player
        const syncPlayer = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        const syncVideo = syncPlayer?.querySelector('video') as HTMLVideoElement
        if (syncVideo) {
          syncVideo.volume = volume
          // Garantir que as propriedades estejam sempre aplicadas
          syncVideo.playsInline = true
          syncVideo.loop = true
          syncVideo.autoplay = true
          if (volume > 0 && syncVideo.muted) {
            syncVideo.muted = false
          } else if (volume === 0 && !syncVideo.muted) {
            syncVideo.muted = true
          }
          console.log(`Volume iOS (elemento HTML) sincronizado para: ${Math.round(volume * 100)}% com propriedades aplicadas`)
        }
        
        // Tentar também via API do ConvertAI se disponível
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances['6837a8d8357fd7f67137cd7c']
          if (instance && instance.setVolume) {
            instance.setVolume(volume)
            console.log(`Volume ConvertAI (API) sincronizado para: ${Math.round(volume * 100)}%`)
          }
        }
      } else {
        // Para outros dispositivos
        const videoElement = videoRef.current
        if (videoElement) {
          videoElement.volume = volume
          if (volume > 0 && videoElement.muted) {
            videoElement.muted = false
          } else if (volume === 0 && !videoElement.muted) {
            videoElement.muted = true
          }
        }
        console.log(`Volume não-iOS (elemento HTML) sincronizado para: ${Math.round(volume * 100)}%`)
      }
    }
  }, [volume, currentVolume, isIOS])

  // Prevenir teclas que podem pausar o vídeo (para o ConvertAI player, que é um embed)
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

  // Lógica de `ended` (para ambos os players, mais genérica)
  useEffect(() => {
    const handleVideoEnded = () => {
      if (!isEnded) {
        onVideoEnd()
      }
    }

    if (isIOS) {
      // Para ConvertAI, adiciona listener ao elemento video interno
      const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
      const video = player?.querySelector('video') as HTMLVideoElement
      if (video) {
        video.addEventListener("ended", handleVideoEnded)
      }
      return () => {
        if (video) {
          video.removeEventListener("ended", handleVideoEnded)
        }
      }
    } else {
      // Para HTML5 nativo
      const videoElement = videoRef.current
      if (videoElement) {
        videoElement.addEventListener("ended", handleVideoEnded)
      }
      return () => {
        if (videoElement) {
          videoElement.removeEventListener("ended", handleVideoEnded)
        }
      }
    }
  }, [onVideoEnd, isEnded, isIOS])

  // Renderização para iOS (ConvertAI player)
  if (isIOS) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        <div 
          id="vid_6837a8d8357fd7f67137cd7c" 
          style={{ 
            position: 'relative', 
            width: '100%', 
            padding: '66.66666666666666% 0 0' // Reintroduzir o padding para o aspecto de vídeo
          }}
        >
          {/* Thumbnail e backdrop do ConvertAI (importante para o player) */}
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
          
          {/* Overlay PERMANENTE para impedir pause do vídeo */}
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
              // Se o vídeo ainda não iniciou, tentar iniciar/desmutar
              if (!hasStarted) {
                console.log('iOS: Clique no overlay - tentando iniciar vídeo')
                startVideo()
              } else {
                console.log('iOS: Clique no overlay bloqueado - vídeo não pode ser pausado')
              }
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
        </div>
        {/* O script é carregado via useEffect, não inline aqui */}
      </div>
    )
  }

  // Para outros dispositivos: autoplay normal (HTML5 nativo)
  return (
    <div className="relative h-full w-full bg-gray-900">
      <video
        ref={videoRef}
        className="h-full w-full object-contain"
        src={videoUrl}
        autoPlay
        playsInline
        muted={false} // Para não-iOS, pode iniciar mutado ou não, dependendo da necessidade
        loop // Adicionar loop para não-iOS também
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        preload="auto"
        onPlay={() => { // Adicionar onPlay para non-iOS para setar hasStarted
          console.log('Não-iOS: Vídeo iniciou.')
          setHasStarted(true)
        }}
        onEnded={() => { // Manter onEnded para non-iOS
          if (!isEnded) {
            onVideoEnd()
          }
        }}
      />
      {/* Overlay PERMANENTE para impedir pause do vídeo (para non-iOS) */}
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
          // Se o vídeo ainda não iniciou, tentar iniciar
          if (!hasStarted) {
            console.log('Não-iOS: Clique no overlay - tentando iniciar vídeo')
            startVideo()
          } else {
            console.log('Não-iOS: Clique no overlay bloqueado - vídeo não pode ser pausado')
          }
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
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer

