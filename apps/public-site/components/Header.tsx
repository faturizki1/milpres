import Link from 'next/link'
import { SiteConfig } from '../lib/api'

export function Header({ siteConfig, tenantSlug }: { siteConfig: SiteConfig['siteConfig']; tenantSlug: string }) {
  return (
    <header className="header-bar">
      <div className="header-inner">
        <div>
          <Link href={`/${tenantSlug}`}><strong>{siteConfig?.siteName || 'Milpers'}</strong></Link>
          <div style={{ fontSize: '0.95rem', color: 'var(--color-secondary)' }}>{siteConfig?.tagline}</div>
        </div>
        <nav className="site-nav">
          <Link href={`/${tenantSlug}/berita`}>Berita</Link>
          <Link href={`/${tenantSlug}/galeri`}>Galeri</Link>
          <Link href={`/${tenantSlug}/cari`}>Cari</Link>
          <Link href={`/${tenantSlug}/profil`}>Profil</Link>
          <Link href={`/${tenantSlug}/kontak`}>Kontak</Link>
        </nav>
      </div>
    </header>
  )
}
