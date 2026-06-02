'use client'
import { useMemo, useState } from 'react'
import { GalleryMasonry, GalleryPhoto } from './GalleryMasonry'
import { Lightbox } from './Lightbox'

export function GallerySection({ photos }: { photos: GalleryPhoto[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const active = openIndex !== null ? photos[openIndex] : null

  const handlers = useMemo(() => ({
    onPrev: () => setOpenIndex((current) => (current === null ? null : (current - 1 + photos.length) % photos.length)),
    onNext: () => setOpenIndex((current) => (current === null ? null : (current + 1) % photos.length)),
  }), [photos.length])

  return (
    <>
      <GalleryMasonry photos={photos} onOpen={(index) => setOpenIndex(index)} />
      {openIndex !== null && active && (
        <Lightbox photos={photos} currentIndex={openIndex} onClose={() => setOpenIndex(null)} onPrev={handlers.onPrev} onNext={handlers.onNext} />
      )}
    </>
  )
}
