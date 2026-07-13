'use client'

import type * as React from 'react'
import { useEffect } from 'react'

const THEME_STORAGE_KEY = 'theme'

type ThemeProviderProps = {
  children: React.ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  useEffect(() => {
    const root = document.documentElement
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)

    if (storedTheme === 'dark') {
      root.classList.add('dark')
      return
    }

    if (storedTheme === 'light') {
      root.classList.remove('dark')
      return
    }

    const prefersDark = window.matchMedia(
      '(prefers-color-scheme: dark)'
    ).matches

    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [])

  return <>{children}</>
}
