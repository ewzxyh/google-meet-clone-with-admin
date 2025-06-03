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
  intervalMs = 5000, // 5 segundos por padrão
  enabled = true 
}: UseAutoRefreshProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isRefreshingRef = useRef(false)

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
        // Traduzir status para português
        const translatedMeetings: Meeting[] = data.map((meeting: any) => ({
          ...meeting,
          status: meeting.status === 'active' ? 'Ativado' : 
                  meeting.status === 'ended' ? 'Finalizado' : 
                  meeting.status
        }))
        onDataUpdate(translatedMeetings)
      } else if (error) {
        console.error("Erro ao buscar reuniões:", error)
      }
    } catch (error) {
      console.error("Erro no refresh automático:", error)
    } finally {
      isRefreshingRef.current = false
    }
  }, [onDataUpdate])

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    
    if (enabled) {
      intervalRef.current = setInterval(fetchMeetings, intervalMs)
    }
  }, [fetchMeetings, intervalMs, enabled])

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const refreshNow = useCallback(() => {
    fetchMeetings()
  }, [fetchMeetings])

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    if (enabled) {
      intervalRef.current = setInterval(fetchMeetings, intervalMs)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled, intervalMs, fetchMeetings])

  return {
    refreshNow,
    startAutoRefresh,
    stopAutoRefresh,
    isRefreshing: isRefreshingRef.current
  }
} 