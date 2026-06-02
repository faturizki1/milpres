'use client'
import { useEffect, useRef, useState } from 'react'
import { ContentItem } from '../lib/api'

export function BreakingNewsTicker({ items, enabled }: { items: ContentItem[]; enabled?: boolean }) {
  const [pause, setPause] = useState(false)
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ref = tickerRef.current
    if (!ref || !enabled) return
    const handle = window.setInterval(() => {
      if (!pause) {
        ref.scrollLeft += 2
        if (ref.scrollLeft >= ref.scrollWidth - ref.clientWidth) {
          ref.scrollLeft = 0
        }
      }
    }, 40)
    return () => window.clearInterval(handle)
  }, [pause, enabled])

  if (!enabled || items.length === 0) return null
  return (
    <section className="breaking-news" onMouseEnter={() => setPause(true)} onMouseLeave={() => setPause(false)}>
      <strong>Breaking:</strong>
      <div className="ticker-text" ref={tickerRef}>
        <span>{items.map((item) => item.title).join(' • ')}</span>
      </div>
    </section>
  )
}
