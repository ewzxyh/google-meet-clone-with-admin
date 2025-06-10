import { useEffect, useCallback, useRef } from 'react'
import { getSupabaseBrowser } from '@/lib/supabase'
import type { Meeting } from '@/components/admin-panel'

interface UseAutoRefreshProps {
  onDataUpdate: (meetings: Meeting[]) => void
  intervalMs?: number
  enabled?: boolean
}

export function useAutoRefresh({ 
  onDataUpdate, 
  intervalMs = 5000,
  enabled = true 
}: UseAutoRefreshProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)
  const onDataUpdateRef = useRef(onDataUpdate)
  const enabledRef = useRef(enabled)
  const intervalMsRef = useRef(intervalMs)

  // Manter as referências atualizadas sem causar re-renders
  useEffect(() => {
    onDataUpdateRef.current = onDataUpdate
  }, [onDataUpdate])

  useEffect(() => {
    enabledRef.current = enabled
  }, [enabled])

  useEffect(() => {
    intervalMsRef.current = intervalMs
  }, [intervalMs])

  const fetchMeetings = useCallback(async () => {
    if (isRefreshingRef.current) return
    
    try {
      isRefreshingRef.current = true
      const supabase = getSupabaseBrowser()
      
      if (!supabase) {
        console.warn("Cliente Supabase não inicializado")
        return
      }

      const { data, error } = await supabase
        .from("meetings")
        .select("*")
        .order("created_at", { ascending: false })

      if (!error && data) {
        const translatedMeetings: Meeting[] = data.map((meeting: any) => ({
          ...meeting,
          status: meeting.status === 'active' ? 'Ativado' : 
                  meeting.status === 'watching' ? 'Assistindo' :
                  meeting.status === 'ended' ? 'Encerrado' : 
                  meeting.status
        }))
        onDataUpdateRef.current(translatedMeetings)
      } else if (error) {
        console.error("Erro ao buscar reuniões:", error)
      }
    } catch (error) {
      console.error("Erro no refresh automático:", error)
    } finally {
      isRefreshingRef.current = false
    }
  }, []) // Sem dependências para ser estável

  const startAutoRefresh = useCallback(() => {
    // Limpar interval existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    // Só iniciar se enabled
    if (enabledRef.current) {
      intervalRef.current = setInterval(() => {
        // Verificar novamente se ainda está enabled no momento da execução
        if (enabledRef.current) {
          fetchMeetings()
        }
      }, intervalMsRef.current)
    }
  }, [fetchMeetings])

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const refreshNow = useCallback(() => {
    fetchMeetings()
  }, [fetchMeetings])

  // Effect principal para controlar o interval
  useEffect(() => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }

    return () => {
      stopAutoRefresh()
    }
  }, [enabled, startAutoRefresh, stopAutoRefresh])

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [])

  return {
    refreshNow,
    startAutoRefresh,
    stopAutoRefresh,
    isRefreshing: isRefreshingRef.current
  }
} 