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

  // Detectar iOS NATIVO (não navegador web desktop)
  const isIOS = typeof window !== 'undefined' && (
    (/iPad|iPhone|iPod/.test(navigator.userAgent) && 'ontouchstart' in window) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 && 'ontouchstart' in window)
  ) && !window.navigator.userAgent.includes('Chrome') && !window.navigator.userAgent.includes('Firefox')

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
        console.log('iOS: Configurando vídeo para reprodução com som')
        
        // Configurar propriedades via atributos HTML (mais confiável no iPhone)
        video.setAttribute('playsinline', 'true')
        video.setAttribute('loop', 'true')
        video.setAttribute('autoplay', 'true')
        
        // Aplicar via propriedades JavaScript também
        video.playsInline = true
        video.loop = true
        video.autoplay = true
        video.controls = false
        
        // Desmutar para reprodução com som (após interação do usuário)
        video.muted = false
        video.removeAttribute('muted')
        
        video.play().then(() => {
          console.log('iOS: Vídeo iniciado e desmutado via elemento HTML (startVideo) com todas as propriedades')
          setHasStarted(true)
        }).catch((error) => {
          console.error('iOS: Erro ao iniciar/desmutar vídeo via elemento HTML (startVideo):', error)
          // Se falhar, tentar com muted primeiro
          video.muted = true
          video.play().then(() => {
            console.log('iOS: Vídeo iniciado mutado como fallback')
            setHasStarted(true)
          }).catch(fallbackError => {
            console.error('iOS: Erro no fallback mutado:', fallbackError)
          })
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
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-controller,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-icons,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-icons-left,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-icons-right,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-play-icon,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-icon,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-info-panel,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-menu,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-notice,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-mobile-play,
            #vid_6837a8d8357fd7f67137cd7c .smartplayer-offline-content,
            #vid_6837a8d8357fd7f67137cd7c .vjs-progress-control,
            #vid_6837a8d8357fd7f67137cd7c .vjs-time-control,
            #vid_6837a8d8357fd7f67137cd7c .vjs-current-time,
            #vid_6837a8d8357fd7f67137cd7c .vjs-duration,
            #vid_6837a8d8357fd7f67137cd7c .vjs-remaining-time,
            #vid_6837a8d8357fd7f67137cd7c .vjs-control-bar {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
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
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-poster,
          #vid_6837a8d8357fd7f67137cd7c img,
          #vid_6837a8d8357fd7f67137cd7c .smartplayer-thumbnail {
            pointer-events: auto !important;
            z-index: 10 !important;
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
          
          // Listener para quando o vídeo estiver pronto para reproduzir
          videoElement.addEventListener('loadeddata', () => {
            console.log('iOS: Vídeo carregado - tentando autoplay')
            if (!hasStarted) {
              videoElement.setAttribute('webkit-playsinline', 'true')
              videoElement.setAttribute('playsinline', 'true')
              videoElement.setAttribute('muted', 'true')
              videoElement.setAttribute('autoplay', 'true')
              videoElement.setAttribute('loop', 'true')
              
              videoElement.playsInline = true
              videoElement.muted = true
              videoElement.autoplay = true
              videoElement.loop = true
              videoElement.controls = false
              
              videoElement.play().catch(error => {
                console.log('iOS: Autoplay falhou em loadeddata:', error.name)
              })
            }
          })
          
          // Listener para quando o vídeo pode começar a reproduzir
          videoElement.addEventListener('canplay', () => {
            console.log('iOS: Vídeo pode reproduzir - tentando autoplay')
            if (!hasStarted) {
              videoElement.play().catch(error => {
                console.log('iOS: Autoplay falhou em canplay:', error.name)
              })
            }
          })
          
          videoElement.addEventListener('play', () => {
            isPlaying = true
            // Garantir que as propriedades estejam sempre aplicadas via atributos e propriedades
            videoElement.setAttribute('playsinline', 'true')
            videoElement.setAttribute('loop', 'true')
            videoElement.setAttribute('autoplay', 'true')
            
            videoElement.playsInline = true
            videoElement.loop = true
            videoElement.autoplay = true
            videoElement.controls = false
            
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
              
              // ESCONDER CONTROLES DO PLAYER - forçar esconder se aparecerem
              const controlClasses = [
                'smartplayer-controller',
                'smartplayer-icons',
                'smartplayer-icons-left', 
                'smartplayer-icons-right',
                'smartplayer-play-icon',
                'smartplayer-icon',
                'smartplayer-info-panel',
                'smartplayer-menu',
                'smartplayer-notice',
                'smartplayer-mobile-play',
                'smartplayer-offline-content',
                'smartplayer-controller-mask',
                'smartplayer-fake-bar'
              ];
              
              if (controlClasses.some(className => targetElement.classList.contains(className))) {
                targetElement.style.display = 'none';
                targetElement.style.visibility = 'hidden';
                targetElement.style.opacity = '0';
                targetElement.style.pointerEvents = 'none';
                console.log('iOS: Controle do player escondido via MutationObserver:', targetElement.className);
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
      
      // Esconder controles imediatamente após carregar
      setTimeout(() => {
        const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        if (player) {
          const controlSelectors = [
            '.smartplayer-controller',
            '.smartplayer-icons',
            '.smartplayer-icons-left', 
            '.smartplayer-icons-right',
            '.smartplayer-play-icon',
            '.smartplayer-icon',
            '.smartplayer-info-panel',
            '.smartplayer-menu',
            '.smartplayer-notice',
            '.smartplayer-mobile-play',
            '.smartplayer-offline-content',
            '.smartplayer-controller-mask',
            '.smartplayer-fake-bar'
          ]
          
          controlSelectors.forEach(selector => {
            const elements = player.querySelectorAll(selector)
            elements.forEach(element => {
              const el = element as HTMLElement
              el.style.display = 'none'
              el.style.visibility = 'hidden'
              el.style.opacity = '0'
              el.style.pointerEvents = 'none'
            })
          })
          console.log('iOS: Controles escondidos imediatamente após carregamento')
        }
      }, 100)
      
      // Estratégia robusta para autoplay no iPhone
      const tryAutoplay = (attempt = 1, maxAttempts = 10) => {
        setTimeout(() => {
          const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
          const video = player?.querySelector('video') as HTMLVideoElement
          
          if (video) {
            console.log(`iOS: Tentativa ${attempt} de autoplay - readyState: ${video.readyState}`)
            
            // Forçar configuração mais agressiva
            video.setAttribute('webkit-playsinline', 'true')
            video.setAttribute('playsinline', 'true')
            video.setAttribute('muted', 'true')
            video.setAttribute('autoplay', 'true')
            video.setAttribute('loop', 'true')
            video.setAttribute('preload', 'auto')
            
            // Propriedades JavaScript
            video.playsInline = true
            video.muted = true
            video.autoplay = true
            video.loop = true
            video.controls = false
            video.preload = 'auto'
            
            // Verificar se o vídeo já está tocando
            if (!video.paused && video.currentTime > 0) {
              console.log(`iOS: Vídeo já está tocando na tentativa ${attempt}`)
              setHasStarted(true)
              return
            }
            
            // Tentar reproduzir de forma mais agressiva
            const playPromise = video.play()
            
            if (playPromise !== undefined) {
              playPromise.then(() => {
                console.log(`iOS: Autoplay bem-sucedido na tentativa ${attempt}`)
                setHasStarted(true)
              }).catch(error => {
                console.error(`iOS: Erro no autoplay tentativa ${attempt}:`, error.name, error.message)
                
                // Estratégias específicas baseadas no tipo de erro
                if (error.name === 'NotAllowedError') {
                  console.log('iOS: NotAllowedError - aguardando interação do usuário')
                } else if (error.name === 'AbortError') {
                  console.log('iOS: AbortError - tentando novamente imediatamente')
                  if (attempt < maxAttempts) {
                    tryAutoplay(attempt + 1, maxAttempts)
                  }
                } else {
                  // Para outros erros, continuar tentando
                  if (attempt < maxAttempts) {
                    console.log(`iOS: Tentando autoplay novamente em 300ms (tentativa ${attempt + 1})`)
                    tryAutoplay(attempt + 1, maxAttempts)
                  } else {
                    console.log('iOS: Todas as tentativas de autoplay falharam - aguardando interação do usuário')
                  }
                }
              })
            } else {
              console.log(`iOS: play() não retornou Promise na tentativa ${attempt}`)
              if (attempt < maxAttempts) {
                tryAutoplay(attempt + 1, maxAttempts)
              }
            }
          } else {
            console.log(`iOS: Vídeo não encontrado na tentativa ${attempt}`)
            if (attempt < maxAttempts) {
              tryAutoplay(attempt + 1, maxAttempts)
            }
          }
        }, attempt === 1 ? 500 : 300) // Delays menores para mais agressividade
      }
      
      // Iniciar tentativas de autoplay
      tryAutoplay()
      
      // Polling adicional para verificar se o vídeo iniciou
      const checkVideoStatus = setInterval(() => {
        const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
        const video = player?.querySelector('video') as HTMLVideoElement
        
        if (video && !video.paused && video.currentTime > 0 && !hasStarted) {
          console.log('iOS: Vídeo detectado como tocando via polling')
          setHasStarted(true)
          clearInterval(checkVideoStatus)
        }
      }, 500)
      
      // Limpar polling após 30 segundos
      setTimeout(() => {
        clearInterval(checkVideoStatus)
      }, 30000)
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
      currentVolume,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      platform: typeof window !== 'undefined' ? navigator.platform : 'SSR',
      hasTouch: typeof window !== 'undefined' ? 'ontouchstart' in window : false
    })
  }, [isIOS, isScriptLoaded, hasStarted, currentVolume])

  // Detectar primeira interação do usuário para forçar autoplay no iPhone
  useEffect(() => {
    if (!isIOS) return

    const handleFirstInteraction = () => {
      console.log('iOS: Primeira interação detectada - tentando forçar autoplay IMEDIATAMENTE')
      
      const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
      const video = player?.querySelector('video') as HTMLVideoElement
      
      if (video) {
        // Configuração mais agressiva para autoplay mutado após interação
        video.setAttribute('webkit-playsinline', 'true')
        video.setAttribute('playsinline', 'true')
        video.setAttribute('muted', 'true')
        video.setAttribute('autoplay', 'true')
        video.setAttribute('loop', 'true')
        video.setAttribute('preload', 'auto')
        
        video.playsInline = true
        video.muted = true
        video.autoplay = true
        video.loop = true
        video.controls = false
        video.preload = 'auto'
        
        // Tentar múltiplas vezes rapidamente após interação
        let attempts = 0
        const maxAttempts = 3
        
        const tryPlayAfterInteraction = () => {
          attempts++
          console.log(`iOS: Tentativa ${attempts} de autoplay após interação`)
          
          video.play().then(() => {
            console.log('iOS: Autoplay forçado com sucesso após primeira interação')
            setHasStarted(true)
            // Remove os listeners após sucesso
            document.removeEventListener('touchstart', handleFirstInteraction)
            document.removeEventListener('click', handleFirstInteraction)
            document.removeEventListener('touchend', handleFirstInteraction)
            document.removeEventListener('mousedown', handleFirstInteraction)
          }).catch(error => {
            console.error(`iOS: Erro ao forçar autoplay após interação (tentativa ${attempts}):`, error.name, error.message)
            
            if (attempts < maxAttempts) {
              setTimeout(tryPlayAfterInteraction, 100)
            }
          })
        }
        
        // Iniciar tentativas imediatamente
        tryPlayAfterInteraction()
      }
    }

    // Adicionar listeners para QUALQUER tipo de interação
    const events = ['touchstart', 'touchend', 'click', 'mousedown']
    events.forEach(event => {
      document.addEventListener(event, handleFirstInteraction, { once: true, passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleFirstInteraction)
      })
    }
  }, [isIOS])

  // Para dispositivos não-iOS (navegadores web), iniciar automaticamente
  useEffect(() => {
    if (!isIOS && !hasStarted) {
      console.log('Navegador Web: Tentando autoplay após 500ms')
      const timer = setTimeout(() => {
        const videoElement = videoRef.current
        if (videoElement) {
          console.log('Navegador Web: Elemento de vídeo encontrado, tentando autoplay')
          
          // Estratégia agressiva para navegadores web
          videoElement.muted = true // Começar mutado para garantir autoplay
          videoElement.autoplay = true
          videoElement.playsInline = true
          videoElement.loop = true
          
          const playPromise = videoElement.play()
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('Navegador Web: Autoplay bem-sucedido (mutado)')
              setHasStarted(true)
              
              // Tentar desmutar após 1 segundo se o volume for > 0
              setTimeout(() => {
                if (currentVolume > 0) {
                  videoElement.muted = false
                  videoElement.volume = currentVolume
                  console.log('Navegador Web: Vídeo desmutado automaticamente')
                }
              }, 1000)
            }).catch(error => {
              console.error('Navegador Web: Erro no autoplay:', error.name, error.message)
              
              // Fallback: aguardar interação do usuário
              const handleUserInteraction = () => {
                console.log('Navegador Web: Interação detectada - tentando reproduzir')
                videoElement.play().then(() => {
                  setHasStarted(true)
                  if (currentVolume > 0) {
                    videoElement.muted = false
                    videoElement.volume = currentVolume
                  }
                }).catch(console.error)
                
                // Remover listeners após sucesso
                document.removeEventListener('click', handleUserInteraction)
                document.removeEventListener('keydown', handleUserInteraction)
                document.removeEventListener('touchstart', handleUserInteraction)
              }
              
              document.addEventListener('click', handleUserInteraction, { once: true })
              document.addEventListener('keydown', handleUserInteraction, { once: true })
              document.addEventListener('touchstart', handleUserInteraction, { once: true })
            })
          }
        } else {
          console.error('Navegador Web: Elemento de vídeo não encontrado')
        }
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [isIOS, hasStarted, currentVolume])

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

  // Prevenir teclas e ações que podem pausar o vídeo
  useEffect(() => {
    if (!hasStarted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevenir teclas que podem pausar/controlar o vídeo
      const blockedKeys = [
        'Space', ' ',           // Espaço (play/pause)
        'ArrowLeft',           // Seta esquerda (retroceder)
        'ArrowRight',          // Seta direita (avançar)
        'ArrowUp',             // Seta cima (volume)
        'ArrowDown',           // Seta baixo (volume)
        'KeyK',                // K (play/pause)
        'KeyJ',                // J (retroceder 10s)
        'KeyL',                // L (avançar 10s)
        'KeyM',                // M (mute)
        'KeyF',                // F (fullscreen)
        'Escape',              // ESC (sair fullscreen)
        'Home',                // Home (início)
        'End'                  // End (fim)
      ]
      
      if (blockedKeys.includes(e.code) || blockedKeys.includes(e.key)) {
        e.preventDefault()
        e.stopPropagation()
        console.log(`Navegador Web: Tecla ${e.code || e.key} bloqueada`)
      }
    }

    // Prevenir pause via eventos do vídeo
    const videoElement = videoRef.current
    if (videoElement && !isIOS) {
      const handlePause = (e: Event) => {
        e.preventDefault()
        console.log('Navegador Web: Tentativa de pause detectada - forçando play')
        setTimeout(() => {
          if (videoElement.paused && !videoElement.ended) {
            videoElement.play().catch(console.error)
          }
        }, 10)
      }

      const handleSeeking = (e: Event) => {
        e.preventDefault()
        console.log('Navegador Web: Tentativa de seek bloqueada')
      }

      videoElement.addEventListener('pause', handlePause)
      videoElement.addEventListener('seeking', handleSeeking)
      
      // Cleanup para eventos do vídeo
      const cleanupVideo = () => {
        videoElement.removeEventListener('pause', handlePause)
        videoElement.removeEventListener('seeking', handleSeeking)
      }

      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        cleanupVideo()
      }
    } else {
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [hasStarted, isIOS])

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
          {/* Deixar vazio para o ConvertAI criar seus próprios elementos */}
          
          {/* Overlay CONDICIONAL para impedir pause do vídeo - só aparece APÓS o vídeo iniciar */}
          {hasStarted && (
            <div 
              className="video-overlay absolute inset-0"
              style={{ 
                zIndex: 15, 
                pointerEvents: 'auto',
                background: 'transparent',
                touchAction: 'none'
                // Para iOS, cobrir toda a área incluindo botões (sem bottom)
                // Para outros dispositivos, o overlay é diferente
              }}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('iOS: Clique no overlay bloqueado - vídeo não pode ser pausado')
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
              onContextMenu={(e) => {
                e.preventDefault()
                e.stopPropagation()
                console.log('iOS: Menu de contexto bloqueado')
              }}
              onDragStart={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onDrop={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            />
          )}
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
        muted={true} // Começar mutado para garantir autoplay em navegadores
        loop
        controls={false}
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        preload="auto"
        onPlay={() => {
          console.log('Navegador Web: Vídeo iniciou via evento onPlay')
          setHasStarted(true)
        }}
        onLoadedData={() => {
          console.log('Navegador Web: Dados do vídeo carregados')
          const videoElement = videoRef.current
          if (videoElement && !hasStarted) {
            videoElement.play().catch(error => {
              console.log('Navegador Web: Autoplay falhou em onLoadedData:', error.name)
            })
          }
        }}
        onCanPlay={() => {
          console.log('Navegador Web: Vídeo pode reproduzir')
          const videoElement = videoRef.current
          if (videoElement && !hasStarted) {
            videoElement.play().catch(error => {
              console.log('Navegador Web: Autoplay falhou em onCanPlay:', error.name)
            })
          }
        }}
        onEnded={() => {
          if (!isEnded) {
            onVideoEnd()
          }
        }}
      />
      {/* Overlay CONDICIONAL para impedir pause do vídeo (para navegadores web) - só aparece APÓS o vídeo iniciar */}
      {hasStarted && (
        <div 
          className="video-overlay absolute inset-0"
          style={{ 
            zIndex: 10, 
            pointerEvents: 'auto',
            background: 'transparent',
            touchAction: 'none',
            // Excluir a área dos botões na parte inferior
            bottom: '100px' // Deixar espaço para os botões de controle
          }}
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Navegador Web: Clique no overlay bloqueado - vídeo não pode ser pausado')
          }}
          onTouchStart={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchEnd={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onTouchMove={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onMouseUp={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDoubleClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Navegador Web: Duplo clique bloqueado - sem fullscreen')
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
            console.log('Navegador Web: Menu de contexto bloqueado')
          }}
          onDragStart={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onDrop={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        />
      )}
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer

