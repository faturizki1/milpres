import { NextResponse, type NextRequest } from 'next/server'
import { fetchTenantContents, fetchTenantSiteConfig } from '../../../lib/api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const contents = await fetchTenantContents(tenantSlug)
  const _siteConfig = await fetchTenantSiteConfig(tenantSlug)
  const hostname = process.env.PUBLIC_SITE_HOST || 'https://example.com'

  const urls = [
    `${hostname}/${tenantSlug}`,
    `${hostname}/${tenantSlug}/berita`,
    `${hostname}/${tenantSlug}/galeri`,
    `${hostname}/${tenantSlug}/cari`,
    `${hostname}/${tenantSlug}/profil`,
    `${hostname}/${tenantSlug}/sejarah`,
    `${hostname}/${tenantSlug}/struktur`,
    `${hostname}/${tenantSlug}/kontak`,
    `${hostname}/${tenantSlug}/kalender`,
  ]

  const contentUrls = contents.map((item) => `${hostname}/${tenantSlug}/berita/${item.slug}`)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${[...urls, ...contentUrls].map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}
</urlset>`
  return new NextResponse(xml, { headers: { 'Content-Type': 'application/xml' } })
}
