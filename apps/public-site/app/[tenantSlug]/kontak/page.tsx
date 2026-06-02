import { fetchTenantSiteConfig } from '../../../lib/api'

export const revalidate = 3600

export default async function ContactPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const config = await fetchTenantSiteConfig(tenantSlug)
  return (
    <section>
      <h1>Kontak</h1>
      <div className="card card-content">
        <p>Email: <a href={`mailto:${config.siteConfig?.contactEmail}`}>{config.siteConfig?.contactEmail || 'info@example.com'}</a></p>
        <p>Telepon: {config.siteConfig?.contactPhone || '-'} </p>
        <p>Alamat: {config.siteConfig?.address || '-'}</p>
      </div>
      <div className="card card-content" style={{ marginTop: '1.5rem' }}>
        <h2>Lokasi</h2>
        <iframe
          width="100%"
          height="320"
          src={`https://www.google.com/maps?q=${encodeURIComponent(config.siteConfig?.address || 'Jakarta')}&output=embed`}
          title="Google Maps"
          style={{ border: 0, borderRadius: '1rem' }}
          loading="lazy"
        ></iframe>
      </div>
    </section>
  )
}
