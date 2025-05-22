"use client"

import { useToast } from "./use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col items-end p-4 space-y-2">
      {toasts.map((toast, index) => (
        <div
          key={index}
          className={`rounded-md p-4 shadow-md transition-all ${
            toast.variant === "destructive" ? "bg-red-600 text-white" : "bg-white text-gray-900 border border-gray-200"
          }`}
        >
          {toast.title && <div className="font-medium">{toast.title}</div>}
          {toast.description && <div className="text-sm">{toast.description}</div>}
        </div>
      ))}
    </div>
  )
}
