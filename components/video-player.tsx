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
  const meetingEndTimerIdRef = useRef<number | null>(null)

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
        video.setAttribute('autoplay', 'true')
        
        // Aplicar via propriedades JavaScript também
        video.playsInline = true
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

  // Timer automático de 11 minutos para iOS
  useEffect(() => {
    if (!isIOS) {
      // Se não for iOS, limpar qualquer timer existente
      if (meetingEndTimerIdRef.current) {
        clearTimeout(meetingEndTimerIdRef.current);
        console.log('iOS: Dispositivo não é mais iOS, limpando timer de encerramento automático (11 minutos).');
        meetingEndTimerIdRef.current = null;
      }
      return;
    }

    // Configurar timer automático de 11 minutos para iOS IMEDIATAMENTE
    if (!meetingEndTimerIdRef.current) {
      console.log('iOS: Configurando timer de encerramento automático de 11 minutos (INICIANDO AGORA).');
      meetingEndTimerIdRef.current = window.setTimeout(() => {
        console.log('iOS: Timer de encerramento automático (11 minutos) expirou. Chamando onVideoEnd.');
        onVideoEnd();
        meetingEndTimerIdRef.current = null;
      }, 660000); // 11 minutos = 660000 ms
    }

    return () => {
      if (meetingEndTimerIdRef.current) {
        clearTimeout(meetingEndTimerIdRef.current);
        console.log('iOS: Timer de encerramento automático (11 minutos) limpo no cleanup.');
        meetingEndTimerIdRef.current = null;
      }
    };
  }, [isIOS, onVideoEnd]);

  // Carregar script do ConvertAI e aplicar CSS para iOS
  useEffect(() => {
    if (!isIOS) {
      return;
    }

    console.log('iOS: Iniciando setup específico do iOS (script e CSS).');

    // Aplicar CSS customizado
    const applyCustomCSS = () => {
      const existingStyle = document.getElementById('converteai-custom-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      const styleSheet = document.createElement('style');
      styleSheet.id = 'converteai-custom-style';
      styleSheet.textContent = `
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
        #vid_6837a8d8357fd7f67137cd7c .smartplayer-content { 
          display: block !important; 
          visibility: visible !important; 
          opacity: 1 !important; 
        }
        #vid_6837a8d8357fd7f67137cd7c .smartplayer-play-button, 
        #vid_6837a8d8357fd7f67137cd7c .vjs-big-play-button, 
        #vid_6837a8d8357fd7f67137cd7c .smartplayer-poster, 
        #vid_6837a8d8357fd7f67137cd7c img, 
        #vid_6837a8d8357fd7f67137cd7c .smartplayer-thumbnail { 
          pointer-events: auto !important; 
          z-index: 10 !important; 
        }
        #vid_6837a8d8357fd7f67137cd7c { 
          pointer-events: auto !important; 
        }
      `;
      document.head.appendChild(styleSheet);
      console.log('iOS: CSS personalizado aplicado.');
    };

    // Verificar se script já existe
    const existingScript = document.getElementById('scr_6837a8d8357fd7f67137cd7c');
    
    if (existingScript) {
      console.log('iOS: Script ConvertAI já existe.');
      setIsScriptLoaded(true);
      // Aplicar CSS mesmo com script existente
      applyCustomCSS();
      return;
    }

    // Aplicar CSS primeiro
    applyCustomCSS();

    // Carregar script
    const script = document.createElement('script');
    script.id = 'scr_6837a8d8357fd7f67137cd7c';
    script.src = 'https://scripts.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/player.js';
    script.async = true;

    script.onload = () => {
      console.log('iOS: Script ConvertAI carregado.');
      setIsScriptLoaded(true);
    };

    script.onerror = (error) => {
      console.error('iOS: Erro ao carregar script ConvertAI:', error);
    };

    document.head.appendChild(script);

    return () => {
      console.log('iOS: Limpando useEffect principal do iOS.');
      
      // Remover script de forma segura
      const scriptToRemove = document.getElementById('scr_6837a8d8357fd7f67137cd7c');
      if (scriptToRemove && scriptToRemove.parentNode) {
        try {
          scriptToRemove.parentNode.removeChild(scriptToRemove);
          console.log('iOS: Script ConvertAI removido com sucesso.');
        } catch (error) {
          console.log('iOS: Script já foi removido ou não é filho do elemento pai.');
        }
      }
      
      // Remover estilo de forma segura
      const styleToRemove = document.getElementById('converteai-custom-style');
      if (styleToRemove && styleToRemove.parentNode) {
        try {
          styleToRemove.parentNode.removeChild(styleToRemove);
          console.log('iOS: Estilo customizado removido com sucesso.');
        } catch (error) {
          console.log('iOS: Estilo já foi removido ou não é filho do elemento pai.');
        }
      }
    };
  }, [isIOS, onVideoEnd, hasStarted]); // Dependências para o setup principal do iOS

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

  // Detectar quando o usuário sai/volta da aba/navegador
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      const isHidden = document.hidden
      console.log(`Visibilidade da página mudou: ${isHidden ? 'oculta' : 'visível'}`)
      
      if (!isHidden && hasStarted) {
        // Usuário voltou para a aba - tentar retomar reprodução
        console.log('Usuário voltou - tentando retomar reprodução do vídeo')
        
        setTimeout(() => {
          if (isIOS) {
            // Para iOS com ConvertAI player
            const player = document.querySelector('#vid_6837a8d8357fd7f67137cd7c')
            const video = player?.querySelector('video') as HTMLVideoElement
            
            if (video && video.paused) {
              console.log('iOS: Vídeo pausado detectado - tentando retomar')
              
              // Garantir propriedades antes de tentar reproduzir
              video.playsInline = true
              video.autoplay = true
              video.controls = false
              
              video.play().then(() => {
                console.log('iOS: Vídeo retomado com sucesso após voltar à aba')
              }).catch(error => {
                console.error('iOS: Erro ao retomar vídeo:', error.name)
                
                // Se falhar, tentar com muted primeiro
                if (error.name === 'NotAllowedError') {
                  video.muted = true
                  video.play().then(() => {
                    console.log('iOS: Vídeo retomado mutado como fallback')
                    // Tentar desmutar após 1 segundo se volume > 0
                    setTimeout(() => {
                      if (currentVolume > 0) {
                        video.muted = false
                        video.volume = currentVolume
                      }
                    }, 1000)
                  }).catch(console.error)
                }
              })
            }
            
            // Tentar também via API do ConvertAI
            if ((window as any).smartplayer && (window as any).smartplayer.instances) {
              const instance = (window as any).smartplayer.instances['6837a8d8357fd7f67137cd7c']
              if (instance && instance.play) {
                instance.play()
                console.log('iOS: Tentativa de retomar via ConvertAI API')
              }
            }
          } else {
            // Para outros dispositivos (HTML5 nativo)
            const videoElement = videoRef.current
            if (videoElement && videoElement.paused) {
              console.log('Navegador Web: Vídeo pausado detectado - tentando retomar')
              
              videoElement.play().then(() => {
                console.log('Navegador Web: Vídeo retomado com sucesso após voltar à aba')
              }).catch(error => {
                console.error('Navegador Web: Erro ao retomar vídeo:', error.name)
                
                // Se falhar, tentar com muted primeiro
                if (error.name === 'NotAllowedError') {
                  videoElement.muted = true
                  videoElement.play().then(() => {
                    console.log('Navegador Web: Vídeo retomado mutado como fallback')
                    // Tentar desmutar após 1 segundo se volume > 0
                    setTimeout(() => {
                      if (currentVolume > 0) {
                        videoElement.muted = false
                        videoElement.volume = currentVolume
                      }
                    }, 1000)
                  }).catch(console.error)
                }
              })
            }
          }
        }, 500) // Delay para garantir que a aba esteja totalmente ativa
      }
    }

    // Adicionar listener para mudanças de visibilidade
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Listeners adicionais para diferentes eventos de foco
    window.addEventListener('focus', () => {
      console.log('Janela ganhou foco')
      handleVisibilityChange()
    })
    
    window.addEventListener('blur', () => {
      console.log('Janela perdeu foco')
    })

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
      window.removeEventListener('blur', () => {})
    }
  }, [isIOS, hasStarted, currentVolume])

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
          ref={(el) => {
            // Garantir que o container existe quando o DOM é criado
            if (el && !el.hasAttribute('data-initialized')) {
              el.setAttribute('data-initialized', 'true');
              console.log('iOS: Container do player criado e marcado como inicializado. ID:', el.id);
            }
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

