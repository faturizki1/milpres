'use client'
import Masonry from 'react-masonry-css'

export type GalleryPhoto = {
  id: string
  title: string
  src: string
  caption?: string
  downloadUrl?: string
}

export function GalleryMasonry({ photos, onOpen }: { photos: GalleryPhoto[]; onOpen: (index:number)=>void }) {
  const breakpointColumnsObj = {
    default: 3,
    1100: 2,
    700: 1,
  }
  return (
    <Masonry breakpointCols={breakpointColumnsObj} className="grid" columnClassName="grid-column">
      {photos.map((photo, index) => (
        <div key={photo.id} className="card" style={{ cursor: 'pointer' }} onClick={() => onOpen(index)}>
          <img src={photo.src} alt={photo.title} loading="lazy" />
          <div className="card-content">
            <h3>{photo.title}</h3>
            <p>{photo.caption}</p>
            {photo.downloadUrl && (
              <a className="secondary-button" href={photo.downloadUrl} target="_blank" rel="noreferrer">Download</a>
            )}
          </div>
        </div>
      ))}
    </Masonry>
  )
}
