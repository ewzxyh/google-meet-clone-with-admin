"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useMemo } from "react"

interface VideoPlayerProps {
  divId: string
  thumbId: string
  imageUrl: string
  scriptUrl: string
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
  divId,
  thumbId,
  imageUrl,
  scriptUrl,
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

  const { playerId, scriptId } = useMemo(() => {
    if (!divId) {
      return { playerId: null, scriptId: null };
    }
    try {
      // Ex: divId "vid_xxxxxxxx" extrai "xxxxxxxx"
      const id = divId.replace('vid_', '');
      if (!id) throw new Error("Player ID não pôde ser extraído do divId");
      
      return {
        playerId: id,
        scriptId: `scr_${id}`,
      };
    } catch (e) {
      console.error("Erro ao extrair Player ID do divId:", divId, e);
      return { playerId: null, scriptId: null };
    }
  }, [divId]);

  // Usar ConvertAI player para todos os dispositivos
  const useConvertAI = true

  // Função unificada para iniciar/desmutar o vídeo
  const startVideo = () => {
    console.log('startVideo chamado, useConvertAI:', useConvertAI)
    
    if (useConvertAI) {
      const playerContainer = document.querySelector(`#${divId}`)
      const video = playerContainer?.querySelector('video') as HTMLVideoElement
      const smartPlayerContent = playerContainer?.querySelector('.smartplayer-content') as HTMLElement

      if (smartPlayerContent) {
        smartPlayerContent.style.display = 'block';
        smartPlayerContent.style.visibility = 'visible';
        smartPlayerContent.style.opacity = '1';
        console.log('iOS: Forçando visibilidade de smartplayer-content');
      }

      if (video) {
        console.log('ConvertAI: Configurando vídeo para reprodução com som')
        
        // Configurar propriedades via atributos HTML (mais confiável)
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
          console.log('ConvertAI: Vídeo iniciado e desmutado via elemento HTML (startVideo) com todas as propriedades')
          setHasStarted(true)
          // Adicionar classe para ocultar controles
          playerContainer?.classList.add('playing')
        }).catch((error) => {
          console.error('ConvertAI: Erro ao iniciar/desmutar vídeo via elemento HTML (startVideo):', error)
          // Se falhar, tentar com muted primeiro
          video.muted = true
          video.play().then(() => {
            console.log('ConvertAI: Vídeo iniciado mutado como fallback')
            setHasStarted(true)
            // Adicionar classe para ocultar controles
            playerContainer?.classList.add('playing')
          }).catch(fallbackError => {
            console.error('ConvertAI: Erro no fallback mutado:', fallbackError)
          })
        })
      } else {
        // Fallback: tentar via ConvertAI API se o elemento video não for encontrado imediatamente
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances[playerId!]
          if (instance && instance.play) {
            instance.play()
            console.log('ConvertAI: Vídeo iniciado via ConvertAI API (startVideo)')
            setHasStarted(true) // Assumir que iniciou
            // Adicionar classe para ocultar controles
            playerContainer?.classList.add('playing')
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
      
      if (useConvertAI) {
        // Para ConvertAI player
        const player = document.querySelector(`#${divId}`)
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
          console.log(`Volume ConvertAI (elemento HTML) ajustado para: ${Math.round(clampedVolume * 100)}% com propriedades aplicadas`)
        }
        
        // Tentar também via API do ConvertAI se disponível
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances[playerId!]
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

  // Timer automático de 10 minutos
  useEffect(() => {
    // Configurar timer automático de 10min IMEDIATAMENTE
    if (!meetingEndTimerIdRef.current) {
      console.log('Configurando timer de encerramento automático de 10 minutos (INICIANDO AGORA).');
      meetingEndTimerIdRef.current = window.setTimeout(() => {
        console.log('Timer de encerramento automático (10min) expirou. Chamando onVideoEnd.');
        onVideoEnd();
        meetingEndTimerIdRef.current = null;
      }, 600000); // 10 minutos = 600000 ms
    }

    return () => {
      if (meetingEndTimerIdRef.current) {
        clearTimeout(meetingEndTimerIdRef.current);
        console.log('Timer de encerramento automático (10min) limpo no cleanup.');
        meetingEndTimerIdRef.current = null;
      }
    };
  }, [onVideoEnd]);

  // Carregar script do ConvertAI e aplicar CSS
  useEffect(() => {
    if (!useConvertAI || !playerId || !divId || !scriptId || !scriptUrl) {
      return;
    }

    console.log('ConvertAI: Iniciando setup do ConvertAI (script e CSS).');

    // Aplicar CSS customizado
    const applyCustomCSS = () => {
      const existingStyle = document.getElementById('converteai-custom-style');
      if (existingStyle) {
        existingStyle.remove();
      }

      const styleSheet = document.createElement('style');
      styleSheet.id = 'converteai-custom-style';
      styleSheet.textContent = `
        /* Permitir que o container e elementos essenciais funcionem */
        #${divId} { 
          pointer-events: auto !important;
          position: relative !important;
        }
        
        /* Garantir que o botão de play seja visível e clicável */
        #${divId} .smartplayer-play-button, 
        #${divId} .vjs-big-play-button,
        #${divId} .smartplayer-poster,
        #${divId} .smartplayer-thumbnail,
        #${divId} .smartplayer-content,
        #${divId} video { 
          pointer-events: auto !important; 
          z-index: 10 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
        
        /* Ocultar apenas controles desnecessários APÓS o vídeo iniciar */
        #${divId}.playing .smartplayer-controls-bar,
        #${divId}.playing .smartplayer-progress-bar,
        #${divId}.playing .smartplayer-time,
        #${divId}.playing .smartplayer-duration,
        #${divId}.playing .smartplayer-progress,
        #${divId}.playing .smartplayer-controller-mask,
        #${divId}.playing .smartplayer-fake-bar,
        #${divId}.playing .smartplayer-control-bar,
        #${divId}.playing .smartplayer-controller,
        #${divId}.playing .smartplayer-icons,
        #${divId}.playing .smartplayer-icons-left,
        #${divId}.playing .smartplayer-icons-right,
        #${divId}.playing .smartplayer-icon,
        #${divId}.playing .smartplayer-info-panel,
        #${divId}.playing .smartplayer-menu,
        #${divId}.playing .smartplayer-notice,
        #${divId}.playing .vjs-progress-control,
        #${divId}.playing .vjs-time-control,
        #${divId}.playing .vjs-current-time,
        #${divId}.playing .vjs-duration,
        #${divId}.playing .vjs-remaining-time,
        #${divId}.playing .vjs-control-bar { 
          display: none !important; 
          visibility: hidden !important; 
          opacity: 0 !important; 
          pointer-events: none !important; 
        }
        
        /* Sempre ocultar elementos de resume */
        #${divId} .smartplayer-resume, 
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
      `;
      document.head.appendChild(styleSheet);
      console.log('ConvertAI: CSS personalizado aplicado.');
    };

    // Verificar se script já existe
    const existingScript = document.getElementById(scriptId);
    
    if (existingScript) {
      console.log('ConvertAI: Script ConvertAI já existe.');
      setIsScriptLoaded(true);
      // Aplicar CSS mesmo com script existente
      applyCustomCSS();
      return;
    }

    // Aplicar CSS primeiro
    applyCustomCSS();

    // Carregar script
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;

    script.onload = () => {
      console.log('ConvertAI: Script ConvertAI carregado.');
      setIsScriptLoaded(true);
      
      // Aguardar um pouco para o player ser inicializado e adicionar listeners
      setTimeout(() => {
        const playerElement = document.querySelector(`#${divId}`);
        const videoElement = playerElement?.querySelector('video') as HTMLVideoElement;
        
        if (videoElement) {
          console.log('ConvertAI: Adicionando listeners ao elemento de vídeo');
          
          // Listener para quando o vídeo começa a reproduzir
          const handlePlay = () => {
            console.log('ConvertAI: Vídeo iniciou (evento play)');
            setHasStarted(true);
            playerElement?.classList.add('playing');
          };
          
          // Listener para quando o vídeo é pausado
          const handlePause = () => {
            console.log('ConvertAI: Vídeo pausado (evento pause)');
          };
          
          videoElement.addEventListener('play', handlePlay);
          videoElement.addEventListener('pause', handlePause);
          
          // Detectar se o vídeo já está reproduzindo
          if (!videoElement.paused) {
            handlePlay();
          }
        }
      }, 1000);
    };

    script.onerror = (error) => {
      console.error('ConvertAI: Erro ao carregar script ConvertAI:', error);
    };

    document.head.appendChild(script);

    return () => {
      console.log('ConvertAI: Limpando useEffect principal do ConvertAI.');
      
      // Remover script de forma segura
      const scriptToRemove = document.getElementById(scriptId);
      if (scriptToRemove && scriptToRemove.parentNode) {
        try {
          scriptToRemove.parentNode.removeChild(scriptToRemove);
          console.log('ConvertAI: Script ConvertAI removido com sucesso.');
        } catch (error) {
          console.log('ConvertAI: Script já foi removido ou não é filho do elemento pai.');
        }
      }
      
      // Remover estilo de forma segura
      const styleToRemove = document.getElementById('converteai-custom-style');
      if (styleToRemove && styleToRemove.parentNode) {
        try {
          styleToRemove.parentNode.removeChild(styleToRemove);
          console.log('ConvertAI: Estilo customizado removido com sucesso.');
        } catch (error) {
          console.log('ConvertAI: Estilo já foi removido ou não é filho do elemento pai.');
        }
      }
    };
  }, [useConvertAI, onVideoEnd, hasStarted, divId, scriptId, scriptUrl, playerId]); // Dependências para o setup principal do ConvertAI

  // Debug dos estados
  useEffect(() => {
    console.log('Estados atuais:', {
      useConvertAI,
      isScriptLoaded,
      hasStarted,
      currentVolume,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      platform: typeof window !== 'undefined' ? navigator.platform : 'SSR',
      hasTouch: typeof window !== 'undefined' ? 'ontouchstart' in window : false
    })
  }, [useConvertAI, isScriptLoaded, hasStarted, currentVolume])

  // Como estamos usando ConvertAI para todos os dispositivos, removemos a lógica separada de autoplay

  // Sincronizar volume quando prop volume mudar
  useEffect(() => {
    if (volume !== currentVolume) {
      setCurrentVolume(volume)
      
      if (useConvertAI) {
        // Para ConvertAI player
        const syncPlayer = document.querySelector(`#${divId}`)
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
          console.log(`Volume ConvertAI (elemento HTML) sincronizado para: ${Math.round(volume * 100)}% com propriedades aplicadas`)
        }
        
        // Tentar também via API do ConvertAI se disponível
        if ((window as any).smartplayer && (window as any).smartplayer.instances) {
          const instance = (window as any).smartplayer.instances[playerId!]
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
        console.log(`Volume não-ConvertAI (elemento HTML) sincronizado para: ${Math.round(volume * 100)}%`)
      }
    }
  }, [volume, currentVolume, useConvertAI, divId, playerId])

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

    // Para ConvertAI, adiciona listener ao elemento video interno
    const player = document.querySelector(`#${divId}`)
    const video = player?.querySelector('video') as HTMLVideoElement
    if (video) {
      video.addEventListener("ended", handleVideoEnded)
    }
    return () => {
      if (video) {
        video.removeEventListener("ended", handleVideoEnded)
      }
    }
  }, [onVideoEnd, isEnded, divId])

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
          // Para ConvertAI player
          const player = document.querySelector(`#${divId}`)
          const video = player?.querySelector('video') as HTMLVideoElement
          
