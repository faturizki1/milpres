import { fetchTenantSiteConfig } from '../../../lib/api'

export const revalidate = 3600

export default async function StructurePage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const config = await fetchTenantSiteConfig(tenantSlug)
  return (
    <section>
      <h1>Struktur Komando {config.siteConfig?.siteName || 'Satuan'}</h1>
      <div className="card card-content">
        <p>Organisasi kami dibangun dengan tata kelola yang jelas dan setiap divisi memiliki tanggung jawab yang terdefinisi.</p>
        <ul>
          <li>Komandan</li>
          <li>Staf Operasi</li>
          <li>Staf Logistik</li>
          <li>Humas dan Informasi</li>
        </ul>
      </div>
    </section>
  )
}
