import { fetchTenantContents } from '../../../lib/api'
import Link from 'next/link'
import { excerpt } from '../../../lib/format'

export const revalidate = 120

export async function generateMetadata({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  return {
    title: `Berita | ${tenantSlug}`,
    description: `Daftar berita terbaru untuk ${tenantSlug}.`,
  }
}

export default async function ArticleListPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const contents = await fetchTenantContents(tenantSlug)

  return (
    <section>
      <h1>Berita</h1>
      <div className="grid grid-2" style={{ marginTop: '1rem' }}>
        {contents.map((item) => (
          <article key={item.id} className="card">
            <img src={item.thumbnail?.storageKey || '/placeholder.svg'} alt={item.title} />
            <div className="card-content">
              <p className="meta-pill">{item.category?.name || 'Berita'}</p>
              <h3><Link href={`/${tenantSlug}/berita/${item.slug}`}>{item.title}</Link></h3>
              <p>{excerpt(item.excerpt || item.body, 'Ringkasan...')}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
