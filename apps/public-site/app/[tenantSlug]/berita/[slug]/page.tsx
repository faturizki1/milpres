import { fetchTenantArticle } from '../../../../lib/api'
import type { ContentItem } from '../../../../lib/api'
import { buildArticleJsonLd, excerpt, formatDate, estimateReadTime } from '../../../../lib/format'
import { ArticleShareButtons } from '../../../../components/ArticleShareButtons'
import { FontSizeAdjuster } from '../../../../components/FontSizeAdjuster'
import { DarkModeToggle } from '../../../../components/DarkModeToggle'
import Link from 'next/link'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ tenantSlug: string; slug: string }> }) {
  const { tenantSlug, slug } = await params
  const article = await fetchTenantArticle(tenantSlug, slug)
  const imageUrl = article.ogImage?.storageKey || article.thumbnail?.storageKey || '/placeholder.svg'
  return {
    title: `${article.title} | ${tenantSlug}`,
    description: excerpt(article.excerpt || article.body),
    openGraph: {
      title: article.title,
      description: excerpt(article.excerpt || article.body),
      url: `https://example.com/${tenantSlug}/berita/${article.slug}`,
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: 'article'
    },
    metadataBase: new URL(`https://example.com/${tenantSlug}`),
    alternates: { canonical: `/${tenantSlug}/berita/${article.slug}` },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ tenantSlug: string; slug: string }> }) {
  const { tenantSlug, slug } = await params
  const article = await fetchTenantArticle(tenantSlug, slug)
  const imageUrl = article.ogImage?.storageKey || article.thumbnail?.storageKey || '/placeholder.svg'
  const related: ContentItem[] = []

  return (
    <article>
      <nav style={{ marginBottom: '1rem' }}>
        <Link href={`/${tenantSlug}`}>Beranda</Link> › <Link href={`/${tenantSlug}/berita`}>Berita</Link> › {article.title}
      </nav>
      <h1>{article.title}</h1>
      <p style={{ color: 'var(--color-secondary)', marginTop: '0.25rem' }}>
        {formatDate(article.publishedAt)} • {article.category?.name || 'Umum'} • {estimateReadTime(article.body)} menit baca
      </p>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', margin: '1rem 0' }}>
        <FontSizeAdjuster />
        <DarkModeToggle />
      </div>
      {article.thumbnail && <img src={article.thumbnail.storageKey || '/placeholder.svg'} alt={article.title} />}
      <div style={{ marginTop: '1rem' }} dangerouslySetInnerHTML={{ __html: article.body }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticleJsonLd({
        title: article.title,
        excerpt: article.excerpt,
        publishedAt: article.publishedAt,
        author: article.category?.name || 'Redaksi',
        url: `https://example.com/${tenantSlug}/berita/${article.slug}`,
        image: imageUrl,
        siteName: tenantSlug,
      })) }} />
      <div style={{ marginTop: '1.5rem' }}>
        <ArticleShareButtons title={article.title} url={`https://example.com/${tenantSlug}/berita/${article.slug}`} />
      </div>
      <section style={{ marginTop: '2rem' }}>
        <h2>Baca Juga</h2>
        <div className="grid grid-3">
          {related.length ? related.slice(0, 3).map((item) => (
            <article key={item.id} className="card">
              <div className="card-content">
                <h3><Link href={`/${tenantSlug}/berita/${item.slug}`}>{item.title}</Link></h3>
              </div>
            </article>
          )) : <p>Tidak ada artikel terkait yang cukup data.</p>}
        </div>
      </section>
    </article>
  )
}
