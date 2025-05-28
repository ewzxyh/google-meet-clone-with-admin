import { useState, useEffect } from 'react'

export function useIOSDetection() {
  const [isIOS, setIsIOS] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const detectIOS = () => {
      // Detectar iPhone, iPad, iPod
      const userAgent = navigator.userAgent.toLowerCase()
      const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
      
      // Detectar iPad no iOS 13+ (que se identifica como Mac)
      const isIPadPro = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
      
      // Detectar Safari no iOS
      const isSafariIOS = /safari/.test(userAgent) && /version/.test(userAgent) && isIOSDevice
      
      return isIOSDevice || isIPadPro || isSafariIOS
    }

    setIsIOS(detectIOS())
    setIsLoaded(true)
  }, [])

  return { isIOS, isLoaded }
} 