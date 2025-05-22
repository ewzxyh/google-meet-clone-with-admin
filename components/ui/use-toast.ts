"use client"

// Shadcn/ui toast hook
import { useState, useEffect, useCallback } from "react"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export function toast(props: ToastProps) {
  const event = new CustomEvent("toast", { detail: props })
  document.dispatchEvent(event)
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const addToast = useCallback((toast: ToastProps) => {
    setToasts((prev) => [...prev, toast])
    setTimeout(() => {
      setToasts((prev) => prev.slice(1))
    }, 3000)
  }, [])

  useEffect(() => {
    const handleToast = (e: Event) => {
      const customEvent = e as CustomEvent<ToastProps>
      addToast(customEvent.detail)
    }

    document.addEventListener("toast", handleToast)
    return () => {
      document.removeEventListener("toast", handleToast)
    }
  }, [addToast])

  return { toasts }
}
