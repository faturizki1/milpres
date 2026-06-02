'use client'
import { useEffect } from 'react'
import { GalleryPhoto } from './GalleryMasonry'

export function Lightbox({ photos, currentIndex, onClose, onPrev, onNext }: { photos: GalleryPhoto[]; currentIndex: number; onClose: ()=>void; onPrev: ()=>void; onNext: ()=>void; }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowLeft') onPrev()
      if (event.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, onNext, onPrev])

  const photo = photos[currentIndex]
  if (!photo) return null

  return (
    <div className="lightbox-backdrop" onClick={onClose}>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={photo.src} alt={photo.title} />
        <button className="lightbox-close" onClick={onClose}>×</button>
      </div>
    </div>
  )
}
