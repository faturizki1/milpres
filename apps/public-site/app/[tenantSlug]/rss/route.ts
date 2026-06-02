import { NextResponse, type NextRequest } from 'next/server'
import { fetchTenantContents } from '../../../lib/api'

export async function GET(request: NextRequest, { params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const contents = await fetchTenantContents(tenantSlug)
  const hostname = process.env.PUBLIC_SITE_HOST || 'https://example.com'

  const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>RSS ${tenantSlug}</title>
    <link>${hostname}/${tenantSlug}</link>
    <description>Feed berita terbaru</description>
    ${contents.slice(0, 50).map((item) => `
      <item>
        <title><![CDATA[${item.title}]]></title>
        <link>${hostname}/${tenantSlug}/berita/${item.slug}</link>
        <description><![CDATA[${item.excerpt || item.body.slice(0, 200)}]]></description>
        <pubDate>${item.publishedAt ? new Date(item.publishedAt).toUTCString() : new Date().toUTCString()}</pubDate>
        <guid>${hostname}/${tenantSlug}/berita/${item.slug}</guid>
      </item>
    `).join('')}
  </channel>
</rss>`
  return new NextResponse(rss, { headers: { 'Content-Type': 'application/rss+xml' } })
}
