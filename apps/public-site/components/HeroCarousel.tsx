'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ContentItem } from '../lib/api'

export function HeroCarousel({ heroItems, tenantSlug }: { heroItems: ContentItem[]; tenantSlug: string }) {
  const [active, setActive] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) return
    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % heroItems.length)
    }, 5000)
    return () => window.clearInterval(interval)
  }, [heroItems.length, isPaused])

  if (!heroItems.length) return null

  const current = heroItems[active]
  return (
    <section className="hero-carousel" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
      <div className="hero-slide">
        <img src={current.thumbnail ? current.thumbnail.storageKey || '/placeholder.svg' : '/placeholder.svg'} alt={current.title} />
        <div className="hero-caption">
          <span className="meta-pill">Featured</span>
          <h1 style={{ margin: '0.5rem 0' }}>{current.title}</h1>
          <p>{current.excerpt}</p>
          <Link className="primary-button" href={`/${tenantSlug}/berita/${current.slug}`}>Baca Selengkapnya</Link>
        </div>
      </div>
    </section>
  )
}
