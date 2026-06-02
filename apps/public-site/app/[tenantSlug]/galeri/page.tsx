import { fetchTenantContents } from '../../../lib/api'
import { GallerySection } from '../../../components/GallerySection'

export const revalidate = 120

export default async function GalleryPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const contents = await fetchTenantContents(tenantSlug)
  const photos = contents.filter((item) => item.category?.name?.toLowerCase() === 'galeri' || item.isFeatured).slice(0, 12).map((item) => ({
    id: item.id,
    title: item.title,
    src: item.thumbnail?.storageKey || '/placeholder.svg',
    caption: item.excerpt || item.title,
    downloadUrl: item.thumbnail?.storageKey ? `/api/media/${encodeURIComponent(item.thumbnail.storageKey)}/download` : undefined,
  }))

  return (
    <section>
      <h1>Galeri Foto</h1>
      <p>Jelajahi koleksi foto terbaru batalion.</p>
      <GallerySection photos={photos} />
    </section>
  )
}
