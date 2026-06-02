import { fetchTenantSiteConfig } from '../../../lib/api'

export const revalidate = 3600

export default async function HistoryPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const config = await fetchTenantSiteConfig(tenantSlug)
  return (
    <section>
      <h1>Sejarah {config.siteConfig?.siteName || 'Satuan'}</h1>
      <div className="card card-content">
        <p>{config.siteConfig?.siteName || 'Satuan'} dibentuk untuk memperkuat pertahanan dan menyebarkan informasi penting kepada personel dan masyarakat.</p>
        <p>Kami terus beradaptasi dengan perkembangan digital untuk menghadirkan konten yang relevan.</p>
      </div>
    </section>
  )
}
