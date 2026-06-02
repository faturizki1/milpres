# SPEC.md — Milpers CMS
## Spesifikasi Teknis Sistem Manajemen Konten Pers Militer

> **Versi**: 1.0.0-draft  
> **Tanggal**: 2026-06-02  
> **Status**: Draft — Untuk Review Internal  
> **Klasifikasi**: Terbatas (Internal Development Team)

---

## Daftar Isi

1. [Gambaran Umum](#1-gambaran-umum)
2. [Tujuan & Ruang Lingkup](#2-tujuan--ruang-lingkup)
3. [Aktor & Peran](#3-aktor--peran)
4. [Fitur & Persyaratan Fungsional](#4-fitur--persyaratan-fungsional)
5. [Persyaratan Non-Fungsional](#5-persyaratan-non-fungsional)
6. [Model Data](#6-model-data)
7. [API Specification](#7-api-specification)
8. [Multi-Tenancy & Keamanan](#8-multi-tenancy--keamanan)
9. [Public Site Specification](#9-public-site-specification)
10. [Admin Dashboard Specification](#10-admin-dashboard-specification)
11. [Workflow Konten](#11-workflow-konten)
12. [Integrasi Eksternal](#12-integrasi-eksternal)
13. [Deployment & Environment](#13-deployment--environment)
14. [Batasan & Asumsi](#14-batasan--asumsi)
15. [Glosarium](#15-glosarium)

---

## 1. Gambaran Umum

**Milpers CMS** (Military Personnel Content Management System) adalah platform multi-tenant berbasis web yang dirancang khusus untuk pengelolaan informasi dan publikasi berita Pers Batalion TNI Angkatan Darat. Sistem ini memungkinkan setiap batalion memiliki ruang kerja (workspace) terisolasi dengan situs publik mandiri, sambil tetap terpantau oleh Super Admin di tingkat pusat.

### 1.1 Prinsip Desain Utama

| Prinsip | Deskripsi |
|---|---|
| **Isolasi Ketat** | Data antar batalion tidak boleh saling bocor dalam kondisi apapun |
| **Defense in Depth** | Keamanan berlapis: RLS database, middleware, JWT scoping, audit log |
| **Tenant First** | Setiap keputusan arsitektur mempertimbangkan dampak multi-tenancy |
| **Offline Capable** | Public site harus dapat diakses meski koneksi terbatas (PWA) |
| **Audit Trail** | Semua aksi kritis terekam dan tidak dapat dihapus |

### 1.2 Stakeholder Utama

- **Markas Besar / Komando Atas** → Super Admin, monitoring global
- **Perwira Pers Batalion** → Admin Pers, pengelola workspace tunggal
- **Bintara / Tamtama Pers** → Staff Pers, produser konten harian
- **Masyarakat Umum** → Pembaca situs publik batalion

---

## 2. Tujuan & Ruang Lingkup

### 2.1 Tujuan

- Menyediakan platform terpusat namun terdesentralisasi untuk publikasi berita pers batalion TNI AD.
- Menggantikan metode publikasi manual (WhatsApp, Facebook, blog pribadi) dengan sistem terstandar dan aman.
- Memastikan konsistensi branding dan kualitas konten di seluruh batalion.
- Memberikan visibilitas data kepada komando atas tanpa mengakses konten secara langsung.

### 2.2 Dalam Lingkup (In Scope)

- Sistem autentikasi multi-tenant dengan JWT + Tenant Scoping
- Dashboard admin untuk tiga level peran (Super Admin, Admin Batalion, Staff Pers)
- Public site per-batalion dengan fitur lengkap
- Manajemen konten: artikel, galeri foto, galeri video, pengumuman, infografis
- Workflow editorial: draf → review → publikasi
- Scheduled publishing dan version history
- Notifikasi real-time
- Export laporan (Excel/PDF)
- PWA untuk public site
- Custom domain per batalion (`namabaталion.milpers.id`)

### 2.3 Di Luar Lingkup (Out of Scope)

- Sistem HR/manajemen personel (termasuk KARYO OS — sistem terpisah)
- Komunikasi internal antar anggota batalion (bukan CMS)
- Sistem keuangan atau logistik
- Aplikasi mobile native (iOS/Android) — hanya PWA
- Integrasi langsung dengan sistem Simak TNI atau SIMPEG

---

## 3. Aktor & Peran

### 3.1 Hierarki Peran

```
Super Admin
    └── Admin Pers Batalion  (per tenant/batalion)
            └── Staff Pers  (per tenant/batalion)
```

### 3.2 Detail Hak Akses

#### Super Admin

Hak akses bersifat global, lintas semua tenant.

| Fungsi | Akses |
|---|---|
| Melihat daftar semua batalion (tenant) | ✅ |
| Membuat / menonaktifkan tenant | ✅ |
| Melihat analytics agregat lintas tenant | ✅ |
| Membuat / menonaktifkan akun Admin Pers | ✅ |
| Melihat audit log global | ✅ |
| Mengakses konten spesifik satu tenant | ❌ (by design) |
| Mengedit konten satu tenant | ❌ (by design) |

> **Catatan**: Super Admin sengaja dilarang mengakses konten internal batalion untuk menjaga prinsip otonomi dan privasi operasional.

#### Admin Pers Batalion

Hak akses terbatas pada tenant sendiri.

| Fungsi | Akses |
|---|---|
| Mengelola semua konten di tenant sendiri | ✅ |
| Final approver untuk semua konten | ✅ |
| Mengatur tampilan public site | ✅ |
| Mengelola akun Staff Pers di tenant sendiri | ✅ |
| Melihat analytics tenant sendiri | ✅ |
| Scheduled publishing | ✅ |
| Export laporan | ✅ |
| Mengakses tenant lain | ❌ |

#### Staff Pers

Hak akses terbatas pada kontribusi konten di tenant sendiri.

| Fungsi | Akses |
|---|---|
| Membuat draf konten (semua tipe) | ✅ |
| Upload media (foto, video) | ✅ |
| Submit konten ke review | ✅ |
| Edit draf sendiri (sebelum di-submit) | ✅ |
| Melihat statistik konten sendiri | ✅ |
| Menyetujui / menolak konten orang lain | ❌ |
| Menghapus konten yang sudah dipublikasi | ❌ |
| Mengubah pengaturan public site | ❌ |

---

## 4. Fitur & Persyaratan Fungsional

### 4.1 Autentikasi & Otorisasi

**FR-AUTH-001**: Sistem harus menggunakan JWT dengan payload yang menyertakan `tenant_id`, `user_id`, dan `role`.

**FR-AUTH-002**: Token JWT harus memiliki masa berlaku 8 jam untuk sesi aktif. Refresh token berlaku 30 hari.

**FR-AUTH-003**: Login harus memberlakukan rate limiting: maksimum 5 percobaan gagal dalam 15 menit dari IP yang sama, setelah itu IP dikunci 30 menit.

**FR-AUTH-004**: Sistem harus mendukung SSO berbasis organisasi (opsional, untuk integrasi masa depan).

**FR-AUTH-005**: Semua endpoint API harus memverifikasi bahwa `tenant_id` dalam JWT cocok dengan resource yang diminta.

### 4.2 Manajemen Konten

**FR-CONTENT-001**: Sistem harus mendukung tipe konten berikut:
- Berita (artikel utama)
- Kegiatan / Operasi
- Pengumuman
- Bakti Sosial & Kemanusiaan
- Sejarah & Tradisi Batalion
- Apresiasi & Prestasi
- Infografis & Data Visual
- Video Dokumenter

**FR-CONTENT-002**: Setiap konten harus memiliki atribut minimal: judul, slug, isi (rich text), kategori, tag, penulis, status, thumbnail, waktu publikasi.

**FR-CONTENT-003**: Rich Text Editor harus mendukung: heading (H1–H4), bold, italic, underline, quote, list (ordered/unordered), tabel, inline image, embed video (YouTube/Vimeo), hyperlink, dan code block.

**FR-CONTENT-004**: Slug harus di-generate otomatis dari judul dan dijamin unik per tenant.

**FR-CONTENT-005**: Sistem harus mendukung scheduled publishing dengan akurasi ±1 menit.

**FR-CONTENT-006**: Version history harus menyimpan minimal 20 revisi terakhir per artikel.

**FR-CONTENT-007**: Bulk actions yang didukung: publish, unpublish, delete, change category, assign tag.

### 4.3 Manajemen Media

**FR-MEDIA-001**: Sistem harus mendukung upload foto dengan format: JPEG, PNG, WebP. Ukuran maksimum per file: 20 MB.

**FR-MEDIA-002**: Sistem harus secara otomatis mengkonversi gambar yang diupload ke format WebP dan menghasilkan tiga ukuran: thumbnail (320px), medium (800px), large (1600px).

**FR-MEDIA-003**: Sistem harus mendukung upload video dengan format: MP4, WebM. Ukuran maksimum: 500 MB per file.

**FR-MEDIA-004**: Sistem harus mendukung watermark otomatis pada foto sesuai konfigurasi tenant (logo batalion).

**FR-MEDIA-005**: Galeri foto harus mendukung tampilan masonry grid dengan lightbox.

**FR-MEDIA-006**: Sistem harus melacak penggunaan media: berapa konten yang menggunakan file tertentu.

### 4.4 Workflow Editorial

**FR-WORKFLOW-001**: Status konten yang valid: `DRAFT` → `IN_REVIEW` → `APPROVED` → `PUBLISHED` / `REJECTED` → `DRAFT`.

**FR-WORKFLOW-002**: Staff Pers hanya dapat memindahkan konten dari `DRAFT` ke `IN_REVIEW`.

**FR-WORKFLOW-003**: Admin Pers dapat memindahkan konten dari `IN_REVIEW` ke `APPROVED`, `REJECTED`, atau langsung `PUBLISHED`.

**FR-WORKFLOW-004**: Konten yang ditolak harus disertai catatan penolakan yang wajib diisi Admin Pers.

**FR-WORKFLOW-005**: Notifikasi real-time harus dikirim kepada penulis ketika status kontennya berubah.

### 4.5 Public Site

Lihat [Seksi 9](#9-public-site-specification) untuk detail lengkap.

### 4.6 Search & Arsip

**FR-SEARCH-001**: Full-text search harus meng-index: judul, isi (strip HTML), tag, nama penulis, nama kategori.

**FR-SEARCH-002**: Filter pencarian yang tersedia: kategori, rentang tanggal, penulis, tag.

**FR-SEARCH-003**: Hasil pencarian harus menampilkan highlight pada kata kunci yang ditemukan.

**FR-SEARCH-004**: Arsip harus dapat diakses per bulan dan per tahun.

### 4.7 Analytics & Laporan

**FR-ANALYTICS-001**: Sistem harus merekam page view, unique visitor, durasi baca (estimasi), dan sumber rujukan per artikel.

**FR-ANALYTICS-002**: Dashboard Admin Batalion harus menampilkan: total artikel terbit bulan ini, total pengunjung unik 30 hari, artikel terpopuler, aktivitas staff.

**FR-ANALYTICS-003**: Super Admin harus dapat melihat perbandingan output antar batalion: jumlah artikel, pengunjung, frekuensi publikasi.

**FR-ANALYTICS-004**: Laporan harus dapat diekspor dalam format Excel (.xlsx) dan PDF.

### 4.8 Notifikasi

**FR-NOTIF-001**: Sistem harus mendukung notifikasi in-app (real-time via WebSocket).

**FR-NOTIF-002**: Notifikasi email harus dikirim untuk kejadian: konten disubmit untuk review, konten disetujui/ditolak, konten dijadwalkan akan tayang, akun baru dibuat.

**FR-NOTIF-003**: Newsletter subscription untuk pembaca public site harus mendukung optin double-confirmation via email.

---

## 5. Persyaratan Non-Fungsional

### 5.1 Performa

| Metrik | Target |
|---|---|
| Time to First Byte (TTFB) public site | < 200ms (cached) |
| Largest Contentful Paint (LCP) | < 2.5 detik |
| First Input Delay (FID) | < 100ms |
| Cumulative Layout Shift (CLS) | < 0.1 |
| API response time (P95) | < 500ms |
| API response time (P99) | < 1500ms |
| Upload throughput | Minimal 10 MB/s efektif |

### 5.2 Ketersediaan

| Metrik | Target |
|---|---|
| Uptime SLA | 99.5% per bulan |
| Planned maintenance window | Maks. 4 jam/bulan, umumnya dini hari |
| RTO (Recovery Time Objective) | < 2 jam |
| RPO (Recovery Point Objective) | < 1 jam (backup terakhir) |

### 5.3 Skalabilitas

- Sistem harus mampu mendukung hingga **500 tenant** (batalion) tanpa perubahan arsitektur.
- Setiap tenant diasumsikan memiliki hingga **50.000 artikel** yang diarsipkan.
- Concurrent user per tenant: hingga **500 pengguna public site** dan **20 pengguna admin**.

### 5.4 Keamanan

**NFR-SEC-001**: Semua komunikasi harus menggunakan TLS 1.2 minimum (TLS 1.3 diutamakan).

**NFR-SEC-002**: Password disimpan menggunakan Argon2id dengan parameter minimum: memory=65536, iterations=3, parallelism=4.

**NFR-SEC-003**: Row Level Security (RLS) harus diaktifkan di semua tabel yang menyimpan data tenant. Ini adalah lapisan keamanan wajib, bukan opsional.

**NFR-SEC-004**: Semua input pengguna harus disanitasi sebelum disimpan. Rich text harus diproses dengan DOMPurify (server-side).

**NFR-SEC-005**: File yang diupload harus divalidasi tipe MIME secara magic-byte, bukan hanya ekstensi.

**NFR-SEC-006**: Audit log harus immutable — tidak ada endpoint untuk menghapus atau mengubah log.

**NFR-SEC-007**: Secrets (API key, database password, JWT secret) harus disimpan di environment variables atau secret manager, tidak pernah di repository.

**NFR-SEC-008**: Semua endpoint API harus dilindungi CORS whitelist berbasis konfigurasi tenant domain.

### 5.5 Aksesibilitas

- Public site harus memenuhi WCAG 2.1 Level AA minimum.
- Semua gambar harus memiliki atribut alt text.
- Navigasi harus dapat dilakukan menggunakan keyboard saja.

### 5.6 Kompatibilitas Browser

| Browser | Versi Minimum |
|---|---|
| Chrome | 100+ |
| Firefox | 100+ |
| Safari | 15+ |
| Edge | 100+ |
| Mobile Chrome (Android) | 100+ |
| Mobile Safari (iOS) | 15+ |

---

## 6. Model Data

### 6.1 Entity Relationship Overview

```
Tenant (1) ──── (N) User
Tenant (1) ──── (N) Content
Tenant (1) ──── (N) Media
Tenant (1) ──── (1) SiteConfig
Content (N) ──── (N) Tag
Content (N) ──── (1) Category
Content (1) ──── (N) ContentVersion
Content (1) ──── (N) AuditLog
User (1) ──── (N) Content (sebagai author)
User (1) ──── (N) ContentVersion (sebagai editor)
```

### 6.2 Skema Tabel Utama

#### `tenants`
```sql
CREATE TABLE tenants (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          VARCHAR(50) UNIQUE NOT NULL,       -- 'kodim-123', dipakai di URL
  name          VARCHAR(200) NOT NULL,             -- 'Batalion Infanteri 123'
  custom_domain VARCHAR(255) UNIQUE,               -- 'inf123.milpers.id'
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | SUSPENDED | INACTIVE
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata      JSONB DEFAULT '{}'::jsonb
);
```

#### `users`
```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  rank          VARCHAR(100),                      -- Pangkat TNI
  nrp           VARCHAR(20) UNIQUE,                -- Nomor Registrasi Pokok
  role          VARCHAR(20) NOT NULL,              -- SUPER_ADMIN | ADMIN | STAFF
  status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, email)
);

-- RLS Policy (contoh)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

#### `categories`
```sql
CREATE TABLE categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL,
  description TEXT,
  color       VARCHAR(7),                         -- hex color, e.g. '#1a2b3c'
  icon        VARCHAR(50),                        -- icon identifier
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);
```

#### `contents`
```sql
CREATE TABLE contents (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  author_id         UUID NOT NULL REFERENCES users(id),
  category_id       UUID REFERENCES categories(id),
  title             VARCHAR(500) NOT NULL,
  slug              VARCHAR(500) NOT NULL,
  excerpt           TEXT,                         -- ringkasan otomatis/manual
  body              TEXT NOT NULL,                -- HTML disanitasi
  thumbnail_id      UUID REFERENCES media(id),
  content_type      VARCHAR(50) NOT NULL,         -- ARTICLE | EVENT | ANNOUNCEMENT | etc.
  status            VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  is_featured       BOOLEAN NOT NULL DEFAULT FALSE,
  is_breaking_news  BOOLEAN NOT NULL DEFAULT FALSE,
  view_count        BIGINT NOT NULL DEFAULT 0,
  read_time_minutes INTEGER,                      -- kalkulasi otomatis
  published_at      TIMESTAMPTZ,                  -- NULL jika belum publish
  scheduled_at      TIMESTAMPTZ,                  -- jadwal publish di masa depan
  rejected_reason   TEXT,                         -- diisi admin saat menolak
  seo_title         VARCHAR(60),
  seo_description   VARCHAR(160),
  og_image_id       UUID REFERENCES media(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, slug)
);
```

#### `content_versions`
```sql
CREATE TABLE content_versions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id  UUID NOT NULL REFERENCES contents(id) ON DELETE CASCADE,
  editor_id   UUID NOT NULL REFERENCES users(id),
  version_num INTEGER NOT NULL,
  title       VARCHAR(500) NOT NULL,
  body        TEXT NOT NULL,
  change_note TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (content_id, version_num)
);
```

#### `media`
```sql
CREATE TABLE media (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  uploader_id   UUID NOT NULL REFERENCES users(id),
  filename      VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  mime_type     VARCHAR(100) NOT NULL,
  size_bytes    BIGINT NOT NULL,
  width         INTEGER,
  height        INTEGER,
  duration_sec  INTEGER,                           -- untuk video
  storage_key   VARCHAR(500) NOT NULL,             -- path di MinIO
  thumbnail_key VARCHAR(500),
  alt_text      VARCHAR(500),
  caption       TEXT,
  usage_count   INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID REFERENCES tenants(id),        -- NULL untuk aksi Super Admin global
  actor_id    UUID REFERENCES users(id),
  actor_role  VARCHAR(20) NOT NULL,
  action      VARCHAR(100) NOT NULL,               -- 'content.publish', 'user.create', dll.
  resource    VARCHAR(50) NOT NULL,                -- 'content', 'user', 'media', dll.
  resource_id UUID,
  ip_address  INET,
  user_agent  TEXT,
  payload     JSONB DEFAULT '{}'::jsonb,           -- detail tambahan
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- TIDAK ADA updated_at dan DELETE CASCADE — immutable
);

-- Index untuk query cepat
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id, created_at DESC);
```

#### `site_configs`
```sql
CREATE TABLE site_configs (
  tenant_id         UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  site_name         VARCHAR(200),
  tagline           VARCHAR(300),
  logo_media_id     UUID REFERENCES media(id),
  favicon_media_id  UUID REFERENCES media(id),
  primary_color     VARCHAR(7),
  secondary_color   VARCHAR(7),
  hero_type         VARCHAR(20) DEFAULT 'CAROUSEL',   -- CAROUSEL | STATIC | VIDEO
  maintenance_mode  BOOLEAN NOT NULL DEFAULT FALSE,
  maintenance_msg   TEXT,
  footer_text       TEXT,
  contact_email     VARCHAR(255),
  contact_phone     VARCHAR(50),
  address           TEXT,
  lat               DECIMAL(10, 8),
  lng               DECIMAL(11, 8),
  social_links      JSONB DEFAULT '{}'::jsonb,
  comment_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  custom_css        TEXT,
  custom_js         TEXT,
  analytics_id      VARCHAR(100),                     -- Google Analytics ID
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6.3 Indeks Penting

```sql
-- Pencarian konten per tenant
CREATE INDEX idx_contents_tenant_status ON contents(tenant_id, status, published_at DESC);
CREATE INDEX idx_contents_tenant_type ON contents(tenant_id, content_type, status);
CREATE INDEX idx_contents_scheduled ON contents(scheduled_at) WHERE scheduled_at IS NOT NULL AND status = 'APPROVED';

-- Full-text search
CREATE INDEX idx_contents_fts ON contents USING GIN (
  to_tsvector('indonesian', title || ' ' || COALESCE(excerpt, ''))
);

-- Media per tenant
CREATE INDEX idx_media_tenant ON media(tenant_id, created_at DESC);
```

---

## 7. API Specification

### 7.1 Konvensi Umum

- **Base URL**: `https://api.milpers.id/v1`
- **Autentikasi**: `Authorization: Bearer <JWT>`
- **Content-Type**: `application/json` (kecuali upload multipart)
- **Tenant Context**: Dibaca dari JWT, tidak perlu dikirim ulang di setiap request
- **Pagination**: Semua endpoint list menggunakan cursor-based pagination
  ```json
  {
    "data": [...],
    "meta": {
      "total": 150,
      "cursor": "eyJpZCI6IjEyMyJ9",
      "has_next": true,
      "limit": 20
    }
  }
  ```
- **Error Format**:
  ```json
  {
    "error": {
      "code": "CONTENT_NOT_FOUND",
      "message": "Konten dengan ID tersebut tidak ditemukan",
      "details": {}
    }
  }
  ```

### 7.2 Endpoint Auth Service

```
POST   /auth/login              Login, dapat JWT + refresh token
POST   /auth/refresh            Refresh JWT menggunakan refresh token
POST   /auth/logout             Revoke refresh token
POST   /auth/forgot-password    Kirim email reset password
POST   /auth/reset-password     Reset password dengan token dari email
GET    /auth/me                 Info user saat ini
```

### 7.3 Endpoint Content Service

```
# Contents
GET    /contents                List konten (filter: status, type, category, tag, search, cursor)
POST   /contents                Buat konten baru (DRAFT)
GET    /contents/:id            Detail konten
PUT    /contents/:id            Update konten
DELETE /contents/:id            Hapus konten (soft delete, Admin only)
POST   /contents/:id/submit     Submit ke review (status: DRAFT → IN_REVIEW)
POST   /contents/:id/approve    Setujui konten (status: IN_REVIEW → APPROVED, Admin only)
POST   /contents/:id/publish    Publikasikan (status: APPROVED → PUBLISHED, Admin only)
POST   /contents/:id/reject     Tolak konten (status: IN_REVIEW → REJECTED, Admin only)
POST   /contents/:id/unpublish  Unpublish (Admin only)
GET    /contents/:id/versions   List version history
GET    /contents/:id/versions/:versionNum  Detail satu versi

# Categories
GET    /categories              List kategori tenant
POST   /categories              Buat kategori (Admin only)
PUT    /categories/:id          Update kategori (Admin only)
DELETE /categories/:id          Hapus kategori (Admin only)

# Tags
GET    /tags                    List tag tenant (dengan count)
GET    /tags/cloud              Data tag cloud (name, count, weight)

# Media
POST   /media/upload            Upload file (multipart/form-data)
GET    /media                   List media library
GET    /media/:id               Detail media
PUT    /media/:id               Update metadata (alt text, caption)
DELETE /media/:id               Hapus media (cek usage_count > 0)
GET    /media/:id/usages        Daftar konten yang menggunakan media ini
```

### 7.4 Endpoint Admin (Super Admin Only)

```
GET    /admin/tenants           List semua tenant
POST   /admin/tenants           Buat tenant baru
PUT    /admin/tenants/:id       Update tenant
POST   /admin/tenants/:id/suspend  Suspend tenant
GET    /admin/tenants/:id/stats    Statistik satu tenant
GET    /admin/analytics/global     Analytics agregat semua tenant
GET    /admin/audit-logs           Audit log global
GET    /admin/users                List semua user lintas tenant
```

### 7.5 Endpoint Public Site (Tidak Perlu Auth)

```
GET    /public/:tenantSlug/config          Konfigurasi public site
GET    /public/:tenantSlug/contents        List konten publik
GET    /public/:tenantSlug/contents/:slug  Detail konten (increment view)
GET    /public/:tenantSlug/featured        Konten unggulan (untuk hero)
GET    /public/:tenantSlug/breaking        Berita penting (ticker)
GET    /public/:tenantSlug/categories      Daftar kategori publik
GET    /public/:tenantSlug/tags            Tag cloud
GET    /public/:tenantSlug/search          Full-text search
GET    /public/:tenantSlug/archive         Arsip per bulan/tahun
GET    /public/:tenantSlug/media/gallery   Galeri foto publik
GET    /public/:tenantSlug/sitemap.xml     Sitemap XML
GET    /public/:tenantSlug/rss/:category   RSS Feed
POST   /public/:tenantSlug/newsletter      Subscribe newsletter
POST   /public/:tenantSlug/report          Kirim laporan/pengaduan
```

---

## 8. Multi-Tenancy & Keamanan

### 8.1 Strategi Isolasi Data

Sistem menggunakan pendekatan **Shared Database, Shared Schema** dengan isolasi berbasis RLS (Row Level Security) PostgreSQL.

```
Setiap tabel yang memiliki data tenant → kolom tenant_id (UUID, NOT NULL)
Setiap query database → session variable app.current_tenant_id di-set middleware
RLS policy → memfilter otomatis berdasarkan session variable
```

**Keunggulan pendekatan ini:**
- Tidak perlu sharding database sejak awal
- RLS adalah mekanisme database level, bukan hanya aplikasi
- Mudah di-audit (semua data di satu tempat)

**Risiko dan mitigasi:**
- Risiko: Bug middleware bisa salah set tenant_id → mitigasi: unit test wajib per endpoint, integration test dengan dua tenant berbeda
- Risiko: RLS bisa di-bypass oleh role superuser PostgreSQL → mitigasi: aplikasi menggunakan role database dengan privilege terbatas, bukan superuser

### 8.2 JWT Payload Structure

```json
{
  "sub": "uuid-user-id",
  "tenant_id": "uuid-tenant-id",
  "tenant_slug": "batalion-123",
  "role": "STAFF",
  "email": "budi@example.com",
  "iat": 1700000000,
  "exp": 1700028800
}
```

### 8.3 Middleware Chain (NestJS)

```
Request
  ↓
[Rate Limiter Guard]          -- throttle per IP
  ↓
[JWT Auth Guard]              -- verifikasi & decode token
  ↓
[Tenant Injection Middleware]  -- set app.current_tenant_id di DB session
  ↓
[Role Guard]                  -- cek role vs. decorator @Roles()
  ↓
[Controller Handler]
  ↓
[Response Interceptor]        -- strip field sensitif, transform shape
  ↓
Response
```

### 8.4 Audit Log Events

Semua event berikut harus di-log ke tabel `audit_logs`:

| Event | Trigger |
|---|---|
| `auth.login` | Login berhasil |
| `auth.login_failed` | Login gagal |
| `auth.logout` | Logout |
| `user.create` | Akun baru dibuat |
| `user.update` | Profil/role diubah |
| `user.deactivate` | Akun dinonaktifkan |
| `content.create` | Konten baru dibuat |
| `content.submit` | Draf di-submit |
| `content.approve` | Konten disetujui |
| `content.publish` | Konten dipublikasi |
| `content.reject` | Konten ditolak |
| `content.unpublish` | Konten di-unpublish |
| `content.delete` | Konten dihapus |
| `media.upload` | File diupload |
| `media.delete` | File dihapus |
| `site_config.update` | Konfigurasi public site diubah |
| `tenant.create` | Tenant baru dibuat |
| `tenant.suspend` | Tenant di-suspend |

---

## 9. Public Site Specification

### 9.1 Struktur Halaman

```
/:tenantSlug/                    Homepage
/:tenantSlug/berita/             Daftar berita
/:tenantSlug/berita/:slug        Detail berita
/:tenantSlug/kegiatan/           Daftar kegiatan
/:tenantSlug/pengumuman/         Daftar pengumuman
/:tenantSlug/galeri/             Galeri foto
/:tenantSlug/galeri/video/       Galeri video
/:tenantSlug/profil/             Profil batalion
/:tenantSlug/sejarah/            Sejarah batalion
/:tenantSlug/struktur/           Struktur komando
/:tenantSlug/kontak/             Kontak & lokasi
/:tenantSlug/kalender/           Kalender kegiatan
/:tenantSlug/arsip/              Arsip berita
/:tenantSlug/arsip/:year/:month  Arsip per bulan
/:tenantSlug/cari/               Halaman pencarian
/:tenantSlug/tag/:tag            Konten per tag
```

### 9.2 Homepage Components

| Komponen | Deskripsi |
|---|---|
| `HeroCarousel` | Carousel berita utama, auto-play 5 detik, bisa manual |
| `BreakingNewsTicker` | Running text pengumuman penting, bisa dikonfigurasi on/off |
| `LatestNews` | 3–5 berita terbaru dalam grid |
| `FeaturedStories` | Konten yang di-mark `is_featured`, tampilan besar |
| `QuickAccess` | Menu pintasan ke halaman utama |
| `VideoHighlight` | Satu video featured di homepage |
| `EventCalendar` | Kalender dengan kegiatan mendatang |
| `AnnouncementBox` | Kotak pengumuman terbaru |

### 9.3 Detail Artikel

Komponen yang harus ada di halaman detail artikel:

- Judul artikel
- Thumbnail/foto utama dengan caption
- Breadcrumb navigasi
- Meta: tanggal, penulis, kategori, estimasi waktu baca
- Isi artikel (rich text rendered)
- Tombol share: WhatsApp, Instagram, Facebook, X, Telegram, Email
- Tombol print-friendly
- Font size adjuster (S/M/L)
- Toggle dark/light mode (tersimpan di localStorage)
- Bagian "Baca Juga" (3 artikel related berdasarkan kategori/tag)
- Bagian "Berita Terbaru" (sidebar atau section bawah)
- Comment section (jika diaktifkan admin)

### 9.4 Galeri

**Foto Gallery:**
- Layout masonry grid responsif
- Lightbox dengan navigasi arrow dan keyboard
- Lazy loading gambar
- Tombol download foto resolusi tinggi (dengan atau tanpa watermark)
- Filter per album/kategori

**Video Gallery:**
- Thumbnail preview dengan play button overlay
- Support YouTube embed dan video self-hosted (dari MinIO)
- Player inline atau modal

### 9.5 SEO & Metadata

Setiap halaman publik harus menghasilkan:

```html
<title>{seo_title atau title} | {site_name}</title>
<meta name="description" content="{seo_description atau excerpt}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{excerpt}">
<meta property="og:image" content="{og_image atau thumbnail}">
<meta property="og:type" content="article">
<meta property="og:url" content="{canonical URL}">
<link rel="canonical" href="{canonical URL}">

<!-- JSON-LD Article Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "...",
  "image": "...",
  "datePublished": "...",
  "author": { "@type": "Person", "name": "..." },
  "publisher": { "@type": "Organization", "name": "..." }
}
</script>
```

### 9.6 PWA Configuration

```json
{
  "name": "{site_name}",
  "short_name": "{site_name}",
  "start_url": "/{tenantSlug}/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "{primary_color}",
  "icons": [
    { "src": "/icons/192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Service Worker harus meng-cache: halaman shell, aset statis, dan artikel yang sudah dibuka (stale-while-revalidate strategy).

---

## 10. Admin Dashboard Specification

### 10.1 Super Admin Dashboard

**Halaman: `/super-admin/`**
- KPI Cards: Total tenant aktif, Total artikel hari ini (lintas tenant), Total media storage digunakan
- Tabel ranking tenant: by artikel terbit bulan ini, by pengunjung
- Alert: tenant yang belum aktif > 30 hari
- Recent audit logs (global)

**Halaman: `/super-admin/tenants/`**
- Tabel semua tenant dengan status, jumlah user, jumlah artikel, tanggal terakhir aktif
- Action: Buat tenant, suspend, detail

**Halaman: `/super-admin/analytics/`**
- Grafik output konten semua tenant (time series, 30/90/365 hari)
- Perbandingan antar batalion

### 10.2 Admin Batalion Dashboard

**Halaman: `/dashboard/`**
- Content calendar (tampilan bulan/minggu) dengan konten terjadwal
- Statistik pengunjung public site (chart 30 hari)
- Antrian review: konten yang menunggu approval
- Aktivitas staff (siapa membuat apa)
- Storage usage gauge

**Halaman: `/dashboard/contents/`**
- Tabel konten dengan filter status, tipe, penulis, tanggal
- Bulk action toolbar
- Quick preview hover

**Halaman: `/dashboard/settings/`**
- Tab: Identitas Site, Hero & Banner, Navigasi, Footer, SEO Default, Domain, Lanjutan

### 10.3 Staff Dashboard

**Halaman: `/dashboard/`**
- "Drafts Saya" — konten yang belum di-submit
- "Dalam Review" — konten yang menunggu persetujuan
- "Sudah Terbit" — konten yang sudah live
- Riwayat publikasi (timeline)
- Statistik personal: total artikel, total view

---

## 11. Workflow Konten

### 11.1 State Machine

```
           ┌─────────────────────────────────────────────────────────┐
           │                         REJECTED                        │
           │                    ↗ (oleh Admin, wajib isi alasan)    │
  [Buat]→ DRAFT ──submit──→ IN_REVIEW                               │
           ↑                    ↘ (oleh Admin)                      │
           └────────────────── approve──→ APPROVED ──publish──→ PUBLISHED
                                                          ↕ (unpublish/republish)
```

### 11.2 Aturan Transisi

| Dari | Ke | Aktor | Aksi |
|---|---|---|---|
| — | DRAFT | Staff / Admin | Membuat konten baru |
| DRAFT | IN_REVIEW | Staff / Admin | Submit untuk review |
| IN_REVIEW | APPROVED | Admin | Setujui |
| IN_REVIEW | REJECTED | Admin | Tolak (wajib isi alasan) |
| REJECTED | DRAFT | Staff / Admin | Reset ke draft (edit ulang) |
| APPROVED | PUBLISHED | Admin / Sistem (scheduled) | Publikasi |
| PUBLISHED | DRAFT | Admin | Unpublish (menjadi draft kembali) |
| DRAFT | PUBLISHED | Admin | Publikasi langsung (bypass review) |

### 11.3 Scheduled Publishing

- Cron job berjalan setiap 1 menit
- Query: `SELECT * FROM contents WHERE scheduled_at <= NOW() AND status = 'APPROVED'`
- Untuk setiap baris: ubah status ke `PUBLISHED`, set `published_at = NOW()`
- Kirim notifikasi kepada author bahwa artikel sudah live

---

## 12. Integrasi Eksternal

### 12.1 Email (Transactional)

- Provider: SMTP sendiri atau layanan seperti Resend / Mailgun
- Template email menggunakan React Email
- Event yang memicu email: lihat FR-NOTIF-002

### 12.2 Storage (MinIO S3)

- Bucket per tenant: `milpers-{tenant-id}`
- Path convention: `/{year}/{month}/{uuid}.{ext}`
- Presigned URL untuk download langsung (TTL: 1 jam)
- Kebijakan retention: file tidak dihapus otomatis meski konten dihapus

### 12.3 Google Analytics

- Embed GA4 Measurement ID dari `site_configs.analytics_id`
- Injeksi otomatis ke `<head>` public site

### 12.4 Google Maps

- Embed peta di halaman Kontak menggunakan Maps Embed API
- Koordinat dari `site_configs.lat` / `site_configs.lng`

### 12.5 RSS Feed

- Format: RSS 2.0
- URL: `/{tenantSlug}/rss/` (semua) atau `/{tenantSlug}/rss/{categorySlug}`
- Update: setiap ada publikasi baru (cache-busted)
- Max items: 50 artikel terbaru

---

## 13. Deployment & Environment

### 13.1 Environment Variables Wajib

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/milpers

# Auth
JWT_SECRET=<minimum 64 karakter random>
JWT_EXPIRES_IN=8h
REFRESH_TOKEN_SECRET=<minimum 64 karakter random>
REFRESH_TOKEN_EXPIRES_IN=30d

# MinIO
MINIO_ENDPOINT=https://storage.milpers.id
MINIO_ACCESS_KEY=<key>
MINIO_SECRET_KEY=<secret>
MINIO_USE_SSL=true

# Email
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
EMAIL_FROM=noreply@milpers.id

# App
APP_URL=https://milpers.id
ALLOWED_ORIGINS=https://milpers.id,https://*.milpers.id
```

### 13.2 Struktur Deployment (Produksi)

```
Internet
  │
  ▼
[Cloudflare CDN/WAF]
  │
  ▼
[Load Balancer / Nginx]
  ├──→ [Next.js Admin Dashboard] :3000
  ├──→ [Next.js Public Site]     :3001
  ├──→ [NestJS Auth Service]     :4001
  ├──→ [NestJS Content Service]  :4002
  └──→ [MinIO Storage]           :9000
         │
         ▼
   [PostgreSQL 16]  ←→  [Redis (cache & session)]
```

### 13.3 Database Migration

- Tools: Prisma Migrate
- Setiap migrasi harus ada rollback plan
- Migrasi yang mengubah RLS policy harus diuji di staging terlebih dahulu
- Zero-downtime migration: gunakan blue-green deployment

---

## 14. Batasan & Asumsi

### 14.1 Batasan Teknis

- Sistem tidak mendukung real-time collaborative editing (dua user edit artikel bersamaan)
- Full-text search menggunakan PostgreSQL `to_tsvector` dengan `indonesian` dictionary — memerlukan postgresql-contrib
- Video processing (transcoding) tidak dilakukan server-side; video diupload as-is atau embed dari YouTube
- Comment section tidak menggunakan real-time WebSocket — menggunakan polling setiap 30 detik

### 14.2 Asumsi Bisnis

- Setiap tenant (batalion) dikelola secara mandiri; Milpers CMS tidak menyediakan layanan onboarding terpusat
- Admin Pers bertanggung jawab penuh atas keakuratan konten yang dipublikasikan
- Pembaca public site tidak perlu akun untuk membaca konten publik
- Sistem berjalan di infrastruktur yang dikelola tim internal, bukan managed cloud

---

## 15. Glosarium

| Istilah | Definisi |
|---|---|
| **Tenant** | Satu batalion atau satuan militer yang memiliki workspace terisolasi di Milpers CMS |
| **Workspace** | Lingkungan kerja eksklusif per tenant, mencakup konten, media, pengguna, dan konfigurasi |
| **RLS** | Row Level Security — fitur PostgreSQL untuk membatasi akses baris data berdasarkan kondisi |
| **JWT** | JSON Web Token — token terenkripsi yang berisi klaim identitas dan hak akses user |
| **Tenant Scoping** | Praktik menyertakan tenant_id dalam JWT agar setiap request terverifikasi ke tenant yang benar |
| **Rich Text Editor** | Editor konten dengan fitur formatting lengkap (bold, heading, tabel, gambar, dll.) |
| **Scheduled Publishing** | Fitur menjadwalkan konten untuk dipublikasikan otomatis pada waktu tertentu di masa depan |
| **PWA** | Progressive Web App — aplikasi web yang dapat diinstal di perangkat mobile seperti aplikasi native |
| **Slug** | Versi URL-friendly dari judul konten, contoh: `latihan-menembak-batalion-123` |
| **Super Admin** | Peran tertinggi, memiliki akses global ke semua tenant (monitoring, bukan konten) |
| **Admin Pers** | Perwira pers batalion dengan hak penuh atas tenant sendiri |
| **Staff Pers** | Personel pers yang membuat draf konten dan mengupload media |
| **Audit Log** | Catatan immutable dari setiap aksi penting dalam sistem |
| **Presigned URL** | URL sementara yang memberikan akses langsung ke objek di MinIO tanpa autentikasi ulang |
| **Core Web Vitals** | Metrik performa web dari Google: LCP, FID, CLS |
| **Soft Delete** | Penghapusan logis — data tidak benar-benar dihapus dari database, hanya di-flag sebagai dihapus |
