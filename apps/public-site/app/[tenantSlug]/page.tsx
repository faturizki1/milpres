import { HeroCarousel } from '../../components/HeroCarousel'
import { BreakingNewsTicker } from '../../components/BreakingNewsTicker'
import { fetchTenantContents, fetchTenantSiteConfig, ContentItem } from '../../lib/api'
import { excerpt } from '../../lib/format'
import Link from 'next/link'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const siteConfig = await fetchTenantSiteConfig(tenantSlug)
  return {
    title: `${siteConfig.siteConfig?.siteName || 'Milpers'} | Beranda`,
    description: siteConfig.siteConfig?.tagline || 'Berita dan informasi terbaru batalion.',
    openGraph: {
      title: `${siteConfig.siteConfig?.siteName || 'Milpers'} | Beranda`,
      description: siteConfig.siteConfig?.tagline,
        url: `https://example.com/${tenantSlug}`,
      images: [ { url: '/placeholder.svg', width: 1200, height: 630 } ]
    }
  }
}

export default async function HomepagePage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const [siteConfig, contents] = await Promise.all([
    fetchTenantSiteConfig(tenantSlug),
    fetchTenantContents(tenantSlug),
  ])
  const heroItems = contents.filter((item) => item.isFeatured).slice(0, 4)
  const breakingItems = contents.filter((item) => item.isBreakingNews).slice(0, 6)
  const latestItems = contents.slice(0, 6)
  const featured = contents.filter((item) => item.isFeatured).slice(0, 3)
  const videoHighlight = contents.find((item) => item.body.includes('youtube.com') || item.body.includes('youtu.be'))
  const upcomingEvents = contents.filter((item) => item.category?.name.toLowerCase() === 'kegiatan').slice(0, 5)

  return (
    <>
      <HeroCarousel heroItems={heroItems.length ? heroItems : latestItems.slice(0, 3)} tenantSlug={tenantSlug} />
      <BreakingNewsTicker items={breakingItems} enabled={Boolean(siteConfig.siteConfig?.heroType !== 'NO_TICKER')} />

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Berita Terbaru</h2>
          <Link href={`/${tenantSlug}/berita`} className="secondary-button">Lihat Semua</Link>
        </div>
        <div className="grid grid-3" style={{ marginTop: '1rem' }}>
          {latestItems.map((item) => (
            <article key={item.id} className="card">
              <img src={item.thumbnail ? item.thumbnail.storageKey || '/placeholder.svg' : '/placeholder.svg'} alt={item.title} />
              <div className="card-content">
                <p className="meta-pill">{item.category?.name || 'Berita'}</p>
                <h3><Link href={`/${tenantSlug}/berita/${item.slug}`}>{item.title}</Link></h3>
                <p>{excerpt(item.excerpt || item.body, 'Ringkasan berita...')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2>Featured Stories</h2>
        <div className="grid grid-2" style={{ marginTop: '1rem' }}>
          {featured.map((item) => (
            <article key={item.id} className="card">
              <img src={item.thumbnail ? item.thumbnail.storageKey || '/placeholder.svg' : '/placeholder.svg'} alt={item.title} />
              <div className="card-content">
                <h3><Link href={`/${tenantSlug}/berita/${item.slug}`}>{item.title}</Link></h3>
                <p>{excerpt(item.excerpt || item.body, '')}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 320px' }}>
          <div>
            <h2>Video Highlight</h2>
            {videoHighlight ? (
              <div className="card">
                <div className="card-content">
                  <p className="meta-pill">Video</p>
                  <h3>{videoHighlight.title}</h3>
                  <div style={{ position: 'relative', paddingTop: '56.25%' }}>
                    <iframe src={videoHighlight.body.match(/https?:\/\/(?:www\.)?youtube\.com\/(?:embed\/|watch\?v=)([\w-]+)/)?.[0] || ''}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                      frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p>Tidak ada video yang tersedia saat ini.</p>
            )}
          </div>
          <aside>
            <h2>Kalender Kegiatan</h2>
            <div className="card card-content">
              {upcomingEvents.length ? (
                <ul style={{ paddingLeft: '1rem', margin: 0 }}>
                  {upcomingEvents.map((event) => (
                    <li key={event.id} style={{ marginBottom: '0.75rem' }}>
                      <strong>{event.title}</strong><br />
                      <span style={{ color: 'var(--color-secondary)' }}>{event.publishedAt ? new Date(event.publishedAt).toLocaleDateString('id-ID') : '-'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Belum ada jadwal kegiatan.</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  )
}
