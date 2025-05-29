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
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [currentVolume, setCurrentVolume] = useState(volume)

  // Detectar iOS
  const isIOS = typeof window !== 'undefined' && (
    /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )

  // URL do iframe para iOS
  const iframeUrl = "https://scripts.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/embed.html"

  useImperativeHandle(ref, () => ({
    play: () => {
      if (isIOS) {
        // Para iOS com iframe, não precisamos controlar manualmente
        console.log('iOS iframe - play controlado pelo player')
      } else {
        const videoElement = videoRef.current
        if (videoElement) {
          videoElement.play()
        }
      }
    },
    setVolume: (vol: number) => {
      const clampedVolume = Math.max(0, Math.min(1, vol))
      setCurrentVolume(clampedVolume)
      
      if (!isIOS) {
        const videoElement = videoRef.current
        if (videoElement) {
          videoElement.volume = clampedVolume
        }
      }
    },
    getVolume: () => currentVolume
  }))

  // Adicionar preloads para iOS
  useEffect(() => {
    if (!isIOS) return

    const links = [
      { rel: 'prerender', href: 'https://scripts.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/embed.html' },
      { rel: 'preload', href: 'https://scripts.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/player.js', as: 'script' },
      { rel: 'preload', href: 'https://scripts.converteai.net/lib/js/smartplayer/v1/smartplayer.min.js', as: 'script' },
      { rel: 'preload', href: 'https://images.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/players/6837a8d8357fd7f67137cd7c/thumbnail.jpg', as: 'image' },
      { rel: 'preload', href: 'https://cdn.converteai.net/6f5c1302-f45d-4916-b23f-05255a58f896/6837a88a357fd7f67137cd41/main.m3u8', as: 'fetch' },
      { rel: 'dns-prefetch', href: 'https://cdn.converteai.net' },
      { rel: 'dns-prefetch', href: 'https://scripts.converteai.net' },
      { rel: 'dns-prefetch', href: 'https://images.converteai.net' },
      { rel: 'dns-prefetch', href: 'https://api.vturb.com.br' }
    ]

    const linkElements: HTMLLinkElement[] = []

    links.forEach(linkData => {
      const link = document.createElement('link')
      link.rel = linkData.rel
      link.href = linkData.href
      if (linkData.as) {
        link.as = linkData.as
      }
      document.head.appendChild(link)
      linkElements.push(link)
    })

    return () => {
      // Cleanup: remover links quando componente for desmontado
      linkElements.forEach(link => {
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      })
    }
  }, [isIOS])

  useEffect(() => {
    if (isIOS) return // Para iOS, o iframe gerencia o próprio fim

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
  }, [onVideoEnd, isEnded, isIOS])

  // Simular fim do vídeo para iframe (aproximadamente)
  useEffect(() => {
    if (!isIOS) return

    // Como não podemos detectar o fim do iframe facilmente, 
    // vamos simular baseado na duração típica do vídeo
    const timeout = setTimeout(() => {
      if (!isEnded) {
        console.log('Simulando fim do vídeo para iframe iOS')
        onVideoEnd()
      }
    }, 300000) // 5 minutos - ajustar conforme necessário

    return () => clearTimeout(timeout)
  }, [isIOS, onVideoEnd, isEnded])

  console.log('VideoPlayer renderizando:', { isIOS, videoUrl, iframeUrl })

  // Para iOS: usar iframe do converteai.net
  if (isIOS) {
    return (
      <div className="relative h-full w-full bg-gray-900">
        <iframe
          ref={iframeRef}
          src={iframeUrl}
          className="h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Video Player iOS"
        />
      </div>
    )
  }

  // Para outros dispositivos: vídeo normal com autoplay
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

