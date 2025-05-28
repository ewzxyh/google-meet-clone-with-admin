import { useState, useEffect } from 'react'

interface DeviceInfo {
  isIOS: boolean
  isSafari: boolean
  isAndroid: boolean
  isMobile: boolean
  supportsAutoplay: boolean
  userAgent: string
}

export function useDeviceDetection(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isIOS: false,
    isSafari: false,
    isAndroid: false,
    isMobile: false,
    supportsAutoplay: false,
    userAgent: ''
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = navigator.userAgent
    
    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    
    // Detectar Safari
    const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
    
    // Detectar Android
    const isAndroid = /Android/.test(userAgent)
    
    // Detectar mobile
    const isMobile = /Mobi|Android/i.test(userAgent) || isIOS
    
    // Detectar suporte a autoplay (estimativa)
    let supportsAutoplay = true
    
    // iOS tem restrições rígidas de autoplay
    if (isIOS) {
      // iOS 13.1.3+ permite autoplay silencioso em alguns casos
      const iOSVersion = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/)
      if (iOSVersion) {
        const major = parseInt(iOSVersion[1])
        const minor = parseInt(iOSVersion[2])
        supportsAutoplay = major > 13 || (major === 13 && minor >= 1)
      } else {
        supportsAutoplay = false
      }
    }
    
    // Safari também tem restrições
    if (isSafari && !isIOS) {
      supportsAutoplay = false
    }

    setDeviceInfo({
      isIOS,
      isSafari,
      isAndroid,
      isMobile,
      supportsAutoplay,
      userAgent
    })
  }, [])

  return deviceInfo
} 