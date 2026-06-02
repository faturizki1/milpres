export function formatDate(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date(value))
}

export function estimateReadTime(body: string) {
  const words = body.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

export function excerpt(value?: string, fallback = '') {
  if (!value) return fallback
  return value.length > 150 ? `${value.slice(0, 147).trim()}...` : value
}

export function buildArticleJsonLd(article: { title: string; excerpt?: string; publishedAt?: string; author?: string; url: string; image?: string; siteName?: string; }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    image: article.image ? [article.image] : [],
    datePublished: article.publishedAt,
    author: { '@type': 'Person', name: article.author || 'Redaksi' },
    publisher: { '@type': 'Organization', name: article.siteName || 'Milpers' },
    description: article.excerpt || '',
    mainEntityOfPage: { '@type': 'WebPage', '@id': article.url }
  }
}
