import { fetchTenantSiteConfig } from '../../../lib/api'

export const revalidate = 3600

export default async function ProfilePage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const config = await fetchTenantSiteConfig(tenantSlug)
  return (
    <section>
      <h1>Profil {config.siteConfig?.siteName || tenantSlug}</h1>
      <p>{config.siteConfig?.tagline || 'Profil singkat batalion.'}</p>
      <div className="card card-content">
        <h2>Visi</h2>
        <p>Membangun informasi yang kredibel dan berkelanjutan bagi tiap satuan.</p>
        <h2>Misi</h2>
        <ul>
          <li>Menyajikan berita akurat setiap hari.</li>
          <li>Menguatkan keterhubungan antar personel.</li>
          <li>Membantu publikasi kegiatan internal dan eksternal.</li>
        </ul>
      </div>
    </section>
  )
}
