'use client'
import { useEffect, useState } from 'react'

const sizes = { S: '0.95rem', M: '1rem', L: '1.1rem' }

export function FontSizeAdjuster() {
  const [size, setSize] = useState('M')

  useEffect(() => {
    const stored = window.localStorage.getItem('milpers_font_size')
    if (stored && sizes[stored as keyof typeof sizes]) setSize(stored)
  }, [])

  useEffect(() => {
    document.documentElement.style.fontSize = sizes[size as keyof typeof sizes]
    window.localStorage.setItem('milpers_font_size', size)
  }, [size])

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <span>Ukuran huruf:</span>
      {Object.keys(sizes).map((label) => (
        <button key={label} className="secondary-button" onClick={() => setSize(label)}>
          {label}
        </button>
      ))}
    </div>
  )
}
