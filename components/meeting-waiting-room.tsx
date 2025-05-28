"use client"

import { useState, useEffect } from "react"

interface MeetingWaitingRoomProps {
  isVisible: boolean
  onReady: () => void
  meetingId: string
  userName: string
}

export default function MeetingWaitingRoom({ isVisible, onReady, meetingId, userName }: MeetingWaitingRoomProps) {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("Conectando...")

  useEffect(() => {
    if (!isVisible) return

    const steps = [
      "Conectando ao servidor...",
      "Verificando permissões...",
      "Preparando áudio e vídeo...",
      "Entrando na reunião..."
    ]

    let stepIndex = 0
    let progressValue = 0

    const interval = setInterval(() => {
      progressValue += 25
      setProgress(progressValue)
      
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex])
        stepIndex++
      }

      if (progressValue >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          onReady()
        }, 500)
      }
    }, 800)

    return () => clearInterval(interval)
  }, [isVisible, onReady])

  if (!isVisible) return null

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center text-white max-w-md mx-4 border border-white/20 shadow-2xl">
        {/* Logo/Ícone */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>

        {/* Título */}
        <h2 className="text-xl font-bold mb-2">Preparando Reunião</h2>
        <p className="text-gray-400 text-sm mb-6">{meetingId}</p>

        {/* Barra de progresso */}
        <div className="mb-6">
          <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-300">{currentStep}</p>
        </div>

        {/* Informações do usuário */}
        <div className="bg-white/5 rounded-lg p-3 border border-white/10">
          <p className="text-sm text-gray-400">Entrando como:</p>
          <p className="text-white font-medium">{userName}</p>
        </div>
      </div>
    </div>
  )
} 