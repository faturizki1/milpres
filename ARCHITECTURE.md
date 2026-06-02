# ARCHITECTURE.md — Milpers CMS
## Dokumen Arsitektur Sistem

> **Versi**: 1.0.0-draft  
> **Tanggal**: 2026-06-02  
> **Klasifikasi**: Terbatas (Internal Development Team)

---

## Daftar Isi

1. [Gambaran Arsitektur](#1-gambaran-arsitektur)
2. [Arsitektur Aplikasi](#2-arsitektur-aplikasi)
3. [Struktur Monorepo](#3-struktur-monorepo)
4. [Service Architecture](#4-service-architecture)
5. [Database Architecture](#5-database-architecture)
6. [Storage Architecture](#6-storage-architecture)
7. [Caching Strategy](#7-caching-strategy)
8. [Security Architecture](#8-security-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [Keputusan Arsitektur (ADR)](#11-keputusan-arsitektur-adr)
12. [Dependency Graph](#12-dependency-graph)

---

## 1. Gambaran Arsitektur

Milpers CMS dibangun di atas arsitektur **monorepo dengan microservices ringan**, menggunakan Turborepo sebagai build orchestrator. Dua aplikasi Next.js (admin dashboard dan public site) mengonsumsi dua NestJS services (auth dan content) melalui REST API yang sama.

### 1.1 Diagram Arsitektur Tingkat Tinggi

```
┌─────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                              │
│                                                                     │
│  ┌───────────────────────┐     ┌─────────────────────────────────┐  │
│  │   Admin Dashboard     │     │        Public Site              │  │
│  │   (Next.js 15 SSR)    │     │   (Next.js 15 SSG/ISR)         │  │
│  │   /apps/admin/        │     │   /apps/public-site/            │  │
│  └───────────┬───────────┘     └──────────────┬──────────────────┘  │
└──────────────┼───────────────────────────────┼─────────────────────┘
               │ REST + WebSocket              │ REST (Public)
               ▼                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          API GATEWAY / NGINX                        │
│              Rate Limiting · CORS · TLS Termination                 │
└──────────────┬────────────────────────────┬────────────────────────┘
               │                            │
    ┌──────────▼──────────┐     ┌───────────▼───────────┐
    │    Auth Service      │     │    Content Service     │
    │   (NestJS :4001)     │     │   (NestJS :4002)      │
    │                      │     │                        │
    │ • Login / Logout     │     │ • CRUD Contents        │
    │ • JWT Issue/Verify   │     │ • Media Management     │
    │ • Password Reset     │     │ • Search               │
    │ • Rate Limiting      │     │ • Analytics            │
    └──────────┬───────────┘     └──────────┬────────────┘
               │                            │
               └────────────┬───────────────┘
                            │
               ┌────────────▼────────────────┐
               │    PostgreSQL 16 + RLS       │
               │    (Single Database,         │
               │     Shared Schema)           │
               └────────────┬────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
   ┌──────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
   │    Redis    │  │     MinIO    │  │  Bull MQ     │
   │   (Cache)   │  │  (Storage)   │  │  (Job Queue) │
   └─────────────┘  └──────────────┘  └──────────────┘
```

### 1.2 Prinsip Arsitektur

| Prinsip | Implementasi |
|---|---|
| **Separation of Concerns** | Auth dan Content adalah service terpisah dengan database yang sama namun concern berbeda |
| **Single Source of Truth** | Satu database PostgreSQL dengan isolasi RLS, bukan per-tenant database |
| **Stateless Services** | Auth dan Content service tidak menyimpan state lokal; semua state di PostgreSQL/Redis |
| **Edge Caching** | Public site konten-statis di-cache di Cloudflare edge node |
| **Fail Fast** | Service menggunakan circuit breaker dan tidak retry infinitely |
| **Immutable Audit** | Audit log tidak pernah di-update atau dihapus |

---

## 2. Arsitektur Aplikasi

### 2.1 Admin Dashboard (Next.js 15)

**Rendering Strategy:** Server-Side Rendering (SSR) untuk semua halaman admin — data selalu fresh, tidak di-cache di browser lain.

```
apps/admin-dashboard/
├── app/
│   ├── (auth)/                   # Route group auth (login, forgot-password)
│   │   ├── login/page.tsx
│   │   └── forgot-password/page.tsx
│   ├── (super-admin)/            # Route group Super Admin
│   │   ├── layout.tsx            # Guard: role === SUPER_ADMIN
│   │   ├── page.tsx              # Super Admin home
│   │   ├── tenants/
│   │   └── analytics/
│   └── (dashboard)/              # Route group Admin & Staff
│       ├── layout.tsx            # Guard: role === ADMIN | STAFF
│       ├── page.tsx              # Dashboard home (berbeda per role)
│       ├── contents/
│       │   ├── page.tsx          # List konten
│       │   ├── new/page.tsx      # Buat konten baru
│       │   └── [id]/
│       │       ├── edit/page.tsx
│       │       └── versions/page.tsx
│       ├── media/page.tsx
│       ├── settings/
│       │   └── page.tsx
│       └── profile/page.tsx
├── components/
│   ├── editor/                   # Rich Text Editor (Tiptap)
│   ├── media/                    # Media uploader, library browser
│   ├── content/                  # Content cards, tables, filters
│   ├── layout/                   # Sidebar, topbar, breadcrumb
│   └── ui/                       # shadcn/ui components re-export
├── lib/
│   ├── api/                      # API client functions (fetch wrappers)
│   ├── auth/                     # Session management (next-auth atau custom)
│   └── utils/
└── middleware.ts                 # Route guard, redirect unauthenticated users
```

**Komponen Kritis:**

| Komponen | Library | Keterangan |
|---|---|---|
| Rich Text Editor | Tiptap v2 | Extensible, headless, mendukung collaborative di masa depan |
| File Upload | react-dropzone + custom uploader | Multipart upload langsung ke Content Service |
| Data Tables | TanStack Table v8 | Virtual scrolling untuk list konten besar |
| Charts | Recharts | Analytics dashboard |
| Notifications | Sonner (toast) + custom WebSocket listener | Real-time notifikasi status konten |
| Date Picker | react-day-picker | Scheduled publishing |
| Form Validation | React Hook Form + Zod | Type-safe forms |

### 2.2 Public Site (Next.js 15)

**Rendering Strategy:** Kombinasi ISR (Incremental Static Regeneration) dan SSG, dengan fallback SSR untuk halaman yang tidak di-cache.

| Halaman | Strategy | Revalidate |
|---|---|---|
| Homepage | ISR | 60 detik |
| Detail artikel | ISR | 300 detik |
| Daftar konten | SSR | — (real-time filter) |
| Profil, Sejarah | SSG | Build time (jarang berubah) |
| Search results | SSR | — |
| Galeri | ISR | 120 detik |

```
apps/public-site/
├── app/
│   └── [tenantSlug]/             # Dynamic segment per batalion
│       ├── layout.tsx            # Load site config, inject theme CSS vars
│       ├── page.tsx              # Homepage
│       ├── berita/
│       │   ├── page.tsx          # List berita
│       │   └── [slug]/page.tsx   # Detail berita
│       ├── kegiatan/
│       ├── pengumuman/
│       ├── galeri/
│       │   ├── page.tsx
│       │   └── video/page.tsx
│       ├── profil/page.tsx
│       ├── sejarah/page.tsx
│       ├── struktur/page.tsx
│       ├── kontak/page.tsx
│       ├── kalender/page.tsx
│       ├── arsip/
│       │   └── [year]/[month]/page.tsx
│       └── cari/page.tsx
├── components/
│   ├── homepage/                 # HeroCarousel, LatestNews, BreakingTicker, dll.
│   ├── article/                  # ArticleBody, ShareButtons, ReadingControls
│   ├── gallery/                  # MasonryGrid, Lightbox, VideoPlayer
│   ├── search/                   # SearchBar, FilterPanel, ResultCard
│   └── layout/                   # Header, Footer, Navigation
├── lib/
│   ├── api/                      # API calls ke /public/:tenantSlug/...
│   └── theme/                    # CSS variable injection dari site_config
└── public/
    ├── sw.js                     # Service Worker (PWA)
    └── manifest.json             # Dibuat dinamis per tenant (atau satu shared)
```

---

## 3. Struktur Monorepo

```
milpers-monorepo/
├── apps/
│   ├── admin-dashboard/          # Next.js 15 — Dashboard internal
│   └── public-site/              # Next.js 15 — Situs publik per batalion
├── services/
│   ├── auth-service/             # NestJS — Autentikasi & otorisasi
│   └── content-service/          # NestJS — Konten, media, analytics
├── packages/
│   ├── database/                 # Prisma schema, migrations, seed
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── types/                    # TypeScript interfaces & enums bersama
│   │   ├── auth.types.ts
│   │   ├── content.types.ts
│   │   └── tenant.types.ts
│   ├── validators/               # Zod schemas yang dipakai di app & service
│   │   ├── content.schema.ts
│   │   └── auth.schema.ts
│   └── ui/                       # Komponen UI bersama (jika diperlukan)
├── turbo.json                    # Turborepo pipeline config
├── package.json                  # Root package.json (workspaces)
├── tsconfig.base.json            # TypeScript base config
├── .env.example
└── docker-compose.yml            # Development environment
```

### 3.1 Turborepo Pipeline

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "outputs": ["coverage/**"]
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

### 3.2 Package Dependencies

```
apps/admin-dashboard
  → packages/types
  → packages/validators
  → packages/ui (opsional)

apps/public-site
  → packages/types

services/auth-service
  → packages/database
  → packages/types
  → packages/validators

services/content-service
  → packages/database
  → packages/types
  → packages/validators
```

---

## 4. Service Architecture

### 4.1 Auth Service (NestJS)

```
services/auth-service/
├── src/
│   ├── app.module.ts
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # POST /auth/login, /refresh, /logout, dll.
│   │   ├── auth.service.ts       # Business logic
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts   # Passport JWT strategy
│   │   │   └── local.strategy.ts # Passport local strategy (email+password)
│   │   └── guards/
│   │       ├── jwt-auth.guard.ts
│   │       └── roles.guard.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   ├── tenants/
│   │   ├── tenants.module.ts
│   │   └── tenants.service.ts    # CRUD tenant (Super Admin only)
│   └── common/
│       ├── decorators/
│       │   ├── roles.decorator.ts
│       │   └── current-user.decorator.ts
│       ├── interceptors/
│       │   └── audit-log.interceptor.ts
│       └── middleware/
│           └── tenant-context.middleware.ts  # Set app.current_tenant_id
```

**JWT Strategy Detail:**

```typescript
// jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<RequestUser> {
    return {
      id: payload.sub,
      tenantId: payload.tenant_id,
      tenantSlug: payload.tenant_slug,
      role: payload.role,
      email: payload.email,
    };
  }
}
```

**Tenant Context Middleware:**

```typescript
// tenant-context.middleware.ts
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as RequestUser | undefined;
    if (user?.tenantId) {
      // Set PostgreSQL session variable untuk RLS
      await this.prisma.$executeRaw`
        SELECT set_config('app.current_tenant_id', ${user.tenantId}, true)
      `;
    }
    next();
  }
}
```

### 4.2 Content Service (NestJS)

```
services/content-service/
├── src/
│   ├── app.module.ts
│   ├── contents/
│   │   ├── contents.module.ts
│   │   ├── contents.controller.ts
│   │   ├── contents.service.ts
│   │   └── dto/
│   │       ├── create-content.dto.ts
│   │       ├── update-content.dto.ts
│   │       └── query-content.dto.ts
│   ├── media/
│   │   ├── media.module.ts
│   │   ├── media.controller.ts
│   │   ├── media.service.ts
│   │   └── processors/
│   │       └── image.processor.ts    # Sharp: resize + WebP konversi
│   ├── search/
│   │   ├── search.module.ts
│   │   └── search.service.ts         # PostgreSQL FTS wrapper
│   ├── analytics/
│   │   ├── analytics.module.ts
│   │   └── analytics.service.ts      # View count, unique visitor tracking
│   ├── scheduler/
│   │   ├── scheduler.module.ts
│   │   └── publish.scheduler.ts      # Cron: @Cron('* * * * *')
│   ├── public/
│   │   ├── public.module.ts
│   │   └── public.controller.ts      # Endpoint tanpa auth untuk public site
│   └── common/
│       ├── storage/
│       │   └── minio.service.ts      # MinIO wrapper
│       └── notifications/
│           └── notification.service.ts  # Email + in-app notif
```

**Image Processing Pipeline:**

```typescript
// image.processor.ts — dijalankan di background setelah upload
async processImage(file: Express.Multer.File, mediaId: string) {
  const sizes = [
    { name: 'thumbnail', width: 320 },
    { name: 'medium', width: 800 },
    { name: 'large', width: 1600 },
  ];

  for (const size of sizes) {
    const buffer = await sharp(file.buffer)
      .resize(size.width, null, { withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const key = `processed/${mediaId}/${size.name}.webp`;
    await this.minio.putObject(bucketName, key, buffer);
  }
}
```

**Scheduled Publish Job:**

```typescript
// publish.scheduler.ts
@Injectable()
export class PublishScheduler {
  @Cron('* * * * *')  // Setiap menit
  async publishScheduledContent() {
    const due = await this.prisma.content.findMany({
      where: {
        status: 'APPROVED',
        scheduledAt: { lte: new Date() },
      },
    });

    for (const content of due) {
      await this.prisma.$transaction([
        this.prisma.content.update({
          where: { id: content.id },
          data: { status: 'PUBLISHED', publishedAt: new Date(), scheduledAt: null },
        }),
        this.prisma.auditLog.create({
          data: {
            tenantId: content.tenantId,
            actorId: null,  // sistem, bukan user
            actorRole: 'SYSTEM',
            action: 'content.publish',
            resource: 'content',
            resourceId: content.id,
            payload: { trigger: 'scheduled' },
          },
        }),
      ]);

      await this.notificationService.notifyAuthor(content.authorId, {
        type: 'CONTENT_PUBLISHED',
        contentId: content.id,
        contentTitle: content.title,
      });
    }
  }
}
```

---

## 5. Database Architecture

### 5.1 Prisma Schema Highlights

```prisma
// packages/database/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  SUPER_ADMIN
  ADMIN
  STAFF
}

enum ContentStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  PUBLISHED
  REJECTED
}

enum ContentType {
  ARTICLE
  EVENT
  ANNOUNCEMENT
  SOCIAL
  HISTORY
  ACHIEVEMENT
  INFOGRAPHIC
  VIDEO_DOCUMENTARY
}

model Tenant {
  id           String       @id @default(uuid())
  slug         String       @unique
  name         String
  customDomain String?      @unique @map("custom_domain")
  status       String       @default("ACTIVE")
  metadata     Json         @default("{}")
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  users        User[]
  contents     Content[]
  media        Media[]
  categories   Category[]
  siteConfig   SiteConfig?
  auditLogs    AuditLog[]

  @@map("tenants")
}

model Content {
  id              String        @id @default(uuid())
  tenantId        String        @map("tenant_id")
  authorId        String        @map("author_id")
  categoryId      String?       @map("category_id")
  title           String
  slug            String
  excerpt         String?
  body            String
  contentType     ContentType   @map("content_type")
  status          ContentStatus @default(DRAFT)
  isFeatured      Boolean       @default(false) @map("is_featured")
  isBreakingNews  Boolean       @default(false) @map("is_breaking_news")
  viewCount       BigInt        @default(0) @map("view_count")
  readTimeMinutes Int?          @map("read_time_minutes")
  publishedAt     DateTime?     @map("published_at")
  scheduledAt     DateTime?     @map("scheduled_at")
  rejectedReason  String?       @map("rejected_reason")
  seoTitle        String?       @map("seo_title")
  seoDescription  String?       @map("seo_description")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  tenant          Tenant        @relation(fields: [tenantId], references: [id])
  author          User          @relation(fields: [authorId], references: [id])
  category        Category?     @relation(fields: [categoryId], references: [id])
  versions        ContentVersion[]
  tags            ContentTag[]

  @@unique([tenantId, slug])
  @@index([tenantId, status, publishedAt(sort: Desc)])
  @@index([tenantId, contentType, status])
  @@index([scheduledAt], where: "scheduled_at IS NOT NULL AND status = 'APPROVED'")
  @@map("contents")
}
```

### 5.2 Row Level Security Policies

```sql
-- Aktifkan RLS pada semua tabel tenant
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_configs ENABLE ROW LEVEL SECURITY;

-- Policy isolasi tenant (USING = untuk SELECT/UPDATE/DELETE)
CREATE POLICY rls_tenant_users ON users
  AS PERMISSIVE FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
  );

CREATE POLICY rls_tenant_contents ON contents
  AS PERMISSIVE FOR ALL
  USING (
    tenant_id = NULLIF(current_setting('app.current_tenant_id', true), '')::UUID
  );

-- Policy khusus untuk public site (konten yang PUBLISHED saja)
-- Ini di-set oleh service layer, bukan RLS langsung
-- RLS hanya sebagai safety net

-- Role database yang dipakai aplikasi: TIDAK boleh bypass RLS
CREATE ROLE milpers_app_user WITH LOGIN PASSWORD '...' NOSUPERUSER;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO milpers_app_user;
-- Pastikan role ini tidak punya BYPASSRLS
```

### 5.3 Connection Pooling

```
[NestJS Services] → [PgBouncer :5432] → [PostgreSQL :5433]
```

Konfigurasi PgBouncer:
- Mode: **transaction pooling** (paling efisien untuk workload stateless)
- Pool size per user: 20 koneksi
- Max client connections: 200

> ⚠️ **Catatan Penting**: Transaction pooling tidak kompatibel dengan `SET` statement untuk session variables yang persisten (seperti `set_config`). Solusinya adalah menggunakan `set_config(key, value, true)` dengan parameter `is_local = true` yang berlaku hanya dalam transaction, atau menggunakan session pooling mode khusus untuk koneksi yang membutuhkan session state.

**Mitigasi**: Setiap query yang memanfaatkan RLS harus dijalankan dalam satu transaction eksplisit:

```typescript
await this.prisma.$transaction(async (tx) => {
  await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
  return tx.content.findMany({ where: { status: 'PUBLISHED' } });
});
```

---

## 6. Storage Architecture

### 6.1 MinIO Bucket Structure

```
milpers-{tenant-uuid}/
├── originals/
│   ├── 2026/06/
│   │   ├── {uuid}.jpg
│   │   └── {uuid}.mp4
├── processed/
│   └── {media-uuid}/
│       ├── thumbnail.webp    (320px)
│       ├── medium.webp       (800px)
│       └── large.webp        (1600px)
└── watermarked/
    └── {media-uuid}/
        └── large-wm.webp     (dengan watermark logo batalion)
```

### 6.2 Upload Flow

```
Browser
  │ (1) POST /media/upload (multipart)
  ▼
Content Service
  │ (2) Validasi: MIME type (magic bytes), ukuran, ekstensi
  │ (3) Simpan original ke MinIO: originals/{year}/{month}/{uuid}.ext
  │ (4) Insert record ke tabel media (status: PROCESSING)
  │ (5) Enqueue job ke BullMQ: 'image:process' atau 'video:extract-thumb'
  │ (6) Return response dengan media ID (status: PROCESSING)
  ▼
BullMQ Worker (background)
  │ (7) Ambil original dari MinIO
  │ (8) Proses dengan Sharp (resize + WebP) untuk gambar
  │         atau ffmpeg thumbnail extract untuk video
  │ (9) Upload semua ukuran ke MinIO: processed/{media-uuid}/
  │ (10) Update record media: status READY, simpan keys
  ▼
Browser polling atau WebSocket push → File siap digunakan
```

### 6.3 Access Control untuk Storage

- URL MinIO tidak pernah diekspos langsung ke public
- Content Service menggenerate **presigned URL** (TTL 1 jam) untuk akses download
- Public site mengakses gambar melalui endpoint proxy:
  ```
  GET /public/:tenantSlug/media/:mediaId/thumbnail
  GET /public/:tenantSlug/media/:mediaId/medium
  GET /public/:tenantSlug/media/:mediaId/large
  ```
  Endpoint ini: verifikasi tenant, generate presigned URL, redirect 302.
- CDN (Cloudflare) meng-cache respons redirect ini berdasarkan URL, sehingga MinIO tidak dibebani langsung.

---

## 7. Caching Strategy

### 7.1 Layer Caching

```
Request untuk public site konten
  │
  ▼
[L1: Cloudflare Edge Cache]
  │ Hit → Return cached response (latency ~10ms)
  │ Miss ↓
  ▼
[L2: Next.js ISR Cache (in-memory + disk)]
  │ Hit → Return ISR cached response
  │ Miss atau revalidate ↓
  ▼
[L3: Redis (API response cache)]
  │ Hit → Content Service return cached JSON
  │ Miss ↓
  ▼
[PostgreSQL]
  └── Query + RLS → Data segar
```

### 7.2 Cache Keys & TTL

| Data | Cache Layer | TTL | Invalidasi |
|---|---|---|---|
| Homepage konten | Cloudflare + Next.js ISR | 60 detik | Publish/unpublish baru |
| Detail artikel | Cloudflare + ISR | 300 detik | Update/unpublish artikel |
| Site config | Redis | 10 menit | Saat admin save settings |
| Daftar kategori | Redis | 30 menit | Saat kategori diubah |
| Analytics aggregat | Redis | 5 menit | Time-based |
| Tag cloud | Redis | 15 menit | Saat tag berubah |
| Search results | Redis | 2 menit | Key: hash(query+filter) |

### 7.3 Cache Invalidation

```typescript
// Saat konten dipublikasi, hapus cache yang relevan
async onContentPublished(content: Content) {
  const { tenantSlug, slug, categorySlug } = content;

  // Invalidasi Redis
  await this.redis.del(`cache:${tenantSlug}:homepage`);
  await this.redis.del(`cache:${tenantSlug}:content:${slug}`);
  await this.redis.del(`cache:${tenantSlug}:category:${categorySlug}`);

  // Invalidasi Cloudflare via Purge API (jika menggunakan Cloudflare)
  await this.cloudflare.purgeCacheByUrl([
    `https://${tenantSlug}.milpers.id/`,
    `https://${tenantSlug}.milpers.id/berita/${slug}`,
  ]);

  // Trigger ISR revalidation (Next.js revalidatePath)
  await fetch(`${process.env.PUBLIC_SITE_URL}/api/revalidate`, {
    method: 'POST',
    headers: { 'x-revalidate-token': process.env.REVALIDATE_SECRET },
    body: JSON.stringify({ tenantSlug, paths: ['/', `/berita/${slug}`] }),
  });
}
```

---

## 8. Security Architecture

### 8.1 Defense in Depth Layers

```
Layer 1: Network       — Cloudflare WAF, DDoS protection
Layer 2: Transport     — TLS 1.3, HSTS
Layer 3: API Gateway   — Rate limiting (per IP, per user), CORS whitelist
Layer 4: Application   — JWT validation, Role guard, Input sanitization
Layer 5: Database      — RLS policies, least-privilege DB role
Layer 6: Audit         — Immutable audit log semua aksi kritis
```

### 8.2 Authentication Flow

```
[Browser]
  │ POST /auth/login { email, password }
  ▼
[Auth Service]
  │ 1. Rate limit check (5 attempts / 15 min per IP)
  │ 2. Find user by email (dalam tenant context atau Super Admin)
  │ 3. Verify password dengan Argon2id
  │ 4. Issue JWT (8 jam) + Refresh Token (30 hari)
  │ 5. Simpan Refresh Token hash ke Redis (key: user:{id}:refresh)
  │ 6. Log audit: auth.login
  │ 7. Return { access_token, refresh_token, user }
  ▼
[Browser]
  │ Simpan access_token di memory (bukan localStorage!)
  │ Simpan refresh_token di httpOnly cookie
  │
  │ Setiap request API:
  │   Authorization: Bearer {access_token}
  │
  │ Saat access_token expired:
  │   POST /auth/refresh (cookie dikirim otomatis)
  │   → Dapat access_token baru
```

> ⚠️ **Access token TIDAK disimpan di localStorage** — rentan XSS. Disimpan di React state / memory saja. Refresh token di httpOnly Secure SameSite=Strict cookie.

### 8.3 Input Sanitization

```typescript
// Semua rich text yang masuk harus disanitasi server-side
import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'p', 'br', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tr', 'th', 'td', 'pre', 'code',
  'iframe',  // untuk embed video, dibatasi allowlist src
];

const ALLOWED_ATTR = {
  'a': ['href', 'title', 'target', 'rel'],
  'img': ['src', 'alt', 'width', 'height'],
  'iframe': ['src', 'width', 'height', 'frameborder', 'allowfullscreen'],
  '*': ['class'],
};

// iframe src hanya boleh dari domain terpercaya
const ALLOWED_IFRAME_DOMAINS = [
  'youtube.com', 'www.youtube.com',
  'vimeo.com', 'player.vimeo.com',
];

function sanitizeBody(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORCE_BODY: true,
    // Hook untuk validasi iframe src
    RETURN_DOM_FRAGMENT: false,
  });
}
```

### 8.4 File Upload Security

```typescript
async validateUpload(file: Express.Multer.File): Promise<void> {
  // 1. Cek ukuran
  const maxSize = file.mimetype.startsWith('video/') ? 500_000_000 : 20_000_000;
  if (file.size > maxSize) throw new BadRequestException('File terlalu besar');

  // 2. Validasi MIME type via magic bytes (bukan hanya ekstensi)
  const { fileTypeFromBuffer } = await import('file-type');
  const detected = await fileTypeFromBuffer(file.buffer);

  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
  if (!detected || !allowedMimes.includes(detected.mime)) {
    throw new BadRequestException('Tipe file tidak diizinkan');
  }

  // 3. Pastikan MIME yang diklaim sesuai dengan deteksi magic bytes
  if (detected.mime !== file.mimetype) {
    throw new BadRequestException('MIME type tidak konsisten');
  }
}
```

---

## 9. Deployment Architecture

### 9.1 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: milpers_dev
      POSTGRES_USER: milpers
      POSTGRES_PASSWORD: devpassword
    ports: ['5432:5432']
    volumes: ['postgres_data:/var/lib/postgresql/data']

  redis:
    image: redis:7-alpine
    ports: ['6379:6379']

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    ports: ['9000:9000', '9001:9001']
    volumes: ['minio_data:/data']

  pgbouncer:
    image: pgbouncer/pgbouncer:latest
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_DBNAME: milpers_dev
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 100
      DEFAULT_POOL_SIZE: 20
    ports: ['5433:5432']
    depends_on: [postgres]

volumes:
  postgres_data:
  minio_data:
```

### 9.2 Produksi — Container Layout

```
Server / VPS
├── Nginx (reverse proxy + TLS termination)
│   ├── → admin.milpers.id → admin-dashboard:3000
│   ├── → milpers.id, *.milpers.id → public-site:3001
│   ├── → api.milpers.id/auth → auth-service:4001
│   └── → api.milpers.id/content → content-service:4002
│
├── Docker Containers
│   ├── admin-dashboard   (Next.js, 2 replicas)
│   ├── public-site       (Next.js, 2 replicas)
│   ├── auth-service      (NestJS, 2 replicas)
│   ├── content-service   (NestJS, 2 replicas)
│   ├── postgres          (single node, atau managed)
│   ├── pgbouncer
│   ├── redis             (single node, atau Redis Sentinel)
│   └── minio             (single node, atau MinIO cluster)
```

### 9.3 CI/CD Pipeline

```
Push ke branch feature/*
  ↓
[GitHub Actions: PR Check]
  ├── lint (semua packages)
  ├── type-check (semua packages)
  ├── test unit (services)
  └── test integration (services dengan DB test)

Merge ke main
  ↓
[GitHub Actions: Deploy to Staging]
  ├── Build Docker images (Turborepo affected only)
  ├── Push ke Container Registry
  ├── Apply Prisma migrations ke DB staging
  ├── Deploy ke staging environment
  └── Run smoke tests

Manual approval → Deploy to Production
  ↓
[GitHub Actions: Deploy to Production]
  ├── Blue-green deployment
  ├── Apply Prisma migrations (zero-downtime)
  ├── Health check
  └── Rollback otomatis jika health check gagal
```

### 9.4 Environment Tiering

| Environment | URL | Database | Notes |
|---|---|---|---|
| Development | localhost | Docker PostgreSQL lokal | Seed data lengkap |
| Staging | staging.milpers.id | Dedicated staging DB | Mirror production config |
| Production | milpers.id | Managed PostgreSQL / VPS | Backup harian, monitoring aktif |

---

## 10. Data Flow Diagrams

### 10.1 Staff Membuat & Submit Konten

```
Staff Browser
  │ 1. Buka /dashboard/contents/new
  │ 2. Isi form di Rich Text Editor (Tiptap)
  │ 3. Upload thumbnail → POST /media/upload
  │    └── Content Service: validasi, simpan MinIO, return media_id
  │ 4. Klik "Simpan Draf" → POST /contents
  │    └── Content Service: sanitize body, hitung read_time, simpan DB (status: DRAFT)
  │ 5. Review draf, lalu klik "Submit untuk Review"
  │    └── POST /contents/{id}/submit
  │    └── Content Service: ubah status DRAFT → IN_REVIEW, log audit
  │    └── Notification Service: email + in-app notif ke Admin Pers
  ▼
Admin Dashboard (Admin Pers)
  │ 6. Terima notifikasi "Ada konten baru untuk direview"
  │ 7. Buka konten, baca, klik "Setujui" atau "Tolak"
  │    ├── Setujui → POST /contents/{id}/approve
  │    │   └── Status: IN_REVIEW → APPROVED
  │    │   └── Notif ke Staff: "Konten disetujui"
  │    └── Tolak → POST /contents/{id}/reject { reason: "..." }
  │        └── Status: IN_REVIEW → REJECTED
  │        └── Notif ke Staff: "Konten ditolak: {reason}"
  │ 8. (Jika disetujui) Klik "Publikasi Sekarang" atau set jadwal
  │    ├── Segera → POST /contents/{id}/publish
  │    │   └── Status: APPROVED → PUBLISHED, publishedAt = now()
  │    └── Terjadwal → PUT /contents/{id} { scheduledAt: "2026-06-05T08:00:00" }
  │        └── Cron job akan publish otomatis saat waktunya tiba
  ▼
Public Site
  9. ISR revalidasi dipicu → halaman segar tersedia
  10. Pembaca dapat membaca artikel
```

### 10.2 Pembaca Mengakses Public Site

```
Pembaca Browser
  │ GET /{tenantSlug}/berita/{slug}
  ▼
Cloudflare CDN
  ├── Cache HIT → Return cached HTML (P50 ~10ms)
  └── Cache MISS ↓
      ▼
    Next.js Public Site
      │ ISR cache check
      ├── ISR HIT → Return ISR cached page
      └── ISR MISS ↓
          │ GET /public/{tenantSlug}/contents/{slug}
          ▼
        Content Service
          │ 1. Set tenant context via session variable
          │ 2. Query PostgreSQL (RLS filter otomatis)
          │ 3. Increment view_count (async, tidak blocking)
          │ 4. Return konten JSON
          ▼
        Next.js renders HTML → Cloudflare cache → Browser
```

---

## 11. Keputusan Arsitektur (ADR)

### ADR-001: Shared Database vs. Database per Tenant

**Status**: Diterima

**Keputusan**: Menggunakan **Shared Database, Shared Schema** dengan Row Level Security (RLS).

**Alasan**:
- Database per tenant memerlukan provisioning otomatis yang kompleks untuk 500+ tenant
- RLS PostgreSQL cukup kuat sebagai mekanisme isolasi
- Operasional lebih sederhana (satu backup, satu migration)
- Mudah menjalankan analytics global tanpa cross-database join

**Trade-off**:
- Performa query bisa terdampak jika satu tenant punya data sangat besar (mitigasi: partitioning per tenant_id jika diperlukan)
- Bug RLS bisa catastrophic (mitigasi: defense in depth, test wajib, role DB terbatas)

---

### ADR-002: Monorepo dengan Turborepo

**Status**: Diterima

**Keputusan**: Satu repository untuk semua apps, services, dan packages.

**Alasan**:
- Berbagi tipe TypeScript dan validator Zod tanpa publish npm internal
- Perubahan API contract langsung terdeteksi di TypeScript compile time
- Turborepo hanya build/test apa yang berubah (affected)
- Onboarding developer lebih mudah

**Trade-off**:
- Repo besar; CI/CD harus dikonfigurasi dengan cermat agar tidak build semua saat ada perubahan kecil
- Perlu disiplin dependency management antar package

---

### ADR-003: Tiptap sebagai Rich Text Editor

**Status**: Diterima

**Keputusan**: Menggunakan **Tiptap v2** (berbasis ProseMirror) sebagai rich text editor.

**Alasan**:
- Headless — tidak ada styling bawaan yang harus di-override
- Extensible — dapat menambahkan extension custom (misalnya embed batalion-specific)
- Output HTML (bukan JSON proprietary) — portabel dan mudah dirender
- Mendukung collaborative editing via Y.js (jika dibutuhkan di masa depan)

**Trade-off**:
- Lebih kompleks daripada Quill/TinyMCE untuk konfigurasi awal
- Perlu extension tambahan untuk fitur tabel, embed video, dll.

---

### ADR-004: ISR untuk Public Site

**Status**: Diterima

**Keputusan**: Menggunakan **Incremental Static Regeneration (ISR)** Next.js untuk public site, bukan full SSR atau full SSG.

**Alasan**:
- SSG murni tidak bisa meng-handle konten yang sering diupdate
- SSR murni terlalu mahal untuk traffic tinggi (setiap request hit database)
- ISR memberikan performa hampir seperti SSG dengan freshness yang dapat dikontrol
- Revalidation on-demand dapat dipicu dari Content Service saat ada publikasi baru

**Trade-off**:
- Stale data mungkin ada selama window revalidasi (diterima — berita pers batalion bukan real-time trading)
- Konfigurasi revalidation secret harus dijaga

---

### ADR-005: Access Token di Memory, Refresh Token di httpOnly Cookie

**Status**: Diterima

**Keputusan**: Access token JWT disimpan di React state (memori), refresh token di httpOnly Secure SameSite=Strict cookie.

**Alasan**:
- localStorage rentan terhadap serangan XSS — access token bisa dicuri oleh script malicious
- httpOnly cookie tidak dapat diakses JavaScript — lebih aman untuk refresh token yang berumur panjang
- Access token di memori otomatis hilang saat tab ditutup (lebih aman daripada persisten)

**Trade-off**:
- Access token hilang saat page refresh → harus ada mekanisme "silent refresh" menggunakan cookie saat page load
- CSRF protection harus diimplementasikan untuk endpoint yang menerima cookie (SameSite=Strict sudah membantu)

---

## 12. Dependency Graph

### 12.1 Runtime Dependencies Kunci

```
apps/admin-dashboard
  ├── next@15
  ├── react@19
  ├── @tiptap/react (rich text editor)
  ├── @tanstack/react-table (data tables)
  ├── react-hook-form + zod (forms & validation)
  ├── recharts (analytics charts)
  ├── sonner (toast notifications)
  └── packages/types, packages/validators

apps/public-site
  ├── next@15
  ├── react@19
  └── packages/types

services/auth-service
  ├── @nestjs/core@10
  ├── @nestjs/passport
  ├── passport-jwt
  ├── argon2 (password hashing)
  ├── @nestjs/throttler (rate limiting)
  └── packages/database, packages/types

services/content-service
  ├── @nestjs/core@10
  ├── @nestjs/bull (job queue)
  ├── sharp (image processing)
  ├── minio (MinIO SDK)
  ├── isomorphic-dompurify (sanitization)
  ├── file-type (MIME detection)
  └── packages/database, packages/types

packages/database
  ├── prisma@5
  └── @prisma/client@5
```

### 12.2 Infrastructure Dependencies

| Komponen | Versi | Fungsi |
|---|---|---|
| PostgreSQL | 16 | Database utama + RLS |
| Redis | 7 | Cache, session, job queue state |
| MinIO | Latest stable | Object storage (media files) |
| PgBouncer | Latest | Connection pooling PostgreSQL |
| Nginx | 1.24+ | Reverse proxy, TLS termination |
| Node.js | 22 LTS | Runtime untuk Next.js dan NestJS |
| BullMQ | 5 | Background job queue (via Redis) |

---

*Dokumen ini harus diperbarui setiap kali ada keputusan arsitektur baru yang diambil. Setiap ADR harus didiskusikan di GitHub Discussion atau meeting tim sebelum diimplementasikan.*

*Terakhir diperbarui: 2026-06-02*