          if (video && video.paused) {
            console.log('ConvertAI: Vídeo pausado detectado - tentando retomar')
            
            // Garantir propriedades antes de tentar reproduzir
            video.playsInline = true
            video.autoplay = true
            video.controls = false
            
            video.play().then(() => {
              console.log('ConvertAI: Vídeo retomado com sucesso após voltar à aba')
            }).catch(error => {
              console.error('ConvertAI: Erro ao retomar vídeo:', error.name)
              
              // Se falhar, tentar com muted primeiro
              if (error.name === 'NotAllowedError') {
                video.muted = true
                video.play().then(() => {
                  console.log('ConvertAI: Vídeo retomado mutado como fallback')
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
            const instance = (window as any).smartplayer.instances[playerId!]
            if (instance && instance.play) {
              instance.play()
              console.log('ConvertAI: Tentativa de retomar via ConvertAI API')
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
  }, [hasStarted, currentVolume, divId, playerId])

  if (!divId || !scriptUrl || !playerId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white">
        Erro: Configuração do player de vídeo inválida. Verifique os dados no painel de administração.
      </div>
    )
  }

  // Renderização para ConvertAI player (todos os dispositivos)
  return (
    <div className="relative h-full w-full bg-gray-900">
      <div 
        id={divId} 
        style={{ 
          position: 'relative', 
          width: '100%', 
          padding: '66.66666666666666% 0 0'
        }}
        ref={(el) => {
          // Garantir que o container existe quando o DOM é criado
          if (el && !el.hasAttribute('data-initialized')) {
            el.setAttribute('data-initialized', 'true');
            console.log('ConvertAI: Container do player criado e marcado como inicializado. ID:', el.id);
          }
        }}
      >
        {!hasStarted && (
          <>
            <img 
              id={thumbId}
              src={imageUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
              alt="thumbnail" 
            />
            <div 
              id={`backdrop_${playerId}`} 
              style={{ WebkitBackdropFilter: 'blur(5px)', backdropFilter: 'blur(5px)', position: 'absolute', top: 0, height: '100%', width: '100%' }}
            ></div>
          </>
        )}
        
        {/* Overlay CONDICIONAL para impedir pause do vídeo - só aparece APÓS o vídeo iniciar e deixa o play button acessível */}
        {hasStarted && (
          <div 
            className="video-overlay absolute"
            style={{ 
              top: '60px', // Deixar espaço para o botão de play no topo
              left: 0,
              right: 0,
              bottom: '60px', // Deixar espaço para controles na parte inferior
              zIndex: 15, 
              pointerEvents: 'auto',
              background: 'transparent',
              touchAction: 'none'
            }}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('ConvertAI: Clique no overlay bloqueado - vídeo não pode ser pausado')
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
              console.log('ConvertAI: Menu de contexto bloqueado')
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
    </div>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer

