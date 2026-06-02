import { searchTenantArticles } from '../../../lib/api'
import Link from 'next/link'
import { excerpt } from '../../../lib/format'

export const dynamic = 'force-dynamic'

export default async function SearchPage({ params, searchParams }: { params: Promise<{ tenantSlug: string }>; searchParams: Promise<{ q?: string }> }) {
  const { tenantSlug } = await params
  const { q } = await searchParams
  const query = q || ''
  const results = query ? await searchTenantArticles(tenantSlug, query) : []

  return (
    <section>
      <h1>Pencarian</h1>
      <form style={{ marginBottom: '1rem' }}>
        <input type="search" name="q" defaultValue={query} placeholder="Cari berita, tag, penulis" style={{ padding: '0.8rem', width: '100%', borderRadius: '0.75rem', border: '1px solid var(--border)' }} />
      </form>
      {query ? (
        <div className="grid grid-3" style={{ marginTop: '1rem' }}>
          {results.length ? results.map((item) => (
            <article key={item.id} className="card">
              <div className="card-content">
                <h3><Link href={`/${tenantSlug}/berita/${item.slug}`}>{item.title}</Link></h3>
                <p>{excerpt(item.excerpt || item.body, 'Ringkasan...')}</p>
              </div>
            </article>
          )) : <p>Tidak ada hasil untuk &quot;{query}&quot;.</p>}
        </div>
      ) : <p>Masukkan kata kunci untuk mencari berita.</p>}
    </section>
  )
}
