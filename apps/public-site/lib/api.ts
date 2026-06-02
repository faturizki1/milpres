const PUBLIC_API_BASE = process.env.CONTENT_SERVICE_URL || 'http://localhost:4000'

async function fetchJson<T>(path: string, init?: any) {
  const res = await fetch(`${PUBLIC_API_BASE}${path}`, { cache: 'force-cache', ...init })
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`)
  }
  return (await res.json()) as T
}

export type SiteConfig = {
  tenant: { slug: string; name: string }
  siteConfig: {
    siteName?: string
    tagline?: string
    logoMediaId?: string
    faviconMediaId?: string
    primaryColor?: string
    secondaryColor?: string
    heroType?: string
    maintenanceMode?: boolean
    maintenanceMsg?: string
    footerText?: string
    contactEmail?: string
    contactPhone?: string
    address?: string
    lat?: number
    lng?: number
    socialLinks?: Record<string, string>
  }
}

export type ContentItem = {
  id: string
  title: string
  slug: string
  excerpt?: string
  body: string
  publishedAt?: string
  updatedAt: string
  viewCount: number
  isFeatured: boolean
  isBreakingNews: boolean
  category?: { name: string; slug: string }
  tags: Array<{ tag: { name: string } }>
  thumbnail?: { storageKey?: string; originalName?: string }
  ogImage?: { storageKey?: string; originalName?: string }
}

export async function fetchTenantSiteConfig(tenantSlug: string) {
  return fetchJson<SiteConfig>(`/public/${tenantSlug}/site-config`)
}

export async function fetchTenantContents(tenantSlug: string) {
  return fetchJson<ContentItem[]>(`/public/${tenantSlug}/contents`)
}

export async function fetchTenantArticle(tenantSlug: string, slug: string) {
  return fetchJson<ContentItem>(`/public/${tenantSlug}/contents/${slug}`)
}

export async function searchTenantArticles(tenantSlug: string, q: string) {
  const params = new URLSearchParams({ q: q || '', tenantSlug })
  return fetchJson<Array<ContentItem>>(`/search?${params}`)
}

export function publicMediaUrl(storageKey?: string) {
  if (!storageKey) return '/placeholder.svg'
  const base = process.env.MINIO_PUBLIC_URL || 'https://minio.local'
  return `${base}/${encodeURIComponent(storageKey)}`
}
