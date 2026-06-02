import { SiteConfig } from '../lib/api'

export function Footer({ siteConfig }: { siteConfig: SiteConfig['siteConfig'] }) {
  return (
    <footer className="footer-bar">
      <div className="footer-inner">
        <div>
          <strong>{siteConfig?.siteName || 'Milpers'}</strong>
          <p style={{ margin: 0, color: 'var(--color-secondary)' }}>{siteConfig?.footerText || 'Berita batalion yang terpercaya.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <span>{siteConfig?.contactEmail}</span>
          <span>{siteConfig?.contactPhone}</span>
          <span>{siteConfig?.address}</span>
        </div>
      </div>
    </footer>
  )
}
