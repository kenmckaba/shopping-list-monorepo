'use client'

import type React from 'react'
import { createContext, useCallback, useContext, useState } from 'react'
import { Toast } from './toast'

interface ToastMessage {
  id: number
  message: string
  duration?: number
}

interface ToastContextType {
  showToast: (message: string, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((message: string, duration = 2000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, duration }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-32 left-6 z-50">
        {toasts.map(toast => (
          <Toast key={toast.id}>{toast.message}</Toast>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
