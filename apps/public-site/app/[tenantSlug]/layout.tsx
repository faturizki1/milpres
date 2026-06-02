import { Header } from '../../components/Header'
import { Footer } from '../../components/Footer'
import { fetchTenantSiteConfig } from '../../lib/api'

export default async function TenantLayout({ children, params }: { children: React.ReactNode; params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const config = await fetchTenantSiteConfig(tenantSlug)
  const themeStyle: Record<string, string> = {
    '--color-primary': config.siteConfig?.primaryColor || '#0d6efd',
    '--color-secondary': config.siteConfig?.secondaryColor || '#6c757d',
  }

  return (
    <div className="site-shell" style={themeStyle}>
      <Header siteConfig={config.siteConfig} tenantSlug={tenantSlug} />
      <main className="site-content">
        {config.siteConfig?.maintenanceMode ? (
          <section className="card" style={{ padding: '1.5rem' }}>
            <h2>Situs sedang dalam pemeliharaan</h2>
            <p>{config.siteConfig.maintenanceMsg || 'Kami akan kembali segera.'}</p>
          </section>
        ) : (
          children
        )}
      </main>
      <Footer siteConfig={config.siteConfig} tenantSlug={tenantSlug} />
    </div>
  )
}
