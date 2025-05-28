"use client"

import { useState, useEffect } from "react"

interface MeetingConfirmationProps {
  isVisible: boolean
  onConfirm: () => void
  meetingId: string
  userName: string
}

export default function MeetingConfirmation({ isVisible, onConfirm, meetingId, userName }: MeetingConfirmationProps) {
  const [currentTime, setCurrentTime] = useState("")

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))
    }
    
    updateTime()
    const interval = setInterval(updateTime, 1000)
    
    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center text-white max-w-md mx-4 border border-white/20 shadow-2xl">
        {/* Ícone de reunião */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
          <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        
        {/* Título */}
        <h2 className="text-2xl font-bold mb-2">Entrar na Reunião</h2>
        <p className="text-blue-400 text-sm mb-6">Reunião iniciada às {currentTime}</p>
        
        {/* Informações da reunião */}
        <div className="mb-6 space-y-3 bg-white/5 rounded-lg p-4 border border-white/10">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">ID da Reunião:</span>
            <span className="font-mono text-white">{meetingId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Participante:</span>
            <span className="text-white font-medium">{userName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Status:</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm">Ativa</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-300 mb-6">
          Confirme sua entrada para participar da reunião em andamento.
        </p>
        
        {/* Botão de confirmação */}
        <button
          onClick={onConfirm}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
          <span>Entrar na Reunião</span>
        </button>
        
        {/* Informações adicionais */}
        <div className="mt-4 text-xs text-gray-500">
          <p>Ao entrar, você concorda com os termos de uso</p>
        </div>
      </div>
    </div>
  )
} 