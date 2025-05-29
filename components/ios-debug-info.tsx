"use client"

import { useEffect, useState } from "react"

interface IOSDebugInfoProps {
  isVisible?: boolean
}

export default function IOSDebugInfo({ isVisible = false }: IOSDebugInfoProps) {
  const [deviceInfo, setDeviceInfo] = useState<any>({})
  const [implementationType, setImplementationType] = useState('')

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

    // Determinar tipo de implementação
    if (info.isIOS) {
      setImplementationType('iframe converteai.net')
    } else {
      setImplementationType('elemento <video> com autoplay')
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black bg-opacity-90 text-white p-4 rounded-lg text-xs max-w-sm max-h-96 overflow-y-auto">
      <h3 className="font-bold mb-2 text-green-400">🎬 Video Player Debug</h3>
      
      <div className="space-y-2">
        <div>
          <strong className="text-blue-400">Dispositivo:</strong>
          <div>iOS: {deviceInfo.isIOS ? '✅' : '❌'}</div>
          <div>Safari: {deviceInfo.isSafari ? '✅' : '❌'}</div>
          <div>Touch Points: {deviceInfo.maxTouchPoints}</div>
        </div>

        <div>
          <strong className="text-blue-400">Implementação:</strong>
          <div className="text-green-300">{implementationType}</div>
          {deviceInfo.isIOS && (
            <div className="text-xs text-gray-400 mt-1">
              Usando iframe para compatibilidade com iOS
            </div>
          )}
        </div>

        <div>
          <strong className="text-blue-400">Tela:</strong>
          <div>Resolução: {deviceInfo.screen?.width}x{deviceInfo.screen?.height}</div>
          <div>Viewport: {deviceInfo.viewport?.width}x{deviceInfo.viewport?.height}</div>
        </div>

        <div>
          <strong className="text-blue-400">User Agent:</strong>
          <div className="break-all text-gray-300 text-xs">{deviceInfo.userAgent}</div>
        </div>
      </div>
    </div>
  )
} 