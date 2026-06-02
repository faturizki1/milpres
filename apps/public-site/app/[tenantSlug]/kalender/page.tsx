import { fetchTenantSiteConfig } from '../../../lib/api'

export const revalidate = 3600

export default async function CalendarPage({ params }: { params: Promise<{ tenantSlug: string }> }) {
  const { tenantSlug } = await params
  const _config = await fetchTenantSiteConfig(tenantSlug)
  return (
    <section>
      <h1>Kalender Kegiatan</h1>
      <div className="card card-content">
        <p>Kalender ini menampilkan kegiatan batalion dan publikasi penting lainnya.</p>
        <ul>
          <li>07 Jun 2026 - Apel Gelar Pasukan</li>
          <li>14 Jun 2026 - Latihan Taktis</li>
          <li>21 Jun 2026 - Seminar Penguatan Humas</li>
        </ul>
      </div>
      <div style={{ marginTop: '1.5rem', color: 'var(--color-secondary)' }}>
        <strong>Catatan:</strong> Untuk informasi kalender terbaru, pastikan Anda mengecek halaman berita dan pengumuman.
      </div>
    </section>
  )
}
