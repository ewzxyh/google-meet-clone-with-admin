"use client"

import { useEffect, useState } from "react"

interface IOSDebugInfoProps {
  isVisible?: boolean
}

export default function IOSDebugInfo({ isVisible = false }: IOSDebugInfoProps) {
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [videoInfo, setVideoInfo] = useState<any>({})

  useEffect(() => {
    if (typeof window === 'undefined') return

    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      maxTouchPoints: navigator.maxTouchPoints,
      isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent) || 
             (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
      isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
      screen: {
        width: screen.width,
        height: screen.height,
        orientation: screen.orientation?.type || 'unknown'
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }

    setDeviceInfo(info)

    // Detectar capacidades de vídeo
    const video = document.createElement('video')
    const videoInfo = {
      canPlayType_mp4: video.canPlayType('video/mp4'),
      canPlayType_webm: video.canPlayType('video/webm'),
      autoplay: video.autoplay,
      muted: video.muted,
      playsInline: video.playsInline
    }

    setVideoInfo(videoInfo)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2 text-green-400">🍎 iOS Debug Info</h3>
      
      <div className="space-y-2">
        <div>
          <strong className="text-blue-400">Dispositivo:</strong>
          <div>iOS: {deviceInfo.isIOS ? '✅' : '❌'}</div>
          <div>Safari: {deviceInfo.isSafari ? '✅' : '❌'}</div>
          <div>Touch Points: {deviceInfo.maxTouchPoints}</div>
        </div>

        <div>
          <strong className="text-blue-400">Tela:</strong>
          <div>Resolução: {deviceInfo.screen?.width}x{deviceInfo.screen?.height}</div>
          <div>Viewport: {deviceInfo.viewport?.width}x{deviceInfo.viewport?.height}</div>
          <div>Orientação: {deviceInfo.screen?.orientation}</div>
        </div>

        <div>
          <strong className="text-blue-400">Vídeo:</strong>
          <div>MP4: {videoInfo.canPlayType_mp4 || 'Não suportado'}</div>
          <div>WebM: {videoInfo.canPlayType_webm || 'Não suportado'}</div>
        </div>

        <div>
          <strong className="text-blue-400">User Agent:</strong>
          <div className="break-all text-gray-300">{deviceInfo.userAgent}</div>
        </div>
      </div>
    </div>
  )
} 