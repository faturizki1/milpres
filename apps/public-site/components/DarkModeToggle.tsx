'use client'
import { useEffect, useState } from 'react'

export function DarkModeToggle() {
  const [mode, setMode] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const stored = window.localStorage.getItem('milpers_color_mode')
    if (stored === 'dark' || stored === 'light') setMode(stored)
    else setMode(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = mode
    window.localStorage.setItem('milpers_color_mode', mode)
  }, [mode])

  return (
    <button className="secondary-button" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
      {mode === 'light' ? 'Dark mode' : 'Light mode'}
    </button>
  )
}
