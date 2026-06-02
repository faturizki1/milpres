import { fetchTenantContents } from '../../../../lib/api'
import Link from 'next/link'

export const revalidate = 120

export default async function VideoGalleryPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const contents = await fetchTenantContents(tenantSlug)
  const videos = contents.filter((item) => /youtube\.com|youtu\.be/i.test(item.body)).slice(0, 12)

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Galeri Video</h1>
        <Link href={`/${tenantSlug}/galeri`} className="secondary-button">Kembali ke Galeri</Link>
      </div>
      <div className="grid grid-3" style={{ marginTop: '1rem' }}>
        {videos.length ? videos.map((video) => {
          const match = video.body.match(/https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/)([\w-]+)/i)
          const id = match?.[1]
          return (
            <article key={video.id} className="card">
              <div className="card-content">
                <h3><Link href={`/${tenantSlug}/berita/${video.slug}`}>{video.title}</Link></h3>
                {id ? (
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <iframe src={`https://www.youtube.com/embed/${id}`} title={video.title} frameBorder="0" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                  </div>
                ) : <p>Video tidak tersedia.</p>}
              </div>
            </article>
          )
        }) : <p>Tidak ada video ditemukan.</p>}
      </div>
    </section>
  )
}
