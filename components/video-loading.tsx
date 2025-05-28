"use client"

interface VideoLoadingProps {
  isVisible: boolean
}

export default function VideoLoading({ isVisible }: VideoLoadingProps) {
  if (!isVisible) return null

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black">
      <div className="flex flex-col items-center space-y-4">
        {/* Spinner animado */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
        
        {/* Texto com animação de pontos */}
        <div className="text-white text-xl font-medium">
          Carregando vídeo
          <span className="inline-block animate-pulse">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </div>
      </div>
    </div>
  )
} 