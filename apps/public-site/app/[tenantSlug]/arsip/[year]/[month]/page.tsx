import { fetchTenantContents } from '../../../../../lib/api'
import Link from 'next/link'
import { formatDate, excerpt } from '../../../../../lib/format'

export const revalidate = 120

export default async function ArchiveMonthPage({ params }: { params: Promise<{ tenantSlug: string; year: string; month: string }> }) {
  const { tenantSlug, year, month } = await params
  const contents = await fetchTenantContents(tenantSlug)
  const items = contents.filter((item) => {
    if (!item.publishedAt) return false
    const published = new Date(item.publishedAt)
    return published.getUTCFullYear() === Number(year) && published.getUTCMonth() + 1 === Number(month)
  })

  return (
    <section>
      <h1>Arsip {month}/{year}</h1>
      {items.length ? (
        <div className="grid grid-2" style={{ marginTop: '1rem' }}>
          {items.map((item) => (
            <article key={item.id} className="card">
              <div className="card-content">
                <h3><Link href={`/${tenantSlug}/berita/${item.slug}`}>{item.title}</Link></h3>
                <p>{formatDate(item.publishedAt)}</p>
                <p>{excerpt(item.excerpt || item.body)}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p>Tidak ada artikel dalam arsip ini.</p>
      )}
    </section>
  )
}
